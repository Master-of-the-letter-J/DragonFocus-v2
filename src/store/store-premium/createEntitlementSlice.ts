import { initialPremiumState, type PremiumSlice } from './premium.types';

export const createEntitlementSlice: PremiumSlice<'applyVerifiedEntitlement' | 'clearExpiredEntitlement' | 'setEntitlementError'> = (set, get) => ({
	applyVerifiedEntitlement: entitlement => {
		if (entitlement.entitlementId !== 'dragon-pact' || !Number.isFinite(Date.parse(entitlement.verifiedAt))) return false;
		const expired = Boolean(entitlement.expiresAt && Date.parse(entitlement.expiresAt) <= Date.now());
		set({
			isPremium: entitlement.active && !expired,
			plan: entitlement.active && !expired ? entitlement.plan : undefined,
			expiresAt: entitlement.expiresAt,
			verifiedAt: entitlement.verifiedAt,
			verificationSource: entitlement.source,
			customerId: entitlement.customerId,
			lastEntitlementError: undefined,
		});
		return true;
	},
	clearExpiredEntitlement: (now = new Date()) => {
		const expiresAt = get().expiresAt;
		if (!expiresAt || Date.parse(expiresAt) > now.getTime()) return false;
		set({ isPremium: false, plan: undefined });
		return true;
	},
	setEntitlementError: lastEntitlementError => set({ lastEntitlementError }),
});

export const createPremiumResetSlice: PremiumSlice<'reset'> = set => ({ reset: () => set(initialPremiumState()) });
