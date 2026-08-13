import type { AppActivity } from '@/types/world.types';
import { decimal } from '@/utils/decimal';
import { useOffline } from '../store-offline-progress/_useOfflineProgressStore';
import { useGoalStore } from '../store-productivity/createGoalSlice';

export const onlineLog10 = (value: ReturnType<typeof decimal>) => (value.lte(0) ? 0 : Math.max(0, value.log10()));

export const activeStreakCount = () =>
	useGoalStore
		.getState()
		.incompleteHabits.filter(goal => goal.streakState === 'active')
		.reduce((total, goal) => total + goal.streak, 0);

export const pomodoroMultiplier = (levels: Record<string, number>, activity: AppActivity, ...ids: string[]) => {
	const offline = activity === 'off-app' || activity === 'allowed-app';
	if (activity !== 'pomodoro' && !offline) return decimal(1);
	const selectedOfflineBoosts = useOffline.getState().activeBoostIds;
	const eligibleIds = ids.filter(id => {
		if (!offline) return true;
		if (id === 'dual-boost') return selectedOfflineBoosts.length >= 2;
		if (id === 'trio-boost') return selectedOfflineBoosts.length >= 3;
		return selectedOfflineBoosts.includes(id);
	});
	return eligibleIds.reduce(
		(multiplier, id) =>
			multiplier.times(
				decimal(
					id === 'chaos-gambit' ? 10
					: id === 'chaos-boost' ? 2
					: id === 'age-boost' ? 1.1
					: id === 'armory-boost' ? 1.25
					: id === 'dual-boost' || id === 'trio-boost' ? 1.5
					: 1.25,
				).pow(levels[id] ?? 0),
			),
		decimal(1),
	);
};
