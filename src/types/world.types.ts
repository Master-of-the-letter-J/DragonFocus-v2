import type Decimal from 'break_infinity.js';
import type { ResourceId } from './resources.types';

export type AppActivity = 'idle' | 'pomodoro' | 'pomodoro-break' | 'allowed-app' | 'blocked-app' | 'off-app';
export type GameMode = 'invincible' | 'lock-in' | 'easy' | 'medium' | 'hard' | 'hard-plus';
export type DragonStage = 'egg' | 'hatchling' | 'dragonet' | 'juvenile' | 'young-adult' | 'grown-adult' | 'apex-adult' | 'elder-dragon' | 'sovereign-dragon' | 'great-wyrm' | 'heart-of-chaos' | 'absolute-chaos-overlord';
export type DragonFuryBand = 'calm' | 'normal' | 'angry' | 'critical' | 'supernova';
export type NexusSettingKey = 'showFury' | 'showAge' | 'showSurveyPreviews' | 'showGoalPreviews' | 'showPomodoroPreview' | 'showDragonQuotes' | 'showSpawnNarrative';

export type NexusSettings = Record<NexusSettingKey, boolean>;

export interface DragonState {
	name: string;
	stage: DragonStage;
	ageDays: number;
	fury: Decimal;
	furyThreshold: Decimal;
	maxFury: Decimal;
	isAlive: boolean;
	lastDeathAt?: string;
	deathReason?: 'fury' | 'population';
}

export interface SpellEffect {
	resource: ResourceId | 'furyReduction' | 'armageddon';
	multiplier: number;
}

export type SpellType = 'energy' | 'dark-energy' | 'calm' | 'armageddon' | 'mega' | 'plasma' | 'chaos' | 'snack-energy' | 'snack-dark-energy' | 'snack-plasma' | 'snack-chaos';
export type SpellSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Spell {
	id: string;
	name: string;
	effects: SpellEffect[];
	durationSeconds: number;
	spellType: SpellType;
	size: SpellSize;
	mega?: boolean;
}

export interface ActiveSpell extends Spell {
	remainingSeconds: number;
}
