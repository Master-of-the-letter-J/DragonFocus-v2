import { styles } from '@/components/pages/earth/earth.styles';
import { DragonAppScreen } from '@/components/app-shell/DragonAppScreen';
import { EARTH_TABS, type EarthTab } from '@/components/pages/earth/earth-tabs';
import { GoalBoard } from '@/components/pages/earth/GoalBoard';
import { ActionButton, Card, Chip, PageIntro, ProgressBar, SectionTitle, TabStrip, uiStyles } from '@/components/ui/DragonUI';
import { dragonTheme } from '@/constants/dragon-theme';
import { MILESTONES, milestoneForEnergy } from '@/data/world-data/milestones';
import { POMODORO_BOOSTS } from '@/data/productivity-data/pomodoro-boosts';
import { useOfflineProgressStore } from '@/store/store-offline-progress/_useOfflineProgressStore';
import { useProductionSpecialStore } from '@/store/store-production-special/_useProductionSpecialStore';
import { useProductivityStore } from '@/store/store-productivity/_useProductivityStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import { formatDecimal } from '@/utils/decimal';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

const { colors } = dragonTheme;

export default function EarthRoute() {
	const params = useLocalSearchParams<{ tab?: EarthTab }>();
	const [tab, setTab] = useState<EarthTab>(EARTH_TABS.some(candidate => candidate.id === params.tab) ? params.tab! : 'command');
	return (
		<DragonAppScreen title="The Earth" panel={tab === 'active' || tab === 'finished' ? 'goals' : 'dragon'} effects={tab === 'command'}>
			<TabStrip tabs={EARTH_TABS} value={tab} onChange={setTab} />
			{tab === 'command' ?
				<CommandCenter />
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
	const resources = useWorldStore(state => state.resourceStore.resources);
	const deaths = useWorldStore(state => state.resourceStore.populationDead);
	const hostiles = useWorldStore(state => state.populationStore);
	const clickWorld = useWorldStore(state => state.dragonStore.clickWorld);
	const survey = useProductivityStore(state => state.surveys);
	const currentMilestone = milestoneForEnergy(useWorldStore.getState().resourceStore.totalAllTime.energy);
	const next = MILESTONES.find(milestone => milestone.id > currentMilestone);
	const pulse = useSharedValue(1);
	const earthStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
	const tapEarth = () => {
		// eslint-disable-next-line react-hooks/immutability
		pulse.value = withSequence(withSpring(0.94), withSpring(1.03), withSpring(1));
		clickWorld();
	};
	return (
		<>
			<PageIntro eyebrow="Living world" title="Command Center" description="Protect the population, keep the dragon steady, and turn focused action into momentum." />
			<Card style={styles.populationCard}>
				<View style={styles.populationRow}>
					<View>
						<Text style={styles.metricLabel}>Population</Text>
						<Text style={styles.population}>{formatDecimal(resources.population)}</Text>
					</View>
					<View style={styles.deathColumn}>
						<Text style={styles.metricLabel}>Recorded deaths</Text>
						<Text style={styles.deaths}>{formatDecimal(deaths)}</Text>
					</View>
				</View>
				{hostiles.zombies.gt(0) || hostiles.cyborgs.gt(0) ?
					<Text style={uiStyles.muted}>
						Zombies {formatDecimal(hostiles.zombies)} · Cyborgs {formatDecimal(hostiles.cyborgs)}
					</Text>
				:	null}
			</Card>
			<Pressable accessibilityRole="button" accessibilityLabel="Grow the world" onPress={tapEarth} style={styles.earthStage}>
				<View style={styles.orbitOuter}>
					<View style={styles.orbitInner} />
				</View>
				<Animated.View style={[styles.earthGlow, earthStyle]}>
					<Image source={require('@/assets/images/other/planet-earth-test.png')} resizeMode="contain" style={styles.earthImage} />
				</Animated.View>
				<Text style={styles.tapHint}>Tap the Earth for growth</Text>
			</Pressable>
			<Card accent="gold">
				<SectionTitle title={next ? `Approaching Milestone ${next.id}` : 'All known milestones reached'} detail={next ? `${formatDecimal(resources.energy)} / ${formatDecimal(next.energy)} Energy` : 'The horizon is yours.'} />
				{next ?
					<ProgressBar value={resources.energy.div(next.energy).times(100).toNumber()} label={`Milestone ${currentMilestone} complete`} color={colors.gold} />
				:	null}
			</Card>
			<View style={styles.surveyRow}>
				<ActionButton label={survey.checkInCompleted ? 'Checked in' : 'Check in'} disabled={survey.checkInCompleted} onPress={() => router.push('/check-in-survey')} />
				<ActionButton tone="secondary" label={survey.checkOutCompleted ? 'Checked out' : 'Check out'} disabled={!survey.checkOutAvailable || survey.checkOutCompleted} onPress={() => router.push('/check-out-survey')} />
			</View>
		</>
	);
}

function FocusCave() {
	const pomodoro = useProductivityStore(state => state.pomodoro);
	const heart = useProductionSpecialStore(state => state.crimsonHeart.charge);
	const maxHeart = useProductionSpecialStore(state => state.crimsonHeart.getMaximumCharge());
	const [focusTab, setFocusTab] = useState<'heart' | 'pomodoro' | 'stopwatch' | 'timer' | 'wall'>('heart');
	const focusTabs = [
		{ id: 'heart', label: 'Crimson Heart' },
		{ id: 'pomodoro', label: 'Pomodoro' },
		{ id: 'stopwatch', label: 'Stopwatch' },
		{ id: 'timer', label: 'Timer' },
		{ id: 'wall', label: 'Stare at a Wall' },
	] as const;
	const startSession = (mode: Exclude<typeof focusTab, 'heart'>, wallCountdown = false) => {
		const started = mode === 'stopwatch' || (mode === 'wall' && !wallCountdown) ? pomodoro.startCountUp() : pomodoro.startCountdown(25);
		if (started) router.push({ pathname: '/focus-session', params: { mode, wallCountdown: wallCountdown ? 'true' : 'false' } });
	};
	return (
		<>
			<PageIntro eyebrow="Focus chamber" title="Pomodoro Cave" description="Choose a focus format, then enter its dedicated full-screen session. The normal app tabs disappear until you exit." />
			<TabStrip tabs={focusTabs} value={focusTab} onChange={setFocusTab} />
			{focusTab === 'heart' ?
				<Card accent="crimson" style={styles.heartCard}>
					<Text style={styles.heartGlyph}>♥</Text>
					<Text style={styles.heartValue}>{heart.toFixed(1)}%</Text>
					<ProgressBar value={heart} max={maxHeart} color={colors.crimsonBright} label={`${pomodoro.status.replaceAll('-', ' ')} · maximum ${maxHeart.toFixed(0)}%`} />
					<View style={styles.boostGrid}>
						{POMODORO_BOOSTS.map(boost => (
							<View key={boost.id} style={styles.boost}>
								<Text style={styles.boostName}>{boost.name}</Text>
								<Text style={uiStyles.muted}>
									×{boost.resourceMultiplier} · {boost.description}
								</Text>
							</View>
						))}
					</View>
				</Card>
			:	<Card accent={focusTab === 'pomodoro' || focusTab === 'timer' ? 'gold' : 'violet'}>
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
			}
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
