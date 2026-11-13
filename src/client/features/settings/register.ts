import type { Context } from '@deepseek-ai/cordis';
import type { ReactElement } from 'react';
import type {} from '@deepseek-ai/dsh-client-locale/client';
import { mountSettingsSection } from '../../compat/settings-section.ts';
import type { SettingsSectionProps } from '../../compat/settings-section.ts';
import { en, SETTINGS_NAMESPACE, zh } from './locales.ts';

/**
 * Register the plugin form under one dictionary as a top-level settings section.
 *
 * The theme is configured in DSH's own settings dialog only. An earlier version
 * also registered a Theme panel row in the sidebar; it is gone on purpose:
 * DSH's sidebar row stays pinned across restarts, so a theme that adds a row to
 * its own host navigation keeps returning to a place the user did not choose.
 */
export function registerSettingsPage(
  ctx: Context,
  id: string,
  component: (props: SettingsSectionProps) => ReactElement | null,
): Pick<ReturnType<Context['inject']>, 'dispose'> {
  return ctx.inject(['slots', 'locale', 'layout'], child => {
    child.effect(
      () => child.locale.register(SETTINGS_NAMESPACE, { zh, en }),
      'ccd-style: configuration page copy',
    );
    const t = child.locale.bind(SETTINGS_NAMESPACE);
    return mountSettingsSection(child, id, SETTINGS_NAMESPACE, () => t('nav'), component);
  });
}
