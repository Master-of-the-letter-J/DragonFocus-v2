import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createEntitlementSlice, createPremiumResetSlice } from './createEntitlementSlice';
import { createAccountSlice } from './createAccountSlice';
import { initialPremiumState, type PremiumStoreState } from './premium.types';

export type { PremiumStoreState, VerifiedPremiumEntitlement } from './premium.types';

/** Cached entitlement view. Only verified provider/server results may update it. */
export const usePremiumStore = create<PremiumStoreState>()(
	persist(
		(...store) => ({
			...initialPremiumState(),
			...createEntitlementSlice(...store),
			...createAccountSlice(...store),
			...createPremiumResetSlice(...store),
		}),
		{
			name: 'dragonfocus:premium',
			storage: createJSONStorage(() => AsyncStorage),
			partialize: state => ({ isPremium: state.isPremium, plan: state.plan, expiresAt: state.expiresAt, verifiedAt: state.verifiedAt, verificationSource: state.verificationSource, customerId: state.customerId, account: state.account, redeemedSignupGrantIds: state.redeemedSignupGrantIds }),
		},
	),
);
