import type { Context } from '@deepseek-ai/cordis';
import type { ReactElement } from 'react';
import type { Disposer } from '../contracts/ports.ts';

/**
 * Public list slot declared by ui-settings-general's SettingsRoot.
 * Verified against the installed DSH 0.2.0-rc.2 client bundle: the navigation
 * reads id, order and label; the selected section receives close and locale t.
 * This provider is outside our SDK baseline, so keep its boundary structural.
 */
export const SETTINGS_SECTION_SLOT = 'settings.section';

export interface SettingsSectionProps {
  readonly t?: (key: string, params?: Record<string, unknown>) => string;
}

interface SettingsSectionSlots {
  inject(name: string, register: () => Disposer): Disposer;
  register(options: {
    name: string;
    id: string;
    order: number;
    label: () => string;
    locale: string;
  }, component: (props: SettingsSectionProps) => ReactElement | null): Disposer;
}

/** Register an independently navigable section once the host declares its slot. */
export function mountSettingsSection(
  ctx: Context,
  id: string,
  locale: string,
  label: () => string,
  component: (props: SettingsSectionProps) => ReactElement | null,
): Disposer {
  const slots = ctx.slots as unknown as SettingsSectionSlots;
  return slots.inject(SETTINGS_SECTION_SLOT, () => slots.register({
    name: SETTINGS_SECTION_SLOT,
    id,
    order: 20,
    label,
    locale,
  }, component));
}
