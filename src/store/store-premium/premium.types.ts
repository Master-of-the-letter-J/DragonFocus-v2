import type { StateCreator } from 'zustand';

export type PremiumPlan = 'monthly' | 'yearly' | 'lifetime';
export type PremiumVerificationSource = 'revenuecat' | 'server' | 'development';

export interface VerifiedPremiumEntitlement {
	entitlementId: 'dragon-pact';
	active: boolean;
	plan?: PremiumPlan;
	expiresAt?: string;
	verifiedAt: string;
	source: PremiumVerificationSource;
	customerId?: string;
}

export interface VerifiedAccountSession {
	userId: string;
	email?: string;
	displayName?: string;
	provider: 'google' | 'password' | 'apple';
	verifiedAt: string;
	/** One-time backend-issued grant identifier; absent for ordinary logins. */
	signupRewardGrantId?: string;
}

export interface PremiumStoreState {
	isPremium: boolean;
	plan?: PremiumPlan;
	expiresAt?: string;
	verifiedAt?: string;
	verificationSource?: PremiumVerificationSource;
	customerId?: string;
	lastEntitlementError?: string;
	account?: VerifiedAccountSession;
	redeemedSignupGrantIds: string[];
	applyVerifiedEntitlement: (entitlement: VerifiedPremiumEntitlement) => boolean;
	clearExpiredEntitlement: (now?: Date) => boolean;
	setEntitlementError: (message?: string) => void;
	applyVerifiedAccount: (account: VerifiedAccountSession) => boolean;
	signOut: () => void;
	reset: () => void;
}

export type PremiumSlice<Keys extends keyof PremiumStoreState> = StateCreator<PremiumStoreState, [], [], Pick<PremiumStoreState, Keys>>;

export const initialPremiumState = () => ({
	isPremium: false,
	plan: undefined as PremiumPlan | undefined,
	expiresAt: undefined as string | undefined,
	verifiedAt: undefined as string | undefined,
	verificationSource: undefined as PremiumVerificationSource | undefined,
	customerId: undefined as string | undefined,
	lastEntitlementError: undefined as string | undefined,
	account: undefined as VerifiedAccountSession | undefined,
	redeemedSignupGrantIds: [] as string[],
});
