import { ACHIEVEMENTS, type AchievementMetric } from '@/data/statistics-data/achievements';
import { unlockedAchievements } from '@/data/calculations/formula-stats';
import type { Goal } from '@/types/goals.types';
import { RESOURCE_IDS, type ResourceAmounts, type ResourceId } from '@/types/resources.types';
import { decimal, deserializeDecimal, serializeDecimal } from '@/utils/decimal';
import { useWorldStore } from './store-world/_useWorldStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ResourceRecord = Record<ResourceId, ReturnType<typeof decimal>>;
const emptyResources = (): ResourceRecord => Object.fromEntries(RESOURCE_IDS.map(id => [id, decimal(0)])) as ResourceRecord;
const serializeResources = (resources: ResourceRecord) => Object.fromEntries(RESOURCE_IDS.map(id => [id, serializeDecimal(resources[id])])) as Record<ResourceId, string>;
const hydrateResources = (stored: Partial<Record<ResourceId, string>> | undefined) => Object.fromEntries(RESOURCE_IDS.map(id => [id, deserializeDecimal(stored?.[id])])) as ResourceRecord;

export interface StatsStoreState {
	bestResources: ResourceRecord;
	totalGoalsCompleted: number;
	goalsByArchetype: Record<string, number>;
	goalsByCategory: Record<string, number>;
	pomodoroSessions: number;
	pomodoroSeconds: number;
	longestPomodoroSeconds: number;
	checkIns: number;
	checkOuts: number;
	armageddons: number;
	transcensions: number;
	dragonGraveyard: { name: string; ageDays: number; diedAt: string; respawnAt: string }[];
	unlockedAchievementIds: string[];
	recordResources: (resources: ResourceAmounts) => void;
	recordGoal: (goal: Goal) => void;
	recordPomodoro: (seconds: number) => void;
	recordSurvey: (kind: 'check-in' | 'check-out') => void;
	recordPrestige: (kind: 'armageddon' | 'transcension') => void;
	recordDragonDeath: (entry: { name: string; ageDays: number; diedAt: string; respawnAt: string }) => void;
	metricValue: (metric: AchievementMetric) => number | ReturnType<typeof decimal>;
	refreshAchievements: () => string[];
	reset: () => void;
}

const initialState = () => ({
	bestResources: emptyResources(),
	totalGoalsCompleted: 0,
	goalsByArchetype: {},
	goalsByCategory: {},
	pomodoroSessions: 0,
	pomodoroSeconds: 0,
	longestPomodoroSeconds: 0,
	checkIns: 0,
	checkOuts: 0,
	armageddons: 0,
	transcensions: 0,
	dragonGraveyard: [],
	unlockedAchievementIds: [] as string[],
});

const achievementMetric = (state: Omit<StatsStoreState, 'metricValue' | 'refreshAchievements' | 'recordResources' | 'recordGoal' | 'recordPomodoro' | 'recordSurvey' | 'recordPrestige' | 'recordDragonDeath' | 'reset'>, metric: AchievementMetric) => {
	switch (metric) {
		case 'checkIn':
			return state.checkIns;
		case 'checkOut':
			return state.checkOuts;
		case 'goals':
			return state.totalGoalsCompleted;
		case 'pomodoroMinutes':
			return state.pomodoroSeconds / 60;
		case 'energy':
			return state.bestResources.energy;
		case 'darkEnergy':
			return state.bestResources.darkEnergy;
		case 'plasma':
			return state.bestResources.plasma;
		case 'anomaly':
			return state.bestResources.anomaly;
		case 'streak':
			return Math.max(0, ...Object.values(state.goalsByCategory));
		case 'armageddon':
			return state.armageddons;
		case 'transcension':
			return state.transcensions;
	}
};

export const useStatsStore = create<StatsStoreState>()(
	persist(
		(set, get) => ({
			...initialState(),
			recordResources: resources => set(state => ({ bestResources: Object.fromEntries(RESOURCE_IDS.map(id => [id, state.bestResources[id].max(resources[id])])) as ResourceRecord })),
			recordGoal: goal =>
				set(state => ({
					totalGoalsCompleted: state.totalGoalsCompleted + 1,
					goalsByArchetype: { ...state.goalsByArchetype, [goal.archetype]: (state.goalsByArchetype[goal.archetype] ?? 0) + 1 },
					goalsByCategory: { ...state.goalsByCategory, [goal.category]: (state.goalsByCategory[goal.category] ?? 0) + 1 },
				})),
			recordPomodoro: seconds => set(state => ({ pomodoroSessions: state.pomodoroSessions + 1, pomodoroSeconds: state.pomodoroSeconds + seconds, longestPomodoroSeconds: Math.max(state.longestPomodoroSeconds, seconds) })),
			recordSurvey: kind => set(state => (kind === 'check-in' ? { checkIns: state.checkIns + 1 } : { checkOuts: state.checkOuts + 1 })),
			recordPrestige: kind => set(state => (kind === 'armageddon' ? { armageddons: state.armageddons + 1 } : { transcensions: state.transcensions + 1 })),
			recordDragonDeath: entry => set(state => ({ dragonGraveyard: [entry, ...state.dragonGraveyard] })),
			metricValue: metric => achievementMetric(get(), metric),
			refreshAchievements: () => {
				const state = get();
				const unlocked = unlockedAchievements(ACHIEVEMENTS, state.unlockedAchievementIds, metric => achievementMetric(state, metric));
				const additions = unlocked.map(achievement => achievement.id);
				if (additions.length) {
					set(current => ({ unlockedAchievementIds: [...current.unlockedAchievementIds, ...additions] }));
					useWorldStore.getState().resourceStore.addResource(
						'shards',
						unlocked.reduce((total, achievement) => total + achievement.shards, 0),
					);
				}
				return additions;
			},
			reset: () => set(initialState()),
		}),
		{
			name: 'dragonfocus:stats',
			storage: createJSONStorage(() => AsyncStorage),
			partialize: state => ({ ...state, bestResources: serializeResources(state.bestResources) }),
			merge: (persisted, current) => ({ ...current, ...(persisted as Partial<StatsStoreState>), bestResources: hydrateResources((persisted as { bestResources?: Partial<Record<ResourceId, string>> }).bestResources) }),
		},
	),
);
