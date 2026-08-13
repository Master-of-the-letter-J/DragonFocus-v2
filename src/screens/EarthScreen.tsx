import { DragonAppScreen } from '@/components/app-shell/DragonAppScreen';
import { ActionButton, Card, Chip, EmptyState, PageIntro, ProgressBar, SectionTitle, TabStrip, uiStyles } from '@/components/ui/DragonUI';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { MILESTONES, milestoneForEnergy } from '@/data/world-data/milestones';
import { useOffline } from '@/store/store-offline-progress/_useOfflineProgressStore';
import { useCrimsonHeartStore } from '@/store/store-production-special/createCrimsonHeartSlice';
import { useGoalStore } from '@/store/store-productivity/createGoalSlice';
import { POMODORO_BOOSTS, usePomodoroStore } from '@/store/store-productivity/createPomodoroSlice';
import { useSurveyStore } from '@/store/store-productivity/createSurveySlice';
import { useDragonStore } from '@/store/store-world/createDragonSlice';
import { usePopulationStore } from '@/store/store-world/createPopulationSlice';
import { useResourceStore } from '@/store/store-world/createResourceSlice';
import { useWorldOptionsStore } from '@/store/store-world/createWorldOptionsSlice';
import type { Goal, GoalType } from '@/types/goals.types';
import { formatDecimal } from '@/utils/decimal';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

const { colors, radius, space } = dragonTheme;
type EarthTab = 'command' | 'active' | 'finished' | 'focus' | 'hoard';
type GoalFilter = 'habit' | 'task' | 'special-habit' | 'all';
const earthTabs = [
	{ id: 'command', label: 'Command Center' },
	{ id: 'active', label: 'Active Goals' },
	{ id: 'finished', label: 'Finished' },
	{ id: 'focus', label: 'Pomodoro Cave' },
	{ id: 'hoard', label: "Hoard's Cave" },
] as const;

