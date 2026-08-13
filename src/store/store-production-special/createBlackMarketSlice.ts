import { DRAGON_PACT_BENEFITS } from '@/data/premium-data/premium-catalog';
import { FIXED_MARKET_BUNDLE_BY_ID, SHARD_PACKS, type FixedMarketBundleId } from '@/data/world-data/black-market';
import { createSpell } from '@/data/world-data/spells';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { usePremiumStore } from '../store-premium/_usePremiumStore';
import { useDragonStore } from '../store-world/createDragonSlice';
import { useResourceStore } from '../store-world/createResourceSlice';
import type { ProductionSpecialSlice } from './_useProductionSpecialStore';
import { useSpellsStore } from './createSpellsSlice';

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

export const useBlackMarketStore = create<BlackMarketStoreState>()(
	persist(
		(set, get) => ({
			deliveredPurchaseIds: [],
			purchaseFixedBundle: id => {
				const bundle = FIXED_MARKET_BUNDLE_BY_ID[id];
				const resources = useResourceStore.getState();
				if (!bundle || !resources.spendResource('shards', bundle.shardCost)) return false;
				const rewardMultiplier = usePremiumStore.getState().isPremium ? DRAGON_PACT_BENEFITS.marketRewardMultiplier : 1;
				if (bundle.resource && bundle.resourceAmount) resources.addResource(bundle.resource, bundle.resourceAmount * rewardMultiplier);
				if (bundle.angerShields) {
					const dragon = useDragonStore.getState();
					dragon.setAngerShields(dragon.angerShields + Math.floor(bundle.angerShields * rewardMultiplier));
				}
				const spellCount = Math.ceil(bundle.spellCount * rewardMultiplier);
				const spells = Array.from({ length: spellCount }, () => createSpell(bundle.spellType, 3));
				useSpellsStore.setState(state => ({ spellInventory: [...state.spellInventory, ...spells] }));
				return true;
			},
			deliverVerifiedShardPack: purchase => {
				if (!purchase.purchaseId.trim() || !Number.isFinite(Date.parse(purchase.verifiedAt)) || get().deliveredPurchaseIds.includes(purchase.purchaseId)) return false;
				const pack = SHARD_PACKS.find(candidate => candidate.storeProductId === purchase.storeProductId);
				if (!pack) return false;
				const multiplier = usePremiumStore.getState().isPremium ? DRAGON_PACT_BENEFITS.marketRewardMultiplier : 1;
				useResourceStore.getState().addResource('shards', Math.floor(pack.shards * multiplier));
				set(state => ({ deliveredPurchaseIds: [...state.deliveredPurchaseIds, purchase.purchaseId] }));
				return true;
			},
		}),
		{ name: 'dragonfocus:black-market', storage: createJSONStorage(() => AsyncStorage), partialize: state => ({ deliveredPurchaseIds: state.deliveredPurchaseIds }) },
	),
);

export const createBlackMarketSlice: ProductionSpecialSlice<'blackMarket'> = () => ({ blackMarket: useBlackMarketStore });
