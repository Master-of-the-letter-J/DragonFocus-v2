import { WORLD_CONSTANTS } from '@/constants/world.constants';
import type { AppActivity } from '@/types/world.types';
import { scopeNestedSlice } from '../nested-slice';
import type { ProductionSpecialSlice, ProductionSpecialStoreState } from './_useProductionSpecialStore';
import { useProductionStore } from '../store-production/_useProductionStore';
import { DRAGON_PACT_BENEFITS } from '@/data/premium-data/premium-catalog';
import { usePremiumStore } from '../store-premium/_usePremiumStore';
import { useWorldStore } from '../store-world/_useWorldStore';
import { useDevelopmentStore } from '../store-development/_useDevelopmentStore';

export interface CrimsonHeartStoreState {
	charge: number;
	getMaximumCharge: () => number;
	getTargetCharge: (activity: AppActivity) => number;
	getChargeRate: () => number;
	setCharge: (charge: number) => void;
	tick: (activity: AppActivity, seconds: number) => number;
	reset: () => void;
}

const initialState = () => ({ charge: 0 });

const heartScale = () => {
	const mode = useWorldStore.getState().optionsStore.gameMode;
	const difficulty = WORLD_CONSTANTS.gameModes.energyMultiplier[mode];
	const premium = usePremiumStore.getState().isPremium ? DRAGON_PACT_BENEFITS.crimsonHeartMultiplier : 1;
	return difficulty * premium;
};

const rawHeartTargets = () => {
	const levels = useProductionStore.getState().levels;
	const activation = (levels['crimson-activation'] ?? 0) * 0.1;
	const heartBoost = levels['crimson-heart-boost'] ?? 0;
	const onApp = activation + heartBoost;
	const offline = onApp + (levels['crimson-offline-awakening'] ?? 0);
	const offPhone = offline * (levels['crimson-off-phone-tempo'] ? 2 : 1);
	const pomodoroBase = 100 + (levels['crimson-pomodoro-awakening'] ?? 0) * 10;
	const pomodoro = pomodoroBase * (levels['crimson-pomodoro-tempo'] ? 10 : 1);
	return { onApp, offline, offPhone, pomodoro, pomodoroBreak: pomodoro / 2 };
};

const maximumCharge = () => {
	const targets = rawHeartTargets();
	return Math.max(targets.onApp, targets.offline, targets.offPhone, targets.pomodoro, targets.pomodoroBreak) * heartScale();
};

const crimsonHeartTarget = (activity: AppActivity) => {
	const cheats = useDevelopmentStore.getState().temporaryCheats;
	if (__DEV__ && activity === 'idle' && cheats.enabled && cheats.crimsonHeartOnAppPercent !== undefined) return maximumCharge() * (cheats.crimsonHeartOnAppPercent / 100);
	const targets = rawHeartTargets();

	const target =
		activity === 'blocked-app' ? 0
		: activity === 'pomodoro' ? targets.pomodoro
		: activity === 'pomodoro-break' ? targets.pomodoroBreak
		: activity === 'off-app' ? targets.offPhone
		: activity === 'allowed-app' ? targets.offline
		: targets.onApp;
	return target * heartScale();
};

/** The Crimson Heart has one responsibility: move its charge toward the activity target. */
export const createCrimsonHeartSlice: ProductionSpecialSlice<'crimsonHeart'> = (set, get) => {
	const { setSlice, getSlice } = scopeNestedSlice<ProductionSpecialStoreState, 'crimsonHeart', CrimsonHeartStoreState>('crimsonHeart', set, get);

	return {
		crimsonHeart: {
			...initialState(),
			getMaximumCharge: maximumCharge,
			getTargetCharge: crimsonHeartTarget,
			getChargeRate: () => WORLD_CONSTANTS.crimsonHeartRatePerSecond * heartScale(),
			setCharge: charge => setSlice({ charge: Math.max(0, Math.min(maximumCharge(), charge)) }),
			tick: (activity, seconds) => {
				if (!Number.isFinite(seconds) || seconds <= 0) return getSlice().charge;
				const current = getSlice().charge;
				const target = crimsonHeartTarget(activity);
				const charge = Math.max(0, Math.min(maximumCharge(), current + Math.sign(target - current) * Math.min(Math.abs(target - current), seconds * WORLD_CONSTANTS.crimsonHeartRatePerSecond * heartScale())));
				setSlice({ charge });
				return charge;
			},
			reset: () => setSlice(initialState()),
		},
	};
};
