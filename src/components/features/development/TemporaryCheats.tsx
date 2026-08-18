import { ActionButton, Card, Chip, PageIntro, SectionTitle, uiStyles } from '@/components/ui/DragonUI';
import { WORLD_CONSTANTS } from '@/constants/world.constants';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { useDevelopmentStore } from '@/store/store-development/_useDevelopmentStore';
import { useOfflineProgressStore } from '@/store/store-offline-progress/_useOfflineProgressStore';
import { dragonStageForAge } from '@/store/store-online-progress/createPopulationOnlineSlice';
import { useOnlineProgressStore } from '@/store/store-online-progress/_useOnlineProgressStore';
import { usePremiumStore } from '@/store/store-premium/_usePremiumStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import { decimal, decimalMax, decimalMin, formatDecimal } from '@/utils/decimal';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

const { colors, radius, space } = dragonTheme;
const MAX_DRAGON_AGE_DAYS = WORLD_CONSTANTS.dragonStages.at(-1)?.minimumAgeDays ?? 730;

const CHEAT_VALUES = [
	['energy', '⚡ Energy'],
	['darkEnergy', '◈ Dark Energy'],
	['plasma', '◉ Plasma'],
	['anomaly', '◌ Anomaly'],
	['shards', '◆ Crimson Shards'],
	['chaosEnergy', '⟡ Chaos Energy'],
	['quarks', '◇ Quarks'],
	['population', '◎ Population'],
	['dragonAge', '◷ Dragon Age'],
	['fury', '🔥 Dragon Fury'],
] as const;

type CheatValueId = (typeof CHEAT_VALUES)[number][0];
const parseFiniteNumber = (input: string) => {
	const value = Number(input.trim());
	return Number.isFinite(value) ? value : undefined;
};
const parseDecimalInput = (input: string) => {
	const trimmed = input.trim();
	if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed)) return undefined;
	const value = decimal(trimmed);
	return Number.isFinite(value.m) && Number.isFinite(value.e) ? value : undefined;
};

