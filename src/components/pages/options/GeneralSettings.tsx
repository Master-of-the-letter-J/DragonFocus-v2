import { TemporaryCheats } from '@/components/features/development/TemporaryCheats';
import { SettingSlider, ToggleRow } from '@/components/pages/options/SettingsControls';
import { ActionButton, Card, Chip, PageIntro, SectionTitle, uiStyles } from '@/components/ui/DragonUI';
import { useProductionStore } from '@/store/store-production/_useProductionStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import { useAppStore } from '@/store/useAppStore';
import type { GameMode } from '@/types/world.types';
import { useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { styles } from './options.styles';

const MODES: readonly { id: GameMode; label: string; milestone: number; summary: string }[] = [
	{ id: 'easy', label: 'Easy', milestone: 0, summary: 'Normal production, population, harvests, and Fury.' },
	{ id: 'invincible', label: 'Invincible', milestone: 1, summary: '×½ Heart and Dark Energy harvests; Fury is paused.' },
	{ id: 'lock-in', label: 'Lock-In', milestone: 2, summary: 'Production and population pause; rewards remain hidden; Fury is paused.' },
	{ id: 'medium', label: 'Medium', milestone: 2, summary: '×2 Heart, Dark Energy harvests, Fury gain, and Fury cap.' },
	{ id: 'hard', label: 'Hard', milestone: 3, summary: '×4 Heart and Dark Energy harvests; Fury rules tighten and surveys are required.' },
	{ id: 'hard-plus', label: 'Hard+', milestone: 3, summary: '×6 Heart and Dark Energy harvests; only Hard+ and Lock-In remain selectable while the dragon lives.' },
];

export function GeneralSettings() {
	const app = useAppStore();
	const world = useWorldStore(state => state.optionsStore);
	const setDragon = useWorldStore(state => state.resourceStore.setDragon);
	const milestone = useProductionStore(state => state.unlockState.milestone);
	const [timerDays, setTimerDays] = useState('1');
	const selectedMode = MODES.find(mode => mode.id === world.gameMode)!;
	const chooseMode = (mode: GameMode) => {
		world.setGameMode(mode);
		if (mode === 'lock-in') app.setNoSpritesMode(true);
	};
	const startTimer = (nuclear: boolean) => {
		const days = Number(timerDays);
		if (!Number.isFinite(days) || days <= 0) return;
		const begin = () => world.startGameModeTimer(days, nuclear);
		if (nuclear) Alert.alert('Start an unstoppable nuclear timer?', 'This timer cannot be stopped while the dragon lives and is capped at seven days.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Start nuclear timer', style: 'destructive', onPress: begin }]);
		else begin();
	};
	const autoKillDragon = () => Alert.alert('Kill the dragon?', 'This ends Hard+ and any nuclear mode timer. Dragon-death consequences cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Kill dragon', style: 'destructive', onPress: () => { setDragon({ isAlive: false, deathReason: 'fury', lastDeathAt: new Date().toISOString() }); world.stopGameModeTimer(); world.setGameMode('easy'); } }]);
	return (
		<>
			<PageIntro eyebrow="⚙ Make it yours" title="General Options" description="Audio, appearance, game modes, interface rules, and account controls." />
			<Card>
				<SectionTitle title="Audio" detail="Tap either slider track to set an exact level from 0 to 100." />
				<SettingSlider label="Music volume" value={app.musicVolume} onChange={app.setMusicVolume} />
				<SettingSlider label="Sound effects volume" value={app.soundEffectsVolume} onChange={app.setSoundEffectsVolume} />
			</Card>
			<Card>
				<SectionTitle title="Theme & brightness" />
				<View style={uiStyles.wrap}>{(['system', 'light', 'dark'] as const).map(theme => <Chip key={theme} label={theme} selected={app.theme === theme} onPress={() => app.setTheme(theme)} />)}</View>
				<SettingSlider label="Brightness" value={(app.brightness - 0.5) / 0.7} onChange={value => app.setBrightness(0.5 + value * 0.7)} />
			</Card>
			<Card>
				<SectionTitle title="Background & dragon cosmetic" detail="These choices are persisted so upcoming art packs can use the same settings." />
				<Text style={styles.fieldLabel}>Background</Text>
				<View style={uiStyles.wrap}>{(['nexus', 'ember', 'void'] as const).map(background => <Chip key={background} label={background} selected={app.backgroundStyle === background} onPress={() => app.setBackgroundStyle(background)} />)}</View>
				<Text style={styles.fieldLabel}>Dragon cosmetic</Text>
				<View style={uiStyles.wrap}>{(['classic', 'ember', 'astral'] as const).map(cosmetic => <Chip key={cosmetic} label={cosmetic} selected={app.dragonCosmetic === cosmetic} onPress={() => app.setDragonCosmetic(cosmetic)} />)}</View>
			</Card>
			<Card>
				<SectionTitle title="Weather & interface" />
				<ToggleRow label="Rain" value={app.weatherEffects.rain} onChange={value => app.setWeatherEffect('rain', value)} />
				<ToggleRow label="Tremors" value={app.weatherEffects.tremors} onChange={value => app.setWeatherEffect('tremors', value)} />
				<ToggleRow label="Brightness changes" value={app.weatherEffects.brightness} onChange={value => app.setWeatherEffect('brightness', value)} />
				<ToggleRow label="Reverse icon order" detail="Reverses the orientation of production and world items." value={app.reverseItemLayout} onChange={app.setReverseItemLayout} />
				<ToggleRow label="No Sprites Mode" detail="Uses a more minimal interface and turns on automatically for Lock-In." value={app.noSpritesMode} onChange={app.setNoSpritesMode} />
				<ToggleRow label="News bar" detail="Shows rotating news and tips; later milestones unlock more entries." value={app.showNewsBar} onChange={app.setShowNewsBar} />
			</Card>
			<Card>
				<SectionTitle title="Secondary panel" detail="Use the top-right button to switch information panels. Choose a horizontal strip or a neat multi-column layout." />
				<View style={uiStyles.wrap}>
					<Chip label="Across" selected={app.secondaryPanelLayout === 'horizontal'} onPress={() => app.setSecondaryPanelLayout('horizontal')} />
					<Chip label="Columns" selected={app.secondaryPanelLayout === 'vertical'} onPress={() => app.setSecondaryPanelLayout('vertical')} />
				</View>
			</Card>
			<Card accent="crimson">
				<SectionTitle title="Game modes" detail={`Current: ${selectedMode.label}. Titanomachy compounds the Heart and harvest buffs; the Heart also affects Chaos Energy.`} />
				<View style={uiStyles.wrap}>{MODES.map(mode => <Chip key={mode.id} label={milestone < mode.milestone ? `🔒 ${mode.label} · M${mode.milestone}` : mode.label} disabled={milestone < mode.milestone} selected={world.gameMode === mode.id} onPress={() => chooseMode(mode.id)} />)}</View>
				<Text style={styles.modeSummary}>{selectedMode.summary}</Text>
				<Text style={styles.fieldLabel}>Mode time limit in days</Text>
				<TextInput value={timerDays} onChangeText={setTimerDays} keyboardType="decimal-pad" placeholder="1" style={styles.input} />
				<View style={uiStyles.wrap}>
					<ActionButton label="Start time limit" onPress={() => startTimer(false)} />
					<ActionButton tone="danger" label="Start nuclear limit" onPress={() => startTimer(true)} />
					{world.gameModeEndsAt ? <ActionButton tone="quiet" disabled={world.gameModeTimerNuclear} label={world.gameModeTimerNuclear ? 'Nuclear timer locked' : 'Stop timer'} onPress={world.stopGameModeTimer} /> : null}
				</View>
				{world.gameModeEndsAt ? <Text style={styles.timerText}>{world.gameModeTimerNuclear ? 'Nuclear' : 'Standard'} timer ends {new Date(world.gameModeEndsAt).toLocaleString()} and returns to {world.gameModeReturnMode.replaceAll('-', ' ')}.</Text> : null}
				{world.gameMode === 'hard-plus' || world.gameModeTimerNuclear ? <ActionButton tone="danger" label="Auto Kill Dragon" onPress={autoKillDragon} /> : null}
			</Card>
			{__DEV__ ? <TemporaryCheats /> : null}
			<Card accent="crimson">
				<SectionTitle title="Reset all data" detail="Wipes every local setting, statistic, account cache, and progression store." />
				<ActionButton tone="danger" label="Reset everything" onPress={() => confirmFullReset(app.resetEverything)} />
			</Card>
		</>
	);
}

const RESET_WARNINGS = [
	['Reset all Dragon Focus data?', 'This removes progression, settings, goals, surveys, and statistics.'],
	['Second warning', 'There is no undo and no local recovery after this reset.'],
	['Third warning', 'Any unverified local Premium state and unharvested rewards will be erased.'],
	['Final warning', 'Permanently erase everything on this device now?'],
] as const;

const confirmFullReset = (reset: () => Promise<void>, step = 0) => {
	const warning = RESET_WARNINGS[step];
	Alert.alert(warning[0], warning[1], [
		{ text: 'Cancel', style: 'cancel' },
		step === RESET_WARNINGS.length - 1 ? { text: 'Erase everything', style: 'destructive', onPress: () => void reset() } : { text: 'Continue', style: 'destructive', onPress: () => confirmFullReset(reset, step + 1) },
	]);
};