export default function EarthScreen() {
	const params = useLocalSearchParams<{ tab?: EarthTab }>();
	const [tab, setTab] = useState<EarthTab>(earthTabs.some(candidate => candidate.id === params.tab) ? params.tab! : 'command');
	return (
		<DragonAppScreen title="The Earth" panel={tab === 'active' || tab === 'finished' ? 'goals' : 'dragon'} effects={tab === 'command'}>
			<TabStrip tabs={earthTabs} value={tab} onChange={setTab} />
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
	const resources = useResourceStore(state => state.resources);
	const deaths = useResourceStore(state => state.populationDead);
	const hostiles = usePopulationStore();
	const clickWorld = useDragonStore(state => state.clickWorld);
	const survey = useSurveyStore();
	const currentMilestone = milestoneForEnergy(useResourceStore.getState().totalAllTime.energy);
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

function GoalBoard({ completed }: { completed: boolean }) {
	const store = useGoalStore();
	const mode = useWorldOptionsStore(state => state.gameMode);
	const [filter, setFilter] = useState<GoalFilter>('all');
	const [newGoal, setNewGoal] = useState('');
	const [newType, setNewType] = useState<Extract<GoalType, 'habit' | 'task'>>('task');
	const [openedAt] = useState(() => Date.now());
	const active = [...store.incompleteHabits, ...store.incompleteTasks, ...store.specialHabits.filter(goal => goal.status === 'incomplete')];
	const goals = completed ? store.completed.filter(goal => !goal.completedAt || openedAt - Date.parse(goal.completedAt) <= 86_400_000) : active;
	const shown = filter === 'all' ? goals : goals.filter(goal => goal.type === filter);
	const filters = [
		{ id: 'habit', label: 'Habits' },
		{ id: 'task', label: 'Tasks' },
		{ id: 'special-habit', label: 'Special' },
		{ id: 'all', label: 'View all' },
	] as const;
	return (
		<>
			<PageIntro eyebrow={completed ? 'Last 24 hours' : 'Today'} title={completed ? 'Finished Goals' : 'Active Goals'} description={completed ? 'Everything ready to turn into rewards.' : 'Habits first, then tasks, with permanent special goals alongside them.'} />
			<TabStrip tabs={filters} value={filter} onChange={setFilter} />
			{!completed ?
				<Card>
					<SectionTitle title="Add a goal" detail="A compact creator for the everyday case. Full editing lives in check-in." />
					<View style={styles.goalInputRow}>
						<TextInput value={newGoal} onChangeText={setNewGoal} placeholder="What will you finish?" placeholderTextColor={colors.muted} style={styles.input} />
						<ActionButton
							compact
							label="Add"
							disabled={!newGoal.trim()}
							onPress={() => {
								const added = store.addGoal({ title: newGoal, type: newType });
								if (added) setNewGoal('');
							}}
						/>
					</View>
					<View style={uiStyles.wrap}>
						{(['habit', 'task'] as const).map(type => (
							<Chip key={type} label={type === 'habit' ? 'Habit' : 'To-do'} selected={newType === type} onPress={() => setNewType(type)} />
						))}
					</View>
				</Card>
			:	null}
			<View style={styles.goalList}>
				{shown.length ?
					shown.map(goal => <GoalCard key={goal.id} goal={goal} completed={completed} onAction={() => (completed ? store.restoreGoal(goal.id) : store.completeGoal(goal.id))} />)
				:	<EmptyState icon={completed ? '✦' : '✓'} title={completed ? 'Nothing waiting to harvest' : 'Clear skies'} description={completed ? 'Completed goals will appear here for 24 hours.' : 'Add a goal or enjoy the quiet.'} />}
			</View>
			{completed ?
				<Card accent="gold">
					<SectionTitle title="Harvest rewards" detail={`${store.pendingHarvestIds.length} reward bundles are ready. Harvesting always includes every goal.`} />
					<ActionButton label={`Harvest all (${store.pendingHarvestIds.length})`} disabled={!store.pendingHarvestIds.length || mode === 'lock-in'} onPress={() => store.harvestAllPending(mode)} />
				</Card>
			:	<View style={styles.surveyRow}>
					<ActionButton tone="quiet" label="Check in" onPress={() => router.push('/check-in-survey')} />
					<ActionButton tone="quiet" label="Check out" onPress={() => router.push('/check-out-survey')} />
				</View>
			}
		</>
	);
}

function GoalCard({ goal, completed, onAction }: { goal: Goal; completed: boolean; onAction: () => void }) {
	return (
		<Animated.View entering={FadeInDown.duration(240)}>
			<Card>
				<View style={styles.goalRow}>
					<View style={styles.goalCopy}>
						<View style={uiStyles.wrap}>
							<Text style={styles.goalType}>{goal.type.replace('-', ' ')}</Text>
							<Text style={styles.goalDifficulty}>{goal.difficulty}</Text>
							{goal.challenge !== 'none' ?
								<Text style={styles.challenge}>{goal.challenge}</Text>
							:	null}
						</View>
						<Text style={styles.goalTitle}>{goal.title}</Text>
						{goal.description ?
							<Text style={uiStyles.muted}>{goal.description}</Text>
						:	null}
					</View>
					<ActionButton compact tone={completed ? 'quiet' : 'primary'} label={completed ? 'Undo' : 'Done'} onPress={onAction} />
				</View>
			</Card>
		</Animated.View>
	);
}

function FocusCave() {
	const pomodoro = usePomodoroStore();
	const heart = useCrimsonHeartStore(state => state.charge);
	const maxHeart = useCrimsonHeartStore(state => state.getMaximumCharge());
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
	const offline = useOffline();
	const mode = useWorldOptionsStore(state => state.gameMode);
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
const styles = StyleSheet.create({
	populationCard: { backgroundColor: '#111922', borderColor: '#253E4B' },
	populationRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
	metricLabel: { color: colors.muted, fontFamily: appFonts.medium, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
	population: { color: colors.blue, fontFamily: appFonts.black, fontSize: 28 },
	deathColumn: { alignItems: 'flex-end' },
	deaths: { color: colors.muted, fontFamily: appFonts.bold, fontSize: 18 },
	earthStage: { height: 310, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
	orbitOuter: { position: 'absolute', width: 285, height: 285, borderRadius: 150, borderWidth: 1, borderColor: '#263746', transform: [{ rotate: '-12deg' }] },
	orbitInner: { position: 'absolute', left: 26, top: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
	earthGlow: { width: 230, height: 230, borderRadius: 130, backgroundColor: '#142A3A', shadowColor: colors.blue, shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
	earthImage: { width: '100%', height: '100%' },
	tapHint: { color: colors.muted, fontFamily: appFonts.medium, fontSize: 11, marginTop: 13 },
	surveyRow: { flexDirection: 'row', gap: space.sm },
	goalInputRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
	input: { flex: 1, minHeight: 46, backgroundColor: colors.canvas, borderColor: colors.line, borderWidth: 1, borderRadius: radius.medium, color: colors.ink, fontFamily: appFonts.regular, paddingHorizontal: 14 },
	goalList: { gap: space.sm },
	goalRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
	goalCopy: { flex: 1, gap: 5 },
	goalTitle: { color: colors.ink, fontFamily: appFonts.semibold, fontSize: 15 },
	goalType: { color: colors.gold, fontFamily: appFonts.bold, fontSize: 10, textTransform: 'uppercase' },
	goalDifficulty: { color: colors.muted, fontFamily: appFonts.medium, fontSize: 10, textTransform: 'uppercase' },
	challenge: { color: colors.violet, fontFamily: appFonts.bold, fontSize: 10, textTransform: 'uppercase' },
	heartCard: { alignItems: 'center', paddingVertical: 28 },
	heartGlyph: { color: colors.crimsonBright, fontSize: 72, textShadowColor: colors.crimson, textShadowRadius: 18 },
	heartValue: { color: colors.ink, fontFamily: appFonts.black, fontSize: 34 },
	boostGrid: { width: '100%', gap: space.sm, paddingTop: space.md },
	boost: { backgroundColor: colors.canvasRaised, borderRadius: radius.medium, padding: space.md, gap: 3 },
	boostName: { color: colors.ink, fontFamily: appFonts.semibold, fontSize: 13 },
	timer: { color: colors.ink, fontFamily: appFonts.mono, fontSize: 52, textAlign: 'center', letterSpacing: 2, paddingVertical: 24 },
	timerActions: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, flexWrap: 'wrap' },
	adjustments: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: space.sm },
	statsRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.lg },
	hoardValue: { color: colors.ink, fontFamily: appFonts.bold, fontSize: 18 },
});
