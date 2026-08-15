import { DRAGON_PACT_BENEFITS } from '@/data/premium-data/premium-catalog';
import { FIXED_MARKET_BUNDLE_BY_ID, SHARD_PACKS, type FixedMarketBundleId } from '@/data/world-data/black-market';
import { createSpell } from '@/data/world-data/spells';
import { usePremiumStore } from '../store-premium/_usePremiumStore';
import { useWorldStore } from '../store-world/_useWorldStore';
import { scopeNestedSlice } from '../nested-slice';
import type { ProductionSpecialSlice, ProductionSpecialStoreState } from './_useProductionSpecialStore';

export interface BlackMarketStoreState {
	deliveredPurchaseIds: string[];
	purchaseFixedBundle: (id: FixedMarketBundleId) => boolean;
	deliverVerifiedShardPack: (purchase: VerifiedShardPackPurchase) => boolean;
}

export interface VerifiedShardPackPurchase {
	purchaseId: string;
	storeProductId: string;
	verifiedAt: string;
	source: 'revenuecat' | 'server';
}

export const createBlackMarketSlice: ProductionSpecialSlice<'blackMarket'> = (set, get) => {
	const { setSlice, getSlice, getRoot } = scopeNestedSlice<ProductionSpecialStoreState, 'blackMarket', BlackMarketStoreState>('blackMarket', set, get);

	return {
		blackMarket: {
			deliveredPurchaseIds: [],
			purchaseFixedBundle: id => {
				const bundle = FIXED_MARKET_BUNDLE_BY_ID[id];
				const resources = useWorldStore.getState().resourceStore;
				if (!bundle || !resources.spendResource('shards', bundle.shardCost)) return false;
				const rewardMultiplier = usePremiumStore.getState().isPremium ? DRAGON_PACT_BENEFITS.marketRewardMultiplier : 1;
				if (bundle.resource && bundle.resourceAmount) resources.addResource(bundle.resource, bundle.resourceAmount * rewardMultiplier);
				if (bundle.angerShields) {
					const dragon = useWorldStore.getState().dragonStore;
					dragon.setAngerShields(dragon.angerShields + Math.floor(bundle.angerShields * rewardMultiplier));
				}
				const spellCount = Math.ceil(bundle.spellCount * rewardMultiplier);
				const spells = Array.from({ length: spellCount }, () => createSpell(bundle.spellType, 3));
				spells.forEach(getRoot().spells.addSpell);
				return true;
			},
			deliverVerifiedShardPack: purchase => {
				if (!purchase.purchaseId.trim() || !Number.isFinite(Date.parse(purchase.verifiedAt)) || getSlice().deliveredPurchaseIds.includes(purchase.purchaseId)) return false;
				const pack = SHARD_PACKS.find(candidate => candidate.storeProductId === purchase.storeProductId);
				if (!pack) return false;
				const multiplier = usePremiumStore.getState().isPremium ? DRAGON_PACT_BENEFITS.marketRewardMultiplier : 1;
				useWorldStore.getState().resourceStore.addResource('shards', Math.floor(pack.shards * multiplier));
				setSlice(state => ({ deliveredPurchaseIds: [...state.deliveredPurchaseIds, purchase.purchaseId] }));
				return true;
			},
		},
	};
};
