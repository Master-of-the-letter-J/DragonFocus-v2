export type DragonPactProductId = 'dragon-pact-monthly' | 'dragon-pact-yearly' | 'dragon-pact-lifetime';

export interface DragonPactProductDefinition {
	id: DragonPactProductId;
	storeProductId: string;
	period: 'month' | 'year' | 'lifetime';
	displayPriceUsd: string;
}

/** Display prices are informational; checkout must always use the storefront price. */
export const DRAGON_PACT_PRODUCTS: readonly DragonPactProductDefinition[] = [
	{ id: 'dragon-pact-monthly', storeProductId: 'dragon_pact_monthly', period: 'month', displayPriceUsd: '$1.99' },
	{ id: 'dragon-pact-yearly', storeProductId: 'dragon_pact_yearly', period: 'year', displayPriceUsd: '$4.99' },
	{ id: 'dragon-pact-lifetime', storeProductId: 'dragon_pact_lifetime', period: 'lifetime', displayPriceUsd: '$14.99' },
];

export const DRAGON_PACT_BENEFITS = {
	goalLimit: Number.POSITIVE_INFINITY,
	challengeLimitPerType: 15,
	crimsonHeartMultiplier: 2,
	harvestMultiplier: 2,
	goalShardCapMultiplier: 5,
	marketRewardMultiplier: 1.1,
} as const;
