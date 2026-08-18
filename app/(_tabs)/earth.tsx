import { ActionButton, Card, Chip, EmptyState, PageIntro, ProgressBar, SectionTitle, TabStrip, uiStyles } from '@/components/ui/DragonUI';
import { displayFuryStage } from '@/components/ui/fury-display';
import { DragonAppScreen } from '@/components/app-shell/DragonAppScreen';
import { ClickerList } from '@/components/pages/lair/ClickerList';
import { EARTH_TABS, type EarthTab } from '@/components/pages/earth/earth-tabs';
import { styles } from '@/components/pages/earth/earth.styles';
import { GoalBoard } from '@/components/pages/earth/GoalBoard';
import { dragonTheme } from '@/constants/dragon-theme';
import { calculateProgressionPreview } from '@/data/calculations/progression-preview';
import { EARTH_CLICKERS } from '@/data/production-data';
import { milestoneForEnergy, milestoneLabel } from '@/data/world-data/milestones';
import { useOfflineProgressStore } from '@/store/store-offline-progress/_useOfflineProgressStore';
import { useProductionSpecialStore } from '@/store/store-production-special/_useProductionSpecialStore';
import { useProductivityStore } from '@/store/store-productivity/_useProductivityStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import { useAppStore } from '@/store/useAppStore';
import { formatDecimal } from '@/utils/decimal';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Animated, { FadeOutUp, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

const { colors } = dragonTheme;
const feedbackLeft = (x: number, width: number, stageWidth: number) => stageWidth ? Math.max(8, Math.min(x - width / 2, stageWidth - width - 8)) : x - width / 2;
const feedbackTop = (y: number) => Math.max(8, y - 10);

export default function EarthRoute() {
	const params = useLocalSearchParams<{ tab?: EarthTab }>();
	const milestone = milestoneForEnergy(useWorldStore(state => state.resourceStore.totalAllTime.energy));
	const [tab, setTab] = useState<EarthTab>(EARTH_TABS.some(candidate => candidate.id === params.tab) ? params.tab! : 'command');
	const requiredMilestone = EARTH_TABS.find(candidate => candidate.id === tab)?.unlockMilestone ?? 0;
	return (
		<DragonAppScreen title="The Earth" panel={tab === 'active' || tab === 'finished' || tab === 'surveys' ? 'goals' : 'population'} effects={tab === 'command'}>
			<TabStrip tabs={EARTH_TABS} value={tab} onChange={setTab} milestone={milestone} />
			{milestone < requiredMilestone ?
				<EmptyState icon="🔒" title="Earth chamber sealed" description={`Unlocks at Milestone ${milestoneLabel(requiredMilestone)}.`} />
			: tab === 'command' ?
				<CommandCenter />
			: tab === 'surveys' ?
				<SurveyCenter />
			: tab === 'active' ?
				<GoalBoard completed={false} />
			: tab === 'finished' ?
				<GoalBoard completed />
			: tab === 'focus' ?
				<FocusCave />
			:	<HoardCave />}
		</DragonAppScreen>
	);
}

function CommandCenter() {
	const numberFormat = useAppStore(state => state.numberFormat);
	const noSpritesMode = useAppStore(state => state.noSpritesMode);
	const heroFormat = numberFormat === 'scientific' ? 'scientific' : 'long';
	const resources = useWorldStore(state => state.resourceStore.resources);
	const dragon = useWorldStore(state => state.resourceStore.dragon);
	const angerShields = useWorldStore(state => state.dragonStore.angerShields);
	const getFuryBand = useWorldStore(state => state.dragonStore.getFuryBand);
	const deaths = useWorldStore(state => state.resourceStore.populationDead);
	const hostiles = useWorldStore(state => state.populationStore);
	const heartCharge = useProductionSpecialStore(state => state.crimsonHeart.charge);
	const progression = calculateProgressionPreview(heartCharge);
	const clickWorld = useWorldStore(state => state.dragonStore.clickWorld);
	const furyBand = getFuryBand();
	const furyStage = displayFuryStage(furyBand, angerShields);
	const furyThreshold = dragon.furyThreshold.toNumber();
	const pulse = useSharedValue(1);
	const [stageWidth, setStageWidth] = useState(0);
	const [clickFeedback, setClickFeedback] = useState<{ id: number; x: number; y: number; population: string }>();
	const earthStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
	const tapEarth = (x: number, y: number) => {
		// eslint-disable-next-line react-hooks/immutability
		pulse.value = withSequence(withSpring(0.94), withSpring(1.03), withSpring(1));
		const population = clickWorld();
		if (population) {
			const id = Date.now();
			setClickFeedback({ id, x, y, population });
			setTimeout(() => setClickFeedback(current => (current?.id === id ? undefined : current)), 900);
		}
	};
	return (
		<>
			<PageIntro eyebrow="Living world" title="Command Center" description="Protect the population, keep the dragon steady, and turn focused action into momentum." />
			<Card style={styles.populationCard}>
				<View style={styles.populationRow}>
					<View>
						<Text style={styles.metricLabel}>Population</Text>
						<Text style={styles.population}>{formatDecimal(resources.population, 2, heroFormat)}</Text>
					</View>
					<View style={styles.deathColumn}>
						<Text style={styles.metricLabel}>Recorded deaths</Text>
						<Text style={styles.deaths}>{formatDecimal(deaths, 2, heroFormat)}</Text>
					</View>
				</View>
				{hostiles.zombies.gt(0) || hostiles.cyborgs.gt(0) ?
					<Text style={uiStyles.muted}>
						Zombies {formatDecimal(hostiles.zombies, 2, heroFormat)} · Cyborgs {formatDecimal(hostiles.cyborgs, 2, heroFormat)}
					</Text>
				:	null}
				{progression.heartTicksPerSecond <= 0 ?
					<View style={styles.heartWarning}>
						<Text style={styles.heartWarningTitle}>Crimson Heart inactive</Text>
						<Text style={styles.heartWarningText}>Heart is at 0% — passive Population generation is paused.</Text>
					</View>
				: 		<View style={styles.generationStats}>
						<View style={styles.generationStat}>
							<Text style={styles.generationLabel}>Population / tick</Text>
							<Text style={styles.generationValue}>{formatDecimal(progression.populationPerTick, 2, heroFormat)}</Text>
						</View>
						<View style={styles.generationStat}>
							<Text style={styles.generationLabel}>Heart ticks / second</Text>
							<Text style={styles.generationValue}>{formatDecimal(progression.heartTicksPerSecond, 3, heroFormat)}</Text>
						</View>
					</View>}
			</Card>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Grow the world"
				onLayout={event => setStageWidth(event.nativeEvent.layout.width)}
				onPress={event => tapEarth(event.nativeEvent.locationX, event.nativeEvent.locationY)}
				style={styles.earthStage}>
				<View style={styles.orbitOuter}>
					<View style={styles.orbitInner} />
				</View>
				<Animated.View style={[styles.earthGlow, earthStyle]}>
					{noSpritesMode ? <Text style={styles.earthGlyph}>◎</Text> : <Image source={require('@/assets/images/other/planet-earth-test.png')} resizeMode="contain" style={styles.earthImage} />}
				</Animated.View>
				{clickFeedback ?
					<Animated.Text key={clickFeedback.id} exiting={FadeOutUp.duration(700)} style={[styles.clickFeedback, { left: feedbackLeft(clickFeedback.x, 220, stageWidth), top: feedbackTop(clickFeedback.y) }]}>
						+{formatDecimal(clickFeedback.population)} Population
					</Animated.Text>
				:	null}
				<Text style={styles.tapHint}>Tap the Earth for growth</Text>
			</Pressable>
			<Card accent="crimson">
				<SectionTitle title="Dragon's Fury / Anger Level" detail={`Milestone 1 · ${furyStage} · ${angerShields.toFixed(0)} / ${formatDecimal(furyThreshold, 0)} shields`} />
				<ProgressBar value={resources.fury.toNumber()} max={furyThreshold} color={colors.crimsonBright} label={`${furyStage} · ${formatDecimal(resources.fury)} / ${formatDecimal(furyThreshold, 0)} Fury`} />
				<Text style={uiStyles.muted}>Fury rises when goals are missed or the app is neglected. Shields make the stage Calm, protect against Angry or higher, and absorb Fury temporarily; Calm shield gain is ×½ and shields can stack up to the threshold. Without shields, 0–threshold is Normal, threshold–2× is Angry, and 2×–3× is Critical; exceeding the cap triggers Supernova mass destruction.</Text>
				<Text style={uiStyles.muted}>Angry stops Population growth and causes 1× population loss per tick; Critical causes 2×. Hard and Hard+ increase Fury gain and the cap in exchange for more Energy, while Invincible and Lock-In pause Fury. Eros can reduce Fury through the Convertor.</Text>
				{furyBand === 'supernova' ? <Text style={styles.furyDanger}>Supernova: the dragon has succumbed to mass destruction.</Text> : null}
			</Card>
			<Card accent="blue">
				<SectionTitle title="Earth Clickers" detail="Permanent Population upgrades for the World page." />
				<Text style={uiStyles.muted}>Earth clicks start at 1 Population. These upgrades persist through Armageddons and Transcensions, reveal in sequence, and disappear forever when maxed.</Text>
				<Text style={uiStyles.muted}>Buy one level of the last visible clicker to reveal the next at no unlock cost.</Text>
			</Card>
			<ClickerList items={EARTH_CLICKERS} />
		</>
	);
}

function SurveyCenter() {
	const survey = useProductivityStore(state => state.surveys);
	const requireCheckIn = useAppStore(state => state.requireDailyCheckIn);
	return (
		<>
			<PageIntro eyebrow="Daily ritual" title="Surveys" description="Use the check-in to set the day’s direction, then return for a check-out to harvest completed goals and review your rewards." />
			<Card accent="gold">
				<SectionTitle title="Check-In Survey" detail={survey.checkInCompleted ? `Complete · ${survey.checkInStreak} day streak` : 'Not completed today'} />
				<Text style={uiStyles.muted}>The check-in can be retaken before check-out if you want to update your mood, reflection, or goals.</Text>
				<ActionButton label={survey.checkInCompleted ? 'Take check-in again' : 'Take check-in'} onPress={() => router.push('/check-in-survey')} />
			</Card>
			<Card accent="crimson">
				<SectionTitle title="Check-Out Survey" detail={survey.checkOutCompleted ? `Complete · ${survey.checkOutStreak} day streak` : survey.checkOutAvailable ? 'Available until the end of the day' : 'Waiting for check-in'} />
				<Text style={uiStyles.muted}>Check off and harvest finished goals, see Fury loss and other rewards, then close the day.</Text>
				<ActionButton label={survey.checkOutCompleted ? 'Checked out' : 'Take check-out'} disabled={survey.checkOutCompleted || (requireCheckIn && !survey.checkOutAvailable)} onPress={() => router.push('/check-out-survey')} />
			</Card>
			<Card>
				<SectionTitle title="Survey cycle" detail="Optional surveys can be configured in Options." />
				<View style={styles.statsRow}>
					<View><Text style={styles.metricLabel}>Check-in</Text><Text style={styles.hoardValue}>{survey.checkInCompleted ? 'Complete' : 'Open'}</Text></View>
					<View><Text style={styles.metricLabel}>Check-out</Text><Text style={styles.hoardValue}>{survey.checkOutCompleted ? 'Complete' : survey.checkOutAvailable ? 'Open' : 'Locked'}</Text></View>
					<View><Text style={styles.metricLabel}>Streaks</Text><Text style={styles.hoardValue}>{survey.checkInStreak} / {survey.checkOutStreak}</Text></View>
				</View>
			</Card>
		</>
	);
}

function FocusCave() {
	const pomodoro = useProductivityStore(state => state.pomodoro);
	const [focusTab, setFocusTab] = useState<'pomodoro' | 'stopwatch' | 'timer' | 'wall'>('pomodoro');
	const focusTabs = [
		{ id: 'pomodoro', label: 'Pomodoro' },
		{ id: 'stopwatch', label: 'Stopwatch' },
		{ id: 'timer', label: 'Timer' },
		{ id: 'wall', label: 'Stare at a Wall' },
	] as const;
	const startSession = (mode: typeof focusTab, wallCountdown = false) => {
		const started = mode === 'stopwatch' || (mode === 'wall' && !wallCountdown) ? pomodoro.startCountUp() : pomodoro.startCountdown(25);
		if (started) router.push({ pathname: '/focus-session', params: { mode, wallCountdown: wallCountdown ? 'true' : 'false' } });
	};
	return (
		<>
			<PageIntro eyebrow="Focus chamber" title="Pomodoro Cave" description="Choose a focus format, then enter its dedicated full-screen session. The normal app tabs disappear until you exit." />
			<TabStrip tabs={focusTabs} value={focusTab} onChange={setFocusTab} />
			<Card accent={focusTab === 'pomodoro' || focusTab === 'timer' ? 'gold' : 'violet'}>
					<SectionTitle
						title={
							focusTab === 'pomodoro' ? '25-minute Pomodoro'
							: focusTab === 'stopwatch' ?
								'Open stopwatch'
							: focusTab === 'timer' ?
								'25-minute timer'
							:	'Quiet focus'
						}
						detail={focusTab === 'wall' ? 'Choose an untimed session or an optional hidden countdown.' : 'Timer and control visibility can be changed inside the session.'}
					/>
					{focusTab === 'wall' ?
						<View style={styles.timerActions}>
							<ActionButton label="Start without countdown" onPress={() => startSession('wall', false)} />
							<ActionButton tone="secondary" label="Start 25-minute countdown" onPress={() => startSession('wall', true)} />
						</View>
					:	<ActionButton label={`Start ${focusTab}`} onPress={() => startSession(focusTab)} />}
			</Card>
		</>
	);
}

function HoardCave() {
	const offline = useOfflineProgressStore(
		useShallow(state => ({
			offAppSeconds: state.offAppSeconds,
			allowedAppSeconds: state.allowedAppSeconds,
			blockedAppSeconds: state.blockedAppSeconds,
			appBlockingMode: state.appBlockingMode,
			blockedApps: state.blockedApps,
			setAppBlockingMode: state.setAppBlockingMode,
			unlockedOfflineBoostSlots: state.unlockedOfflineBoostSlots,
			purchaseOfflineBoostSlot: state.purchaseOfflineBoostSlot,
		})),
	);
	const mode = useWorldStore(state => state.optionsStore.gameMode);
	return (
		<>
			<PageIntro eyebrow="Offline focus" title="Hoard's Cave" description="The Hoard records supported time away and returns it as closed-form progress when Dragon Focus opens again." />
			<Card accent="gold">
				<SectionTitle title="Stored activity" detail="Calculated in constant time when collected." />
				<View style={styles.statsRow}>
					{[
						['Off phone', offline.offAppSeconds],
						['Allowed apps', offline.allowedAppSeconds],
						['Blocked apps', offline.blockedAppSeconds],
					].map(([label, seconds]) => (
						<View key={label}>
							<Text style={styles.metricLabel}>{label}</Text>
							<Text style={styles.hoardValue}>{formatDuration(Number(seconds))}</Text>
						</View>
					))}
				</View>
			</Card>
			<Card>
				<SectionTitle title="Offline boost slots" detail={`${offline.unlockedOfflineBoostSlots}/3 unlocked · requirements: 25h, 250h, and 2,500h of Pomodoro focus.`} />
				<ActionButton label={offline.unlockedOfflineBoostSlots >= 3 ? 'All boost slots unlocked' : `Unlock slot ${offline.unlockedOfflineBoostSlots + 1}`} disabled={offline.unlockedOfflineBoostSlots >= 3} onPress={offline.purchaseOfflineBoostSlot} />
			</Card>
			<Card>
				<SectionTitle title="App blocking" detail="Screen Time / Digital Wellbeing connection still requires a native integration and permission flow." />
				<View style={uiStyles.wrap}>
					{(['disabled', 'on-limit', 'always-on-blocked-app'] as const).map(value => (
						<Chip key={value} label={value.replaceAll('-', ' ')} selected={offline.appBlockingMode === value} onPress={() => offline.setAppBlockingMode(value, mode === 'hard' || mode === 'hard-plus')} />
					))}
				</View>
				{offline.blockedApps.length ?
					offline.blockedApps.map(app => (
						<Text key={app} style={uiStyles.body}>
							• {app}
						</Text>
					))
				:	<Text style={uiStyles.muted}>No blocked apps selected yet.</Text>}
			</Card>
		</>
	);
}

const formatDuration = (seconds: number) => (seconds < 60 ? `${Math.floor(seconds)}s` : `${Math.floor(seconds / 60)}m`);
