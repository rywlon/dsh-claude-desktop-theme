import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client';
import type { StyleConfig } from '../../shared/config.ts';
import { BUILT_IN_DARK, BUILT_IN_SURFACES, derivePalette } from './palette.ts';

/**
 * Compose host semantic tokens and configured --ccd-* overrides as light/dark
 * pairs. The theme presenter writes the active values onto body. Configured
 * backgrounds affect light mode; dark mode uses the built-in palette. Font
 * choices apply to both schemes. Other values come from theme/tokens.css.
 */
export const THEME_OVERRIDE_SOURCE = 'dsh-ccd-style';

/** Host semantic surfaces the CCD canvas replaces. */
export const HOST_SURFACE_TOKENS = Object.freeze({
  base: '--dsw-alias-bg-base',
  sidebar: '--dsw-specific-sidebar-fill',
  border: '--dsw-alias-border-l3',
});

/** The interface type scale's factor; body inline, read by the size tokens in theme/tokens.css. */
export const FONT_SCALE_VAR = '--ccd-font-scale';

/** Host typography tokens; both drive app-wide stacks. */
export const HOST_FONT_TOKENS = Object.freeze({
  ui: '--dsw-font-family',
  code: '--ds-font-family-code',
});

/**
 * Host tokens the DeepSeek card paints: brand fills, buttons, links, layers and
 * the bubble. Values are the deepseek card of `dsh-claude-style` so host-drawn
 * controls read as the same skin as the plugin's own surfaces.
 */
const HOST_CARD_TOKENS: Readonly<Record<string, TokenModes>> = Object.freeze({
  '--dsw-alias-bg-layer-1': pair('#fbfcff', '#1b1e26'),
  '--dsw-alias-bg-layer-2': pair('#fbfcff', '#22252d'),
  '--dsw-alias-bg-layer-3': pair('#fcfdff', '#2b2f37'),
  '--dsw-alias-bg-overlay': pair('#fbfcff', '#22252d'),
  '--dsw-alias-border-l1': pair('#eceff8', '#23262e'),
  '--dsw-alias-border-l2': pair('#e2e7f4', '#2c3038'),
  '--dsw-alias-brand-primary': pair('#4d6bfe', '#4d6bfe'),
  '--dsw-alias-brand-text': pair('#fbfcff', '#f2f7ff'),
  '--dsw-alias-button-primary-fill': pair('#4d6bfe', '#4d6bfe'),
  '--dsw-alias-button-primary-hover': pair('#3d56e9', '#6a84ff'),
  '--dsw-alias-button-info-fill': pair('#4d6bfe', '#4d6bfe'),
  '--dsw-alias-button-info-hover': pair('#3d56e9', '#6a84ff'),
  '--dsw-alias-button-elevated-fill': pair('#f4f5f9', '#22252d'),
  '--dsw-alias-button-floating-fill': pair('#ffffff', '#22252d'),
  '--dsw-alias-button-floating-hover': pair('#fcfdff', '#2b2f37'),
  '--dsw-alias-interactive-bg-active': pair('rgba(95, 124, 255, .26)', 'rgba(77, 107, 254, .3)'),
  '--dsw-alias-interactive-bg-hover-solid': pair('#f0f1f4', '#2b2f37'),
  '--dsw-alias-state-business-primary': pair('#4d6bfe', '#4d6bfe'),
  '--dsw-alias-state-business-tertiary': pair('#dce4f7', '#252f4c'),
  '--dsw-alias-link': pair('#3e57e0', '#7594fd'),
  '--dsw-alias-markdown-code-block': pair('#f4f5f9', '#1b1e26'),
  '--dsw-alias-markdown-code-block-banner': pair('#f0f1f4', '#22252d'),
  '--dsw-specific-input-major': pair('#ffffff', '#0e1117'),
  '--dsw-specific-selector': pair('#fafbfe', '#2b2f37'),
  '--dsw-specific-bubble': pair('#ecf0ff', '#262b36'),
});

/**
 * The Shiki syntax palette. The host highlights fenced code through CSS
 * custom properties (ui-primitives CodeBlock); overriding them here lets one
 * syntax theme travel with the skin instead of inheriting the host's warm
 * defaults. Hues stay distinct but sit in the DeepSeek blue-green range.
 */
const SYNTAX_TOKENS: Readonly<Record<string, TokenModes>> = Object.freeze({
  '--shiki-token-constant': pair('#1f6feb', '#79b8ff'),
  '--shiki-token-string': pair('#157a52', '#7ee2a8'),
  '--shiki-token-comment': pair('#8b919c', '#8a92a3'),
  '--shiki-token-keyword': pair('#c0265c', '#ff8fb3'),
  '--shiki-token-parameter': pair('#b35c00', '#ffb86b'),
  '--shiki-token-function': pair('#6b45d6', '#c0a8ff'),
  '--shiki-token-string-expression': pair('#157a52', '#9bf0c0'),
  '--shiki-token-punctuation': pair('#5b6270', '#c9cfdb'),
  '--shiki-token-link': pair('#3b56d9', '#8fa4ff'),
});

