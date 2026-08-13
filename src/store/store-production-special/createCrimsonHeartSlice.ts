import { WORLD_CONSTANTS } from '@/constants/world.constants';
import type { AppActivity } from '@/types/world.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { ProductionSpecialSlice } from './_useProductionSpecialStore';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useProductionStore } from '../store-production/_useProductionStore';
import { DRAGON_PACT_BENEFITS } from '@/data/premium-data/premium-catalog';
import { usePremiumStore } from '../store-premium/_usePremiumStore';
import { useWorldOptionsStore } from '../store-world/createWorldOptionsSlice';

export interface CrimsonHeartStoreState {
	charge: number;
	getMaximumCharge: () => number;
	getChargeRate: () => number;
	setCharge: (charge: number) => void;
	tick: (activity: AppActivity, seconds: number) => number;
	reset: () => void;
}

const initialState = () => ({ charge: 0 });

const heartScale = () => {
	const mode = useWorldOptionsStore.getState().gameMode;
	const difficulty = WORLD_CONSTANTS.gameModes.energyMultiplier[mode];
	const premium = usePremiumStore.getState().isPremium ? DRAGON_PACT_BENEFITS.crimsonHeartMultiplier : 1;
	return difficulty * premium;
};

const maximumCharge = () => 100 * heartScale();

const crimsonHeartTarget = (activity: AppActivity) => {
	const levels = useProductionStore.getState().levels;
	const activation = (levels['crimson-activation'] ?? 0) * 0.1;
	const heartBoost = levels['crimson-heart-boost'] ?? 0;
	const baseCharge = activation + heartBoost;
	const offline = baseCharge + (levels['crimson-offline-awakening'] ?? 0);
	const offPhone = offline * (levels['crimson-off-phone-tempo'] ? 2 : 1);
	const awakening = levels['crimson-pomodoro-awakening'] ?? 0;
	const pomodoro = baseCharge * (levels['crimson-pomodoro-tempo'] ? 10 : 1) + awakening * 10;

	const target =
		activity === 'blocked-app' ? 0
		: activity === 'pomodoro' ? Math.min(100, pomodoro)
		: activity === 'pomodoro-break' ? Math.min(50, pomodoro / 2)
		: activity === 'off-app' ? Math.min(100, offPhone)
		: activity === 'allowed-app' ? offline
		: baseCharge;
	return target * heartScale();
};

/** The Crimson Heart has one responsibility: move its charge toward the activity target. */
export const useCrimsonHeartStore = create<CrimsonHeartStoreState>()(
	persist(
		(set, get) => ({
			...initialState(),
			getMaximumCharge: maximumCharge,
			getChargeRate: () => WORLD_CONSTANTS.crimsonHeartRatePerSecond * heartScale(),
			setCharge: charge => set({ charge: Math.max(0, Math.min(maximumCharge(), charge)) }),
			tick: (activity, seconds) => {
				if (!Number.isFinite(seconds) || seconds <= 0) return get().charge;
				const current = get().charge;
				const target = crimsonHeartTarget(activity);
				const charge = Math.max(0, Math.min(maximumCharge(), current + Math.sign(target - current) * Math.min(Math.abs(target - current), seconds * WORLD_CONSTANTS.crimsonHeartRatePerSecond * heartScale())));
				set({ charge });
				return charge;
			},
			reset: () => set(initialState()),
		}),
		{ name: 'dragonfocus:crimson-heart', storage: createJSONStorage(() => AsyncStorage) },
	),
);

export const createCrimsonHeartSlice: ProductionSpecialSlice<'crimsonHeart'> = () => ({ crimsonHeart: useCrimsonHeartStore });
