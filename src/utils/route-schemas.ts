import { z } from 'zod';
import { fallback } from '@tanstack/zod-adapter';
import { profileEnum } from '../stores/common-store';
import { mapStyleSchema } from '../components/map/utils';
import { languageOptions } from '../components/settings-panel/settings-options';

const languageValues = languageOptions.map((opt) => opt.value) as [
  string,
  ...string[],
];
const languageEnum = z.enum(languageValues);

const willingness = z
  .number()
  .min(0)
  .max(1)
  .refine((v) => [0, 0.5, 1].includes(v), {
    message: 'must be 0, 0.5, or 1',
  });

export const searchParamsSchema = z.object({
  profile: fallback(profileEnum.optional(), 'bicycle'),
  wps: z.string().optional(),
  range: z.number().optional(),
  interval: z.number().optional(),
  generalize: z.number().optional(),
  denoise: z.number().optional(),
  style: mapStyleSchema.optional(),
  use_ferry: willingness.optional(),
  use_highways: willingness.optional(),
  use_tolls: willingness.optional(),
  alternates: z.number().int().min(0).max(5).optional(),
  lang: languageEnum.optional(),
});

export type SearchParamsSchema = z.infer<typeof searchParamsSchema>;

export const VALID_TABS = ['directions', 'isochrones', 'tiles'] as const;
export type ValidTab = (typeof VALID_TABS)[number];

export function isValidTab(tab: string): tab is ValidTab {
  return VALID_TABS.includes(tab as ValidTab);
}
