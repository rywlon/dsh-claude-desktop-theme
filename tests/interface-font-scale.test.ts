import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  adoptConfig, INTERFACE_FONT_SIZE_DEFAULT, normalizeInterfaceFontSize, resolveConfig,
} from '../src/shared/config.ts';
import { interfaceFontScale, resolveThemeTokens } from '../src/client/theme/tokens.ts';

/*
 * The interface type scale is one percentage in the plugin configuration and one
 * factor in the host override layer. The chrome steps are declared on `body`
 * (next to the factor) and every chrome rule multiplies a base size by it; the
 * transcript keeps the host's content size, so its own steps stay unscaled.
 *
 * These tests pin both halves: the configuration boundary and the stylesheet
 * contract. A future rule that hard-codes a chrome size would slip past the
 * screenshots and sit outside the control, so the stylesheet guard below
 * reports it here instead.
 */

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const CLIENT = `${ROOT}src/client`;

const tokensSheet = readFileSync(`${ROOT}src/client/theme/tokens.css`, 'utf8');

interface CssRule {
  readonly selector: string;
  readonly body: string;
}

/** Flat `selector { body }` pairs, comments removed. */
function cssRules(sheet: string): CssRule[] {
  const source = sheet.replace(/\/\*[\s\S]*?\*\//gu, '');
  return [...source.matchAll(/([^{}]+)\{([^{}]*)\}/gu)].map(([, selector, body]) => ({
    selector: (selector ?? '').trim().replace(/\s+/gu, ' '),
    body: body ?? '',
  }));
}

function cssFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...cssFiles(path));
    else if (entry.name.endsWith('.css')) files.push(path);
  }
  return files;
}

test('the interface type scale defaults to standard and survives the settings boundary', () => {
  assert.equal(INTERFACE_FONT_SIZE_DEFAULT, '100');
  assert.equal(resolveConfig().interfaceFontSize, '100');
  assert.equal(resolveConfig({ interfaceFontSize: '120' }).interfaceFontSize, '120');
  assert.equal(adoptConfig({ interfaceFontSize: '130' }).interfaceFontSize, '130');
  assert.equal(adoptConfig({ interfaceFontSize: 130 }).interfaceFontSize, '100');
  assert.equal(adoptConfig({ interfaceFontSize: '70' }).interfaceFontSize, '100');
  assert.throws(() => resolveConfig({ interfaceFontSize: 110 }), /interfaceFontSize must be a string/);
  assert.throws(() => resolveConfig({ interfaceFontSize: '20' }), /interfaceFontSize is not a usable percentage/);
});

test('the normalizer keeps one spelling and clamps nothing silently', () => {
  assert.equal(normalizeInterfaceFontSize(' 110 '), '110');
  assert.equal(normalizeInterfaceFontSize('0100'), '');
  assert.equal(normalizeInterfaceFontSize('160'), '160');
  for (const bad of ['', '100%', '79', '161', '1e2', '100.5', 110, null, undefined]) {
    assert.equal(normalizeInterfaceFontSize(bad), '', `${String(bad)} must be refused`);
  }
});

test('the factor travels through the host override layer next to the surface tokens', () => {
  assert.equal(interfaceFontScale(resolveConfig()), '1');
  assert.equal(interfaceFontScale(resolveConfig({ interfaceFontSize: '110' })), '1.1');
  assert.equal(interfaceFontScale(resolveConfig({ interfaceFontSize: '160' })), '1.6');
  assert.deepEqual(resolveThemeTokens(resolveConfig({ interfaceFontSize: '120' }))['--ccd-font-scale'],
    { light: '1.2', dark: '1.2' });
});

test('the chrome type steps are declared on body, where the factor lands', () => {
  const rules = cssRules(tokensSheet).filter(rule => rule.selector === 'html[data-dsh-ccd-style="true"] body');
  assert.equal(rules.length, 1, 'exactly one body block carries the chrome steps');
  const body = rules[0]?.body ?? '';
  for (const [token, base] of [
    ['--ccd-font-size-body', '14'],
    ['--ccd-font-size-muted', '13'],
    ['--ccd-font-size-headline', '20'],
    ['--ccd-management-control-font-size', '13'],
    ['--ccd-management-control-line-height', '20'],
  ] as const) {
    assert.match(body, new RegExp(`${token}: calc\\(${base}px \\* var\\(--ccd-font-scale, 1\\)\\)`, 'u'),
      `${token} must follow the interface scale`);
  }
  /* The transcript's own steps stay out of the body block: running text keeps
   * the host's content size, which DSH's own type setting governs. */
  for (const token of ['--ccd-font-size-h1', '--ccd-transcript-line-height']) {
    assert.doesNotMatch(body, new RegExp(`${token}\\s*:`, 'u'));
  }
});

test('no stylesheet hard-codes a chrome size outside the scale', () => {
  const literalSize = /(?<![\w-])font-size:\s*\d+(?:\.\d+)?px/u;
  const literalFont = /(?<![\w-])font:\s*[^;{}]*\d+(?:\.\d+)?px/u;
  const offenders: string[] = [];
  for (const path of cssFiles(CLIENT)) {
    const source = path.slice(CLIENT.length + 1);
    const sheet = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//gu, '');
    if (literalSize.test(sheet) || literalFont.test(sheet)) offenders.push(source);
  }
  assert.deepEqual(offenders, [],
    'chrome type sizes must be calc(Npx * var(--ccd-font-scale, 1)); only content sizes keep literal px');
});

test('a literal line-height stays with the host content size', () => {
  /* The rules that leave running text to DSH keep its 15px/24px pairing: their
   * line-height stays literal while the font-size reads --dsh-content-font-size.
   * Any other literal line-height would scale the chrome's leading by nothing. */
  const literalLine = /(?<![\w-])line-height:\s*\d+(?:\.\d+)?px/u;
  const offenders: string[] = [];
  for (const path of cssFiles(CLIENT)) {
    const sheet = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//gu, '');
    for (const [, body] of sheet.matchAll(/\{([^{}]*)\}/gu)) {
      if (!literalLine.test(body ?? '')) continue;
      if (!(body ?? '').includes('--dsh-content-font-size')) offenders.push(path.slice(CLIENT.length + 1));
    }
  }
  assert.deepEqual(offenders, [], 'literal leading must belong to a host content-size rule');
});
