import { DragonAppScreen } from '@/components/app-shell/DragonAppScreen';
import { ActionButton, Card, Chip, PageIntro, ProgressBar, SectionTitle, TabStrip, uiStyles } from '@/components/ui/DragonUI';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { useWorldOptionsStore } from '@/store/store-world/createWorldOptionsSlice';
import { useAppStore } from '@/store/useAppStore';
import type { GameMode } from '@/types/world.types';
import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

const { colors, space } = dragonTheme;

export default function OptionsScreen() {
	const [tab, setTab] = useState<'general' | 'surveys'>('general');
	return (
		<DragonAppScreen title="The Options" panel="dragon">
			<TabStrip
				tabs={[
					{ id: 'general', label: 'General & Game Modes' },
					{ id: 'surveys', label: 'Survey & Goal Options' },
				]}
				value={tab}
				onChange={setTab}
			/>
			{tab === 'general' ?
				<GeneralOptions />
			:	<SurveyOptions />}
		</DragonAppScreen>
	);
}

function GeneralOptions() {
	const app = useAppStore();
	const world = useWorldOptionsStore();
	const modes: readonly GameMode[] = ['invincible', 'easy', 'medium', 'hard', 'hard-plus', 'lock-in'];
	return (
		<>
			<PageIntro eyebrow="Make it yours" title="General Options" description="Appearance, sound, information density, difficulty, and account-level controls." />
			<Card>
				<SectionTitle title="Theme" detail="The game shell is dark-first; system and light retain accessible contrast as those palettes expand." />
				<View style={uiStyles.wrap}>
					{(['system', 'light', 'dark'] as const).map(theme => (
						<Chip key={theme} label={theme} selected={app.theme === theme} onPress={() => app.setTheme(theme)} />
					))}
				</View>
			</Card>
			<Card>
				<SectionTitle title="Audio" detail="Stored now; connect to the audio mixer when music and sound assets are finalized." />
				<SettingMeter label="Sound effects" value={app.soundEffectsVolume} setValue={app.setSoundEffectsVolume} />
				<SettingMeter label="Music" value={app.musicVolume} setValue={app.setMusicVolume} />
			</Card>
			<Card>
				<SectionTitle title="Brightness" detail={`${Math.round(app.brightness * 100)}% visual intensity`} />
				<SettingMeter label="Interface brightness" value={(app.brightness - 0.5) / 0.7} setValue={value => app.setBrightness(0.5 + value * 0.7)} />
			</Card>
			<Card accent="crimson">
				<SectionTitle title="Game mode" detail="Higher difficulty scales Crimson Heart behavior and Fury rules. Locked modes remain protected by milestone requirements." />
				<View style={uiStyles.wrap}>
					{modes.map(mode => (
						<Chip key={mode} label={mode.replaceAll('-', ' ')} selected={world.gameMode === mode} onPress={() => world.setGameMode(mode)} />
					))}
				</View>
			</Card>
			<Card>
				<SectionTitle title="Interface" />
				<ToggleRow label="Auto-harvest within 24 hours" value={app.autoHarvest} onChange={app.setAutoHarvest} />
				<ToggleRow label="Require daily check-in for Lair systems" value={app.requireDailyCheckIn} onChange={app.setRequireDailyCheckIn} />
				<ToggleRow label="Reverse production item layout" value={app.reverseItemLayout} onChange={app.setReverseItemLayout} />
				<ActionButton tone="quiet" label="Open full tutorial" onPress={() => router.push('/tutorial')} />
			</Card>
			<Card accent="crimson">
				<SectionTitle title="Reset account" detail="Clears all locally persisted Dragon Focus progression on this device." />
				<ActionButton
					tone="danger"
					label="Reset everything"
					onPress={() =>
						Alert.alert('Reset all Dragon Focus data?', 'This local reset cannot be undone.', [
							{ text: 'Cancel', style: 'cancel' },
							{ text: 'Reset', style: 'destructive', onPress: () => void app.resetEverything() },
						])
					}
				/>
			</Card>
		</>
	);
}

