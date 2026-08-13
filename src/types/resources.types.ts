import type Decimal from 'break_infinity.js';

/** Resources that can be gained, spent, converted, or tracked in prestige totals. */
export const RESOURCE_IDS = ['energy', 'darkEnergy', 'plasma', 'darkPlasma', 'anomaly', 'shards', 'chaosEnergy', 'quarks', 'microQuarks', 'fury', 'population'] as const;

export type ResourceId = (typeof RESOURCE_IDS)[number];
export type SpendableResourceId = Exclude<ResourceId, 'fury' | 'population'>;
export type ResourceAmounts = Record<ResourceId, Decimal>;
export type PersistedResourceAmounts = Record<ResourceId, string>;
