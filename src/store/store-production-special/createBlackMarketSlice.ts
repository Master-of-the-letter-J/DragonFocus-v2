import { DRAGON_PACT_BENEFITS } from '@/data/premium-data/premium-catalog';
import { FIXED_MARKET_BUNDLE_BY_ID, REWARDED_SHARD_AD, SHARD_PACKS, type FixedMarketBundleId } from '@/data/world-data/black-market';
import { createSpell } from '@/data/world-data/spells';
import { usePremiumStore } from '../store-premium/_usePremiumStore';
import { useWorldStore } from '../store-world/_useWorldStore';
import { scopeNestedSlice } from '../nested-slice';
import type { ProductionSpecialSlice, ProductionSpecialStoreState } from './_useProductionSpecialStore';

export interface BlackMarketStoreState {
	deliveredPurchaseIds: string[];
	rewardedShardAdStacks: number;
	rewardedShardAdLastRechargeAt: string;
	claimedRewardedShardAdIds: string[];
	purchaseFixedBundle: (id: FixedMarketBundleId) => boolean;
	deliverVerifiedShardPack: (purchase: VerifiedShardPackPurchase) => boolean;
	claimRewardedShardAd: (verifiedRewardId: string, now?: Date) => boolean;
	getRewardedShardAdClaimsRemaining: (now?: Date) => number;
	refreshRewardedShardAdStacks: (now?: Date) => number;
	reset: () => void;
}

export interface VerifiedShardPackPurchase {
	purchaseId: string;
	storeProductId: string;
	verifiedAt: string;
	source: 'revenuecat' | 'server';
}

const initialState = () => ({
	deliveredPurchaseIds: [] as string[],
	rewardedShardAdStacks: REWARDED_SHARD_AD.maxStacks,
	rewardedShardAdLastRechargeAt: new Date().toISOString(),
	claimedRewardedShardAdIds: [] as string[],
});

const rechargedAdStacks = (stacks: number, lastRechargeAt: string, now: Date) => {
	const safeStacks = Math.max(0, Math.min(REWARDED_SHARD_AD.maxStacks, Math.floor(stacks)));
	const lastRechargeAtMs = Date.parse(lastRechargeAt);
	if (safeStacks >= REWARDED_SHARD_AD.maxStacks) return { stacks: safeStacks, lastRechargeAt };
	if (!Number.isFinite(lastRechargeAtMs) || now.getTime() < lastRechargeAtMs) return { stacks: safeStacks, lastRechargeAt: now.toISOString() };
	const completedRecharges = Math.floor((now.getTime() - lastRechargeAtMs) / REWARDED_SHARD_AD.rechargeMs);
	if (!completedRecharges) return { stacks: safeStacks, lastRechargeAt };
	const nextStacks = Math.min(REWARDED_SHARD_AD.maxStacks, safeStacks + completedRecharges);
	return {
		stacks: nextStacks,
		lastRechargeAt: nextStacks >= REWARDED_SHARD_AD.maxStacks ? now.toISOString() : new Date(lastRechargeAtMs + completedRecharges * REWARDED_SHARD_AD.rechargeMs).toISOString(),
	};
};

export const createBlackMarketSlice: ProductionSpecialSlice<'blackMarket'> = (set, get) => {
	const { setSlice, getSlice, getRoot } = scopeNestedSlice<ProductionSpecialStoreState, 'blackMarket', BlackMarketStoreState>('blackMarket', set, get);

	return {
		blackMarket: {
			...initialState(),
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
			claimRewardedShardAd: (verifiedRewardId, now = new Date()) => {
				const state = getSlice();
				if (!verifiedRewardId.trim() || state.claimedRewardedShardAdIds.includes(verifiedRewardId)) return false;
				const recharged = rechargedAdStacks(state.rewardedShardAdStacks, state.rewardedShardAdLastRechargeAt, now);
				if (recharged.stacks <= 0) return false;

				useWorldStore.getState().resourceStore.addResource('shards', REWARDED_SHARD_AD.shards);
				setSlice(current => ({
					rewardedShardAdStacks: recharged.stacks - 1,
					rewardedShardAdLastRechargeAt: recharged.stacks >= REWARDED_SHARD_AD.maxStacks ? now.toISOString() : recharged.lastRechargeAt,
					claimedRewardedShardAdIds: [...current.claimedRewardedShardAdIds, verifiedRewardId],
				}));
				return true;
			},
			getRewardedShardAdClaimsRemaining: (now = new Date()) => {
				const state = getSlice();
				return rechargedAdStacks(state.rewardedShardAdStacks, state.rewardedShardAdLastRechargeAt, now).stacks;
			},
			refreshRewardedShardAdStacks: (now = new Date()) => {
				const state = getSlice();
				const recharged = rechargedAdStacks(state.rewardedShardAdStacks, state.rewardedShardAdLastRechargeAt, now);
				if (recharged.stacks !== state.rewardedShardAdStacks || recharged.lastRechargeAt !== state.rewardedShardAdLastRechargeAt) {
					setSlice({ rewardedShardAdStacks: recharged.stacks, rewardedShardAdLastRechargeAt: recharged.lastRechargeAt });
				}
				return recharged.stacks;
			},
			reset: () => setSlice(initialState()),
		},
	};
};