export function TemporaryCheats() {
	const cheats = useDevelopmentStore(state => state.temporaryCheats);
	const { resources, dragon, setResource, setDragon, recordDragonAge } = useWorldStore(
		useShallow(state => ({
			resources: state.resourceStore.resources,
			dragon: state.resourceStore.dragon,
			setResource: state.resourceStore.setResource,
			setDragon: state.resourceStore.setDragon,
			recordDragonAge: state.dragonStore.recordDragonAge,
		})),
	);
	const isPremium = usePremiumStore(state => state.isPremium);
	const applyEntitlement = usePremiumStore(state => state.applyVerifiedEntitlement);
	const [heartPercent, setHeartPercent] = useState(`${cheats.crimsonHeartOnAppPercent ?? 0}`);
	const [valueId, setValueId] = useState<CheatValueId>('energy');
	const [signedAmount, setSignedAmount] = useState('1000');
	const [days, setDays] = useState('0');
	const [hours, setHours] = useState('0');
	const [minutes, setMinutes] = useState('0');
	const [seconds, setSeconds] = useState('0');
	const [notice, setNotice] = useState('Cheats reset when the app reloads.');

	const currentValue =
		valueId === 'dragonAge' ? `${dragon.ageDays.toLocaleString()} days`
		: formatDecimal(resources[valueId]);

	const applyHeartPercent = () => {
		const value = parseFiniteNumber(heartPercent);
		if (value === undefined) {
			setNotice('Crimson Heart percentage needs a valid number.');
			return;
		}
		const percent = Math.max(0, value);
		cheats.setCrimsonHeartOnAppPercent(percent);
		setHeartPercent(`${percent}`);
		setNotice(`Crimson Heart target while on Dragon Focus set to ${percent}%.`);
	};

	const applySignedChange = () => {
		const amount = parseDecimalInput(signedAmount);
		if (!amount) {
			setNotice('Adjustment needs a signed number, such as -100, 250, or 1e50.');
			return;
		}

		if (valueId === 'dragonAge') {
			const ageDays = Math.max(0, Math.min(MAX_DRAGON_AGE_DAYS, dragon.ageDays + amount.toNumber()));
			setDragon({ ageDays, stage: dragonStageForAge(ageDays) });
			recordDragonAge(ageDays);
			setNotice(`Dragon Age is now ${ageDays.toLocaleString()} days.`);
			return;
		}

		const next = resources[valueId].plus(amount);
		const bounded = valueId === 'fury' ? decimalMin(decimalMax(next, 0), dragon.maxFury) : decimalMax(next, 0);
		setResource(valueId, bounded);
		setNotice(`${CHEAT_VALUES.find(([id]) => id === valueId)?.[1] ?? valueId} is now ${formatDecimal(bounded)}.`);
	};

	const simulateOfflineTime = () => {
		const parts = [days, hours, minutes, seconds].map(parseFiniteNumber);
		if (parts.some(part => part === undefined || part < 0)) {
			setNotice('Offline time fields must contain non-negative numbers.');
			return;
		}
		const [dayValue = 0, hourValue = 0, minuteValue = 0, secondValue = 0] = parts as number[];
		const requestedSeconds = dayValue * 86_400 + hourValue * 3_600 + minuteValue * 60 + secondValue;
		const maximumSeconds = 365 * WORLD_CONSTANTS.secondsPerDay;
		const totalSeconds = Math.max(0, Math.min(maximumSeconds, requestedSeconds));
		if (!totalSeconds) {
			setNotice('Enter some offline time before simulating.');
			return;
		}
		useOfflineProgressStore.getState().recordUsage('off-app', totalSeconds);
		useOnlineProgressStore.getState().giveOfflineProgress();
		setNotice(`Simulated ${formatDuration(totalSeconds)} offline using the real offline progression engine.`);
	};

	const togglePremium = () => {
		applyEntitlement({
			entitlementId: 'dragon-pact',
			active: !isPremium,
			plan: !isPremium ? 'lifetime' : undefined,
			verifiedAt: new Date().toISOString(),
			source: 'development',
			customerId: 'local-development',
		});
		setNotice(`Development Dragon Pact ${isPremium ? 'disabled' : 'enabled'}.`);
	};

	return (
		<>
			<PageIntro eyebrow="Development only" title="Temporary Cheats" description="Typed controls for progression testing. This entire tab is excluded from production builds." />
			<Card accent="crimson">
				<SectionTitle title="Enable Dev Mode" detail="Every cheat stays greyed out until enabled and returns to normal after reloading the app." />
				<Chip label={cheats.enabled ? 'Dev Mode Enabled' : 'Dev Mode Disabled'} selected={cheats.enabled} onPress={() => cheats.setEnabled(!cheats.enabled)} />
				<Text style={styles.notice}>{notice}</Text>
			</Card>

			<View pointerEvents={cheats.enabled ? 'auto' : 'none'} style={[styles.cheatGroup, !cheats.enabled && styles.disabledGroup]}>
				<Card accent="gold">
					<SectionTitle title="Crimson Heart" detail="Adjust the target Heart charge while actively using Dragon Focus. 100% is the default Pomodoro maximum; anomaly upgrades can raise it. Enter any non-negative percentage." />
					<NumericInput label="On Dragon Focus" value={heartPercent} onChange={setHeartPercent} suffix="%" onApply={applyHeartPercent} />
				</Card>

				<Card>
					<SectionTitle title="Add or remove" detail={`Selected value: ${currentValue}. Positive numbers add; negative numbers remove. Values are clamped to their valid boundaries.`} />
					<View style={uiStyles.wrap}>
						{CHEAT_VALUES.map(([id, label]) => <Chip key={id} label={label} selected={valueId === id} onPress={() => setValueId(id)} />)}
					</View>
					<NumericInput label="Signed adjustment" value={signedAmount} onChange={setSignedAmount} onApply={applySignedChange} />
					<ActionButton label="Apply adjustment" onPress={applySignedChange} />
				</Card>

				<Card accent="violet">
					<SectionTitle title="Simulate time offline" detail="Add days, hours, minutes, and seconds. This uses the actual offline reward path and is capped at one year per simulation." />
					<View style={styles.durationGrid}>
						<DurationInput label="Days" value={days} onChange={setDays} onApply={simulateOfflineTime} />
						<DurationInput label="Hours" value={hours} onChange={setHours} onApply={simulateOfflineTime} />
						<DurationInput label="Minutes" value={minutes} onChange={setMinutes} onApply={simulateOfflineTime} />
						<DurationInput label="Seconds" value={seconds} onChange={setSeconds} onApply={simulateOfflineTime} />
					</View>
					<ActionButton label="Simulate offline time" onPress={simulateOfflineTime} />
				</Card>

				<Card>
					<SectionTitle title="Premium Dragon Pact" detail="Creates a local development entitlement without contacting a storefront or server." />
					<Chip label={isPremium ? 'Development Pact Enabled' : 'Development Pact Disabled'} selected={isPremium} onPress={togglePremium} />
				</Card>
			</View>
		</>
	);
}

