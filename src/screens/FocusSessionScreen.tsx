import { ActionButton, Card, Chip, ProgressBar } from '@/components/ui/DragonUI';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { useCrimsonHeartStore } from '@/store/store-production-special/createCrimsonHeartSlice';
import { usePomodoroStore } from '@/store/store-productivity/createPomodoroSlice';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

type FocusMode = 'pomodoro' | 'stopwatch' | 'timer' | 'wall';
const { colors, space } = dragonTheme;

const modeCopy: Record<FocusMode, { eyebrow: string; title: string; detail: string }> = {
	pomodoro: { eyebrow: 'FOCUS INTERVAL', title: 'Pomodoro Session', detail: 'Work deliberately, then choose a short or long break.' },
	stopwatch: { eyebrow: 'OPEN FOCUS', title: 'Stopwatch Session', detail: 'Count upward for as long as the work needs.' },
	timer: { eyebrow: 'COUNTDOWN FOCUS', title: 'Timer Session', detail: 'A simple countdown without the Pomodoro cycle.' },
	wall: { eyebrow: 'QUIET FOCUS', title: 'Stare at a Wall', detail: 'The countdown stays hidden. There is nothing to monitor.' },
};

export default function FocusSessionScreen() {
	const params = useLocalSearchParams<{ mode?: FocusMode }>();
	const mode: FocusMode = ['pomodoro', 'stopwatch', 'timer', 'wall'].includes(params.mode ?? '') ? params.mode! : 'pomodoro';
	const pomodoro = usePomodoroStore();
	const heart = useCrimsonHeartStore(state => state.charge);
	const maximumHeart = useCrimsonHeartStore(state => state.getMaximumCharge());
	const [timerHidden, setTimerHidden] = useState(mode === 'wall');
	const [controlsHidden, setControlsHidden] = useState(false);
	const glow = useSharedValue(0.25);

	useEffect(() => {
		glow.value = withRepeat(withSequence(withTiming(0.75, { duration: 1_800 }), withTiming(0.25, { duration: 1_800 })), -1, true);
	}, [glow]);
	const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 0.96 + glow.value * 0.06 }] }));
	const seconds = pomodoro.status === 'count-up' ? pomodoro.elapsedSeconds : pomodoro.secondsRemaining;
	const close = () => {
		pomodoro.endSession(false);
		router.replace('/(_tabs)/earth?tab=focus');
	};
	const copy = modeCopy[mode];

	return (
		<SafeAreaView style={styles.safe}>
			<View style={styles.header}>
				<ActionButton compact tone="quiet" label="×" accessibilityLabel="Exit focus session" onPress={close} />
				<View style={styles.headerCopy}>
					<Text style={styles.eyebrow}>{copy.eyebrow}</Text>
					<Text style={styles.title}>{copy.title}</Text>
				</View>
				<View style={styles.headerSpacer} />
			</View>
			<View style={styles.session}>
				<Animated.View entering={FadeIn.duration(450)} style={[styles.glow, glowStyle]} />
				<View style={styles.heart}>
					<Text style={styles.heartGlyph}>♥</Text>
					<Text style={styles.heartText}>{heart.toFixed(1)}%</Text>
				</View>
				{!timerHidden ?
					<Text style={styles.timer}>{formatClock(seconds)}</Text>
				:	<Text style={styles.hiddenMessage}>{mode === 'wall' ? 'Look away from the screen.' : 'Timer hidden'}</Text>}
				<Text style={styles.detail}>{copy.detail}</Text>
				<View style={styles.heartBar}>
					<ProgressBar value={heart} max={maximumHeart} color={colors.crimsonBright} label={`Crimson Heart · max ${maximumHeart.toFixed(0)}%`} />
				</View>
				{!controlsHidden ?
					<Card style={styles.controls}>
						<View style={styles.actions}>
							<ActionButton label={pomodoro.isPaused ? 'Resume' : 'Pause'} onPress={pomodoro.isPaused ? pomodoro.resume : pomodoro.pause} />
							{mode !== 'wall' ?
								<ActionButton tone="quiet" label={timerHidden ? 'Show timer' : 'Hide timer'} onPress={() => setTimerHidden(value => !value)} />
							:	null}
						</View>
						{mode !== 'wall' && pomodoro.status !== 'count-up' ?
							<View style={styles.adjustments}>
								{[-600, -60, -10, 10, 60, 600].map(amount => (
									<Chip key={amount} label={`${amount > 0 ? '+' : ''}${Math.abs(amount) >= 60 ? `${amount / 60}m` : `${amount}s`}`} onPress={() => pomodoro.adjustTime(amount)} />
								))}
							</View>
						:	null}
						{mode === 'pomodoro' ?
							<View style={styles.actions}>
								<ActionButton
									tone="secondary"
									label="Short break"
									onPress={() => {
										pomodoro.endSession(true);
										pomodoro.startBreak('short');
									}}
								/>
								<ActionButton
									tone="secondary"
									label="Long break"
									onPress={() => {
										pomodoro.endSession(true);
										pomodoro.startBreak('long');
									}}
								/>
							</View>
						:	null}
						{mode === 'stopwatch' || mode === 'timer' ?
							<ActionButton compact tone="quiet" label="Hide controls" onPress={() => setControlsHidden(true)} />
						:	null}
					</Card>
				:	<ActionButton tone="quiet" label="Show controls" onPress={() => setControlsHidden(false)} />}
			</View>
		</SafeAreaView>
	);
}

const formatClock = (seconds: number) =>
	`${Math.floor(seconds / 60)
		.toString()
		.padStart(2, '0')}:${Math.floor(seconds % 60)
		.toString()
		.padStart(2, '0')}`;
const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.canvas },
	header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, borderBottomColor: colors.line, borderBottomWidth: 1 },
	headerCopy: { flex: 1, alignItems: 'center' },
	headerSpacer: { width: 52 },
	eyebrow: { color: colors.gold, fontFamily: appFonts.semibold, fontSize: 9, letterSpacing: 1.8 },
	title: { color: colors.ink, fontFamily: appFonts.bold, fontSize: 16 },
	session: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', gap: space.lg, padding: space.xl },
	glow: { position: 'absolute', width: 310, height: 310, borderRadius: 160, backgroundColor: colors.crimsonSoft },
	heart: { alignItems: 'center' },
	heartGlyph: { color: colors.crimsonBright, fontSize: 76, textShadowColor: colors.crimson, textShadowRadius: 22 },
	heartText: { color: colors.ink, fontFamily: appFonts.black, fontSize: 18 },
	timer: { color: colors.ink, fontFamily: appFonts.mono, fontSize: 58, letterSpacing: 3 },
	hiddenMessage: { height: 72, textAlignVertical: 'center', color: colors.muted, fontFamily: appFonts.medium, fontSize: 14, letterSpacing: 1 },
	detail: { color: colors.muted, fontFamily: appFonts.regular, fontSize: 13, lineHeight: 20, textAlign: 'center' },
	heartBar: { width: '100%' },
	controls: { width: '100%', backgroundColor: '#121018E8' },
	actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
	adjustments: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
});