function SurveyOptions() {
	const app = useAppStore();
	const [questionSet, setQuestionSet] = useState({ mood: true, goals: true, advice: true, journal: true, archetypes: true });
	const [order, setOrder] = useState(['Mood', 'Goals', 'Advice', 'Journal']);
	const move = (index: number, delta: number) => {
		const next = [...order];
		const target = index + delta;
		if (target < 0 || target >= next.length) return;
		[next[index], next[target]] = [next[target], next[index]];
		setOrder(next);
	};
	return (
		<>
			<PageIntro eyebrow="Daily ritual" title="Survey & Goal Options" description="Choose what the daily review asks and the order in which it asks it." />
			<Card>
				<SectionTitle title="Questions" detail="Core completion and anti-cheat events remain store-managed even when optional prompts are hidden." />
				{Object.entries(questionSet).map(([key, value]) => (
					<ToggleRow key={key} label={key.replaceAll('-', ' ')} value={value} onChange={enabled => setQuestionSet(current => ({ ...current, [key]: enabled }))} />
				))}
			</Card>
			<Card>
				<SectionTitle title="Question order" detail="Use the arrows to arrange the visible survey sequence." />
				{order.map((label, index) => (
					<View key={label} style={styles.orderRow}>
						<Text style={styles.orderIndex}>{index + 1}</Text>
						<Text style={styles.orderLabel}>{label}</Text>
						<ActionButton compact tone="quiet" label="↑" disabled={index === 0} onPress={() => move(index, -1)} />
						<ActionButton compact tone="quiet" label="↓" disabled={index === order.length - 1} onPress={() => move(index, 1)} />
					</View>
				))}
			</Card>
			<Card>
				<SectionTitle title="Goals" />
				<ToggleRow label="Harvest automatically" value={app.autoHarvest} onChange={app.setAutoHarvest} />
				<Text style={uiStyles.muted}>Custom categories and archetype remapping need a persisted survey-schema slice before they should be editable here.</Text>
			</Card>
		</>
	);
}

function SettingMeter({ label, value, setValue }: { label: string; value: number; setValue: (value: number) => void }) {
	return (
		<View style={styles.meter}>
			<View style={styles.meterHeader}>
				<Text style={styles.orderLabel}>{label}</Text>
				<Text style={styles.meterValue}>{Math.round(value * 100)}%</Text>
			</View>
			<ProgressBar value={value * 100} color={colors.gold} />
			<View style={styles.meterButtons}>
				<ActionButton compact tone="quiet" label="−" onPress={() => setValue(value - 0.1)} />
				<ActionButton compact tone="quiet" label="+" onPress={() => setValue(value + 0.1)} />
			</View>
		</View>
	);
}
function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
	return (
		<View style={styles.toggleRow}>
			<Text style={styles.toggleLabel}>{label}</Text>
			<Chip label={value ? 'On' : 'Off'} selected={value} onPress={() => onChange(!value)} />
		</View>
	);
}

const styles = StyleSheet.create({
	meter: { gap: space.sm, borderTopColor: colors.line, borderTopWidth: 1, paddingTop: space.md },
	meterHeader: { flexDirection: 'row', justifyContent: 'space-between' },
	meterValue: { color: colors.gold, fontFamily: appFonts.mono, fontSize: 12 },
	meterButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm },
	toggleRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, borderTopColor: colors.line, borderTopWidth: 1, paddingTop: space.sm },
	toggleLabel: { flex: 1, color: colors.ink, fontFamily: appFonts.medium, fontSize: 13 },
	orderRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: space.sm, borderTopColor: colors.line, borderTopWidth: 1, paddingTop: space.sm },
	orderIndex: { color: colors.gold, fontFamily: appFonts.black, width: 24 },
	orderLabel: { flex: 1, color: colors.ink, fontFamily: appFonts.medium, fontSize: 13 },
});
