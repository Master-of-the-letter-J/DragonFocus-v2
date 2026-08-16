import type { SpellType } from '@/types/world.types';

export type FixedMarketBundleId = 'energy-small' | 'energy-medium' | 'energy-large' | 'dark-energy-small' | 'dark-energy-medium' | 'dark-energy-large' | 'fury-small' | 'fury-medium' | 'fury-large' | 'mega-small' | 'mega-medium' | 'mega-large';

export interface FixedMarketBundle {
	id: FixedMarketBundleId;
	shardCost: number;
	resource?: 'energy' | 'darkEnergy';
	resourceAmount?: number;
	angerShields?: number;
	spellType: Extract<SpellType, 'energy' | 'dark-energy' | 'calm' | 'mega'>;
	spellCount: number;
}

export const FIXED_MARKET_BUNDLES: readonly FixedMarketBundle[] = [
	{ id: 'energy-small', shardCost: 150, resource: 'energy', resourceAmount: 10_000, spellType: 'energy', spellCount: 5 },
	{ id: 'energy-medium', shardCost: 1_250, resource: 'energy', resourceAmount: 100_000, spellType: 'energy', spellCount: 50 },
	{ id: 'energy-large', shardCost: 10_000, resource: 'energy', resourceAmount: 1_000_000, spellType: 'energy', spellCount: 500 },
	{ id: 'dark-energy-small', shardCost: 150, resource: 'darkEnergy', resourceAmount: 30, spellType: 'dark-energy', spellCount: 5 },
	{ id: 'dark-energy-medium', shardCost: 1_250, resource: 'darkEnergy', resourceAmount: 300, spellType: 'dark-energy', spellCount: 50 },
	{ id: 'dark-energy-large', shardCost: 10_000, resource: 'darkEnergy', resourceAmount: 3_000, spellType: 'dark-energy', spellCount: 500 },
	{ id: 'fury-small', shardCost: 150, angerShields: 50, spellType: 'calm', spellCount: 5 },
	{ id: 'fury-medium', shardCost: 1_250, angerShields: 500, spellType: 'calm', spellCount: 50 },
	{ id: 'fury-large', shardCost: 10_000, angerShields: 5_000, spellType: 'calm', spellCount: 500 },
	{ id: 'mega-small', shardCost: 150, spellType: 'mega', spellCount: 6 },
	{ id: 'mega-medium', shardCost: 1_250, spellType: 'mega', spellCount: 60 },
	{ id: 'mega-large', shardCost: 10_000, spellType: 'mega', spellCount: 600 },
];

export const FIXED_MARKET_BUNDLE_BY_ID = Object.fromEntries(FIXED_MARKET_BUNDLES.map(bundle => [bundle.id, bundle])) as Record<FixedMarketBundleId, FixedMarketBundle>;

export const REWARDED_SHARD_AD = {
	shards: 5,
	maxStacks: 3,
	rechargeMs: 3 * 60 * 60 * 1_000,
} as const;

export const SHARD_PACKS = [
	{ id: 'shards-099', storeProductId: 'shards_160', displayPriceUsd: '$0.99', shards: 160 },
	{ id: 'shards-499', storeProductId: 'shards_1000', displayPriceUsd: '$4.99', shards: 1_000 },
	{ id: 'shards-999', storeProductId: 'shards_2400', displayPriceUsd: '$9.99', shards: 2_400 },
	{ id: 'shards-1999', storeProductId: 'shards_5000', displayPriceUsd: '$19.99', shards: 5_000, badge: 'Recommended' },
	{ id: 'shards-4999', storeProductId: 'shards_13000', displayPriceUsd: '$49.99', shards: 13_000, badge: 'Great Value' },
	{ id: 'shards-9999', storeProductId: 'shards_28000', displayPriceUsd: '$99.99', shards: 28_000, badge: 'Best Value' },
] as const;