/**
 * Fallback tails live in `theme/tokens.css` next to the built-in stacks, so the
 * composed value references them instead of copying a font list into TypeScript.
 */
const UI_FALLBACK = 'var(--ccd-font-fallback)';
const CODE_FALLBACK = 'var(--ccd-code-fallback)';

interface TokenModes { readonly light: string; readonly dark: string }

function pair(light: string, dark: string): TokenModes {
  return { light, dark };
}

/** A scheme-invariant value: the same string on both sides of the pair. */
function both(value: string): TokenModes {
  return { light: value, dark: value };
}

/** One family name per entry, in fallback order, closed by the built-in tail. */
function composeStack(names: readonly string[], fallback: string): string {
  return [...names.map(name => `"${name}"`), fallback].join(', ');
}

function surfaceTokens(config: StyleConfig): Record<string, TokenModes> {
  const { canvas, sidebar } = config.appearance;
  const palette = derivePalette(canvas, sidebar);
  const dark = BUILT_IN_DARK;
  const tokens: Record<string, TokenModes> = {
    [HOST_SURFACE_TOKENS.base]: pair(palette.canvas, dark.canvas),
    [HOST_SURFACE_TOKENS.sidebar]: pair(palette.sidebar, dark.sidebar),
    /* The built-in border is measured against the built-in canvas; only a
       configured canvas brings its own line steps, so configuring the sidebar
       alone leaves every other built-in value byte for byte. */
    [HOST_SURFACE_TOKENS.border]: pair(
      canvas === '' ? BUILT_IN_SURFACES.border : palette.border,
      dark.border,
    ),
  };
  if (canvas !== '') {
    tokens['--ccd-canvas'] = pair(palette.canvas, dark.canvas);
    tokens['--ccd-card'] = pair(palette.card, dark.card);
    tokens['--ccd-track'] = pair(palette.track, dark.track);
    tokens['--ccd-raised'] = pair(palette.raised, dark.raised);
    tokens['--ccd-hover'] = pair(palette.hover, dark.hover);
    tokens['--ccd-hover-strong'] = pair(palette.hoverStrong, dark.hoverStrong);
    tokens['--ccd-selected'] = pair(palette.selected, dark.selected);
    tokens['--ccd-border'] = pair(palette.border, dark.border);
    tokens['--ccd-border-strong'] = pair(palette.borderStrong, dark.borderStrong);
    tokens['--ccd-border-soft'] = pair(palette.borderSoft, dark.borderSoft);
    tokens['--ccd-table-head-line'] = pair(palette.tableHeadLine, dark.tableHeadLine);
  }
  if (sidebar !== '') tokens['--ccd-sidebar'] = pair(palette.sidebar, dark.sidebar);
  return tokens;
}

function fontTokens(config: StyleConfig): Record<string, TokenModes> {
  const { uiLatin, uiCjk, code } = config.fonts;
  const tokens: Record<string, TokenModes> = {};
  if (uiLatin !== '' || uiCjk !== '') {
    const stack = composeStack([uiLatin, uiCjk].filter(name => name !== ''), UI_FALLBACK);
    tokens[HOST_FONT_TOKENS.ui] = both(stack);
    tokens['--ccd-font-ui'] = both(stack);
  }
  if (code !== '') {
    const stack = composeStack([code], CODE_FALLBACK);
    tokens[HOST_FONT_TOKENS.code] = both(stack);
    tokens['--ccd-font-code'] = both(stack);
  }
  return tokens;
}

/**
 * Turn the stored percentage into the factor the stylesheet multiplies by.
 * @param config - the adopted configuration section.
 * @returns the factor as a string, e.g. `1.1` for 110.
 */
export function interfaceFontScale(config: StyleConfig): string {
  return String(Number.parseInt(config.interfaceFontSize, 10) / 100);
}

/**
 * Resolve the whole override layer for one configuration.
 * @param config - the adopted configuration section.
 * @returns token overrides keyed by custom-property name; never empty, because
 * the host surface tokens always travel with the plugin's own canvas.
 */
export function resolveThemeTokens(config: StyleConfig): ThemeTokenOverrides {
  return {
    ...surfaceTokens(config),
    ...fontTokens(config),
    ...HOST_CARD_TOKENS,
    ...SYNTAX_TOKENS,
    [FONT_SCALE_VAR]: both(interfaceFontScale(config)),
  };
}
