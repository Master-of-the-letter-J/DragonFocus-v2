import type { ProductionStoreState } from '@/store/store-production/_useProductionStore';
import type { AmplifierStoreState } from '@/store/store-production/createAmplifierSlice';
import type { GoalMultiplierStoreState } from '@/store/store-production/createGoalMultiplierSlice';
import type { MonumentsStoreState } from '@/store/store-production-special/createMonumentsSlice';
import type { ProducerStoreState } from '@/store/store-production/createProducerSlice';
import type { RespecStoreState } from '@/store/store-production/createRespecSlice';
import type { ProductivityStoreState } from '@/store/store-productivity/_useProductivityStore';
import type { WorldStoreState } from '@/store/store-world/_useWorldStore';
import type { ConvertorStoreState } from '@/store/store-production-special/createConvertorSlice';
import type { CrimsonHeartStoreState } from '@/store/store-production-special/createCrimsonHeartSlice';
import type { DestructionStoreState } from '@/store/store-world/createDestructionSlice';
import type { DragonStoreState } from '@/store/store-world/createDragonSlice';
import type { PopulationStoreState } from '@/store/store-world/createPopulationSlice';
import type { PrestigeStoreState } from '@/store/store-prestige/_usePrestigeStore';
import type { SpellsStoreState } from '@/store/store-production-special/createSpellsSlice';
import type { WorldOptionsStoreState } from '@/store/store-world/createWorldOptionsSlice';
import type { AppStoreState } from '@/store/useAppStore';
import type { GoalStoreState } from '@/store/store-productivity/createGoalSlice';
import type { OfflineProgressStoreState } from '@/store/store-offline-progress/_useOfflineProgressStore';
import type { OnlineProgressStoreState } from '@/store/store-online-progress/_useOnlineProgressStore';
import type { PomodoroStoreState } from '@/store/store-productivity/createPomodoroSlice';
import type { ResourceStoreState } from '@/store/store-world/createResourceSlice';
import type { StatsStoreState } from '@/store/useStatsStore';
import type { PremiumStoreState } from '@/store/store-premium/_usePremiumStore';
import type { BlackMarketStoreState } from '@/store/store-production-special/createBlackMarketSlice';
import type { SurveyStoreState } from '@/store/store-productivity/createSurveySlice';
import type Decimal from 'break_infinity.js';

export type AppStoreStateUnion =
	| AppStoreState
	| GoalStoreState
	| OfflineProgressStoreState
	| OnlineProgressStoreState
	| PomodoroStoreState
	| ProductionStoreState
	| ProducerStoreState
	| AmplifierStoreState
	| GoalMultiplierStoreState
	| MonumentsStoreState
	| RespecStoreState
	| ProductivityStoreState
	| ResourceStoreState
	| StatsStoreState
	| PremiumStoreState
	| BlackMarketStoreState
	| SurveyStoreState
	| WorldStoreState
	| WorldOptionsStoreState
	| PrestigeStoreState
	| CrimsonHeartStoreState
	| ConvertorStoreState
	| DestructionStoreState
	| DragonStoreState
	| PopulationStoreState
	| SpellsStoreState;

type Scalar = number | boolean;
type LeafPath<Value, Target extends Scalar, Prefix extends string = ''> =
	Value extends Target ? Prefix
	: Value extends Decimal | Date | readonly unknown[] | ((...args: never[]) => unknown) ? never
	: Value extends object ?
		{
			[Key in Extract<keyof Value, string>]: LeafPath<Value[Key], Target, Prefix extends '' ? Key : `${Prefix}.${Key}`>;
		}[Extract<keyof Value, string>]
	:	never;

export type AppNumberType<Store extends object = AppStoreStateUnion> = LeafPath<Store, number>;
export type AppBooleanType<Store extends object = AppStoreStateUnion> = LeafPath<Store, boolean>;

const valueAtPath = (state: object, path: string): unknown => path.split('.').reduce<unknown>((value, key) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined), state);

export const getAppNumber = <Store extends object>(state: Store, path: AppNumberType<Store>) => {
	const value = valueAtPath(state, path);
	return typeof value === 'number' ? value : undefined;
};

export const getAppBoolean = <Store extends object>(state: Store, path: AppBooleanType<Store>) => {
	const value = valueAtPath(state, path);
	return typeof value === 'boolean' ? value : undefined;
};

export const isAppNumberGreaterThan = (left: number | undefined, right: number) => left !== undefined && left > right;
export const isAppNumberLessThan = (left: number | undefined, right: number) => left !== undefined && left < right;
export const isAppNumberEqualTo = (left: number | undefined, right: number) => left !== undefined && left === right;
export const isAppBooleanEqualTo = (left: boolean | undefined, right: boolean) => left !== undefined && left === right;
