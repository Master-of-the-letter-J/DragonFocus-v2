import type { StateCreator } from 'zustand';

export type ApocalypseType = 'sacrifice' | 'shadow' | 'freeze' | 'wrath' | 'reincarnation' | 'invasion' | 'roulette';

export interface PrestigeStoreState {
	armageddonCount: number;
	transcensionCount: number;
	titanomachyActive: boolean;
	tartarusActive: boolean;
	selectedApocalypse: ApocalypseType;
	armageddonStartedAt: string;
	completedApocalypses: ApocalypseType[];
	apocalypseLevels: Record<ApocalypseType, number>;
	anomaliesFromPlasma: string;
	setSelectedApocalypse: (type: ApocalypseType) => void;
	unlockApocalypse: (type: ApocalypseType) => boolean;
	upgradeApocalypse: (type: ApocalypseType) => boolean;
	respecApocalypseUpgrades: () => boolean;
	commitArmageddon: () => boolean;
	recordArmageddon: () => void;
	recordApocalypse: (type: ApocalypseType) => void;
	commitTranscension: () => boolean;
	recordTranscension: (plasmaAnomalies?: string) => void;
	isMonumentUnlocked: (itemId: string) => boolean;
	unlockMonument: (itemId: string) => boolean;
	isProducerSpecialUnlocked: (itemId: string) => boolean;
	unlockProducerSpecial: (itemId: string) => boolean;
	unlockDeity: (itemId: string) => boolean;
	unlockTitan: (itemId: string) => boolean;
	setTitanomachyActive: (active: boolean) => boolean;
	setTartarusActive: (active: boolean) => boolean;
	reset: () => void;
}

export const initialPrestigeState = () => ({
	armageddonCount: 0,
	transcensionCount: 0,
	titanomachyActive: false,
	tartarusActive: false,
	selectedApocalypse: 'sacrifice' as ApocalypseType,
	armageddonStartedAt: new Date().toISOString(),
	completedApocalypses: ['sacrifice'] as ApocalypseType[],
	apocalypseLevels: { sacrifice: 0, shadow: 0, freeze: 0, wrath: 0, reincarnation: 0, invasion: 0, roulette: 0 } as Record<ApocalypseType, number>,
	anomaliesFromPlasma: '0',
});

export type PrestigeSlice<Keys extends keyof PrestigeStoreState> = StateCreator<PrestigeStoreState, [], [], Pick<PrestigeStoreState, Keys>>;
