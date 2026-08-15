import { useWorldStore } from '../store-world/_useWorldStore';
import type { PremiumSlice } from './premium.types';

export const createAccountSlice: PremiumSlice<'account' | 'redeemedSignupGrantIds' | 'applyVerifiedAccount' | 'signOut'> = set => ({
	account: undefined,
	redeemedSignupGrantIds: [],
	applyVerifiedAccount: account => {
		if (!account.userId.trim() || !Number.isFinite(Date.parse(account.verifiedAt))) return false;
		let grantSignupReward = false;
		set(state => {
			grantSignupReward = Boolean(account.signupRewardGrantId && !state.redeemedSignupGrantIds.includes(account.signupRewardGrantId));
			return {
				account,
				redeemedSignupGrantIds: grantSignupReward ? [...state.redeemedSignupGrantIds, account.signupRewardGrantId!] : state.redeemedSignupGrantIds,
			};
		});
		if (grantSignupReward) useWorldStore.getState().resourceStore.addResource('shards', 50);
		return true;
	},
	signOut: () => set({ account: undefined }),
});