function NumericInput({ label, value, onChange, onApply, suffix }: { label: string; value: string; onChange: (value: string) => void; onApply: () => void; suffix?: string }) {
	return (
		<View style={styles.inputGroup}>
			<Text style={styles.inputLabel}>{label}</Text>
			<View style={styles.inputRow}>
				<TextInput accessibilityLabel={label} autoCapitalize="none" autoCorrect={false} onChangeText={onChange} onSubmitEditing={onApply} returnKeyType="done" selectTextOnFocus value={value} style={styles.input} />
				{suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
				<ActionButton compact label="Apply" onPress={onApply} />
			</View>
		</View>
	);
}

function DurationInput({ label, value, onChange, onApply }: { label: string; value: string; onChange: (value: string) => void; onApply: () => void }) {
	return (
		<View style={styles.durationInput}>
			<Text style={styles.inputLabel}>{label}</Text>
			<TextInput accessibilityLabel={`Offline ${label}`} autoCapitalize="none" autoCorrect={false} keyboardType="decimal-pad" onChangeText={onChange} onSubmitEditing={onApply} returnKeyType="done" selectTextOnFocus value={value} style={styles.input} />
		</View>
	);
}

const formatDuration = (totalSeconds: number) => {
	const wholeSeconds = Math.floor(totalSeconds);
	const days = Math.floor(wholeSeconds / 86_400);
	const hours = Math.floor((wholeSeconds % 86_400) / 3_600);
	const minutes = Math.floor((wholeSeconds % 3_600) / 60);
	const seconds = wholeSeconds % 60;
	return [`${days}d`, `${hours}h`, `${minutes}m`, `${seconds}s`].join(' ');
};

const styles = StyleSheet.create({
	cheatGroup: { gap: space.lg },
	disabledGroup: { opacity: 0.38 },
	notice: { color: colors.gold, fontFamily: appFonts.medium, fontSize: 12, lineHeight: 18 },
	inputGroup: { gap: 6, borderTopColor: colors.line, borderTopWidth: 1, paddingTop: space.sm },
	inputLabel: { color: colors.ink, fontFamily: appFonts.medium, fontSize: 12 },
	inputRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
	input: { flex: 1, minWidth: 76, minHeight: 42, borderRadius: radius.small, borderColor: colors.lineStrong, borderWidth: 1, backgroundColor: colors.canvas, color: colors.ink, fontFamily: appFonts.mono, fontSize: 14, paddingHorizontal: 12, paddingVertical: 8 },
	suffix: { color: colors.muted, fontFamily: appFonts.medium, fontSize: 12 },
	durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
	durationInput: { flexGrow: 1, flexBasis: '45%', gap: 6 },
});
