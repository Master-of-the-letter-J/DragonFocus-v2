import { ActionButton, Card, Chip, EmptyState, ProgressBar, SectionTitle, uiStyles } from '@/components/ui/DragonUI';
import { SurveyGoalEditor } from '@/components/features/surveys/SurveyGoalEditor';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { useProductivityStore } from '@/store/store-productivity/_useProductivityStore';
import type { SurveyKind, SurveyRewardSummary } from '@/store/store-productivity/createSurveySlice';
import { useAppStore } from '@/store/useAppStore';
import { useStatsStore } from '@/store/useStatsStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import type { Goal } from '@/types/goals.types';
import type { GameMode } from '@/types/world.types';
import { decimal, formatDecimal } from '@/utils/decimal';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

const { colors, radius, space } = dragonTheme;
const MOOD_EMOJIS: Record<string, string> = {
	excited: '🤩',
	surprised: '😲',
	shocked: '😳',
	enraged: '😡',
	disgusted: '🤢',
	fulfilled: '😊',
	calm: '😌',
	content: '🙂',
	uneasy: '😟',
	confused: '😕',
	anxious: '😰',
	serene: '😌',
	sleepy: '😴',
	bored: '😐',
	drained: '🥱',
	despair: '😞',
	great: '🤩',
	good: '🙂',
	okay: '😐',
	tired: '😴',
	meh: '😕',
	down: '🙁',
	sad: '😢',
	angry: '😠',
};
const MOOD_GROUPS = [
	{ label: 'High energy', values: ['excited', 'surprised', 'shocked', 'enraged', 'disgusted'] },
	{ label: 'Medium energy', values: ['fulfilled', 'calm', 'content', 'uneasy', 'confused', 'anxious'] },
	{ label: 'Low energy', values: ['serene', 'sleepy', 'bored', 'drained', 'despair'] },
	{ label: 'Basic', values: ['great', 'good', 'okay', 'meh', 'down', 'sad', 'angry'] },
] as const;
const EMPTY_REWARDS: SurveyRewardSummary = { xp: '0', darkEnergy: '0', shards: '0', quarks: '0', furyReduction: '0' };
const titleCase = (value: string) => value.replace(/\b\w/g, character => character.toUpperCase());
const moodLabel = (value: string) => `${MOOD_EMOJIS[value.toLowerCase()] ?? '💭'} ${titleCase(value)}`;
const surveyFuryLoss = (mood: string) => {
	const high = new Set(['excited', 'surprised', 'shocked', 'enraged', 'disgusted']);
	const medium = new Set(['fulfilled', 'calm', 'content', 'uneasy', 'confused', 'anxious']);
	return high.has(mood) ? 5 : medium.has(mood) ? 3 : 1;
};
const rewardTotal = (rewards: SurveyRewardSummary[]): SurveyRewardSummary => ({
	xp: rewards.reduce((total, reward) => total.plus(reward.xp), decimal(0)).toString(),
	darkEnergy: rewards.reduce((total, reward) => total.plus(reward.darkEnergy), decimal(0)).toString(),
	shards: rewards.reduce((total, reward) => total.plus(reward.shards), decimal(0)).toString(),
	quarks: rewards.reduce((total, reward) => total.plus(reward.quarks), decimal(0)).toString(),
	furyReduction: rewards.reduce((total, reward) => total.plus(reward.furyReduction), decimal(0)).toString(),
});

export function SurveyPage({ kind }: { kind: SurveyKind }) {
	const survey = useProductivityStore(useShallow(state => ({
		checkInCompleted: state.surveys.checkInCompleted,
		checkOutCompleted: state.surveys.checkOutCompleted,
		completeCheckIn: state.surveys.completeCheckIn,
		completeCheckOut: state.surveys.completeCheckOut,
		getAdvice: state.surveys.getAdvice,
		getQuote: state.surveys.getQuote,
	})));
	const goals = useProductivityStore(useShallow(state => ({
		archived: state.goals.archived,
		completeGoal: state.goals.completeGoal,
		completed: state.goals.completed,
		incompleteHabits: state.goals.incompleteHabits,
		incompleteTasks: state.goals.incompleteTasks,
		pendingHarvestIds: state.goals.pendingHarvestIds,
		addGoal: state.goals.addGoal,
		harvestAllPending: state.goals.harvestAllPending,
		restoreGoal: state.goals.restoreGoal,
		specialHabits: state.goals.specialHabits,
	})));
	const preferences = useProductivityStore(useShallow(state => ({
		adviceCategories: state.surveyPreferences.adviceCategories,
		emotions: state.surveyPreferences.emotions,
		enabledQuestions: state.surveyPreferences.enabledQuestions,
		questionOrder: state.surveyPreferences.questionOrder,
		quoteCount: state.surveyPreferences.quoteCount,
		quotePosition: state.surveyPreferences.quotePosition,
	})));
	const surveyHistory = useStatsStore(useShallow(state => ({ checkIns: state.checkIns, checkOuts: state.checkOuts })));
	const requireCheckIn = useAppStore(state => state.requireDailyCheckIn);
	const gameMode = useWorldStore(state => state.optionsStore.gameMode);
	const { getAdvice, getQuote } = survey;
	const [step, setStep] = useState(0);
	const [mood, setMood] = useState(preferences.emotions[0] ?? 'calm');
	const [goalTitle, setGoalTitle] = useState('');
	const [goalsAdded, setGoalsAdded] = useState(0);
	const [reflection, setReflection] = useState('');
	const [harvested, setHarvested] = useState(false);
	const [harvestedGoalCount, setHarvestedGoalCount] = useState(0);
	const [rewardSummary, setRewardSummary] = useState<SurveyRewardSummary>(EMPTY_REWARDS);
	const [rewardPopupDismissed, setRewardPopupDismissed] = useState(false);
	const isCheckIn = kind === 'check-in';
	const isFirstSurvey = surveyHistory.checkIns + surveyHistory.checkOuts === 0;
	const questions = useMemo(() => {
		const enabled = preferences.questionOrder.filter(question => {
			if (!preferences.enabledQuestions[question]) return false;
			if (!isCheckIn && (question === 'create-habit' || question === 'create-task')) return false;
			if (isFirstSurvey && isCheckIn && (question === 'create-habit' || question === 'create-task')) return false;
			return true;
		});
		return enabled.includes('advice') ? ['advice', ...enabled.filter(question => question !== 'advice')] : enabled;
	}, [isCheckIn, isFirstSurvey, preferences.enabledQuestions, preferences.questionOrder]);
	const totalSteps = Math.max(1, questions.length + (isCheckIn ? 1 : 2));
	const question = questions[step];
	const isHarvestStep = !isCheckIn && step === questions.length;
	const isResultsStep = step === totalSteps - 1;
	const advice = useMemo(() => getAdvice(1)[0] ?? 'Choose the next honest step.', [getAdvice]);
	const quotes = useMemo(() => {
		const available = getQuote(undefined, preferences.quoteCount);
		return Array.from({ length: preferences.quoteCount }, (_, index) => available[index % Math.max(1, available.length)]).filter((quote): quote is NonNullable<typeof quote> => Boolean(quote));
	}, [getQuote, preferences.quoteCount]);
	const moodGroups = useMemo(() => {
		const available = preferences.emotions.length ? preferences.emotions : ['calm'];
		const byName = new Map(available.map(value => [value.toLowerCase(), value]));
		const known = new Set<string>(MOOD_GROUPS.flatMap(group => group.values));
		const groups = MOOD_GROUPS.map(group => ({ label: group.label, values: group.values.map(value => byName.get(value)).filter((value): value is string => Boolean(value)) })).filter(group => group.values.length);
		const other = available.filter(value => !known.has(value.toLowerCase()));
		return other.length ? [...groups, { label: 'Other', values: other }] : groups;
	}, [preferences.emotions]);
	const harvestableGoals = useMemo(() => {
		const completed = [...goals.completed, ...goals.specialHabits.filter(goal => goal.status === 'completed')];
		return completed.filter(goal => goals.pendingHarvestIds.includes(goal.id));
	}, [goals.completed, goals.pendingHarvestIds, goals.specialHabits]);
	const addSurveyGoal = (type: 'habit' | 'task') => {
		if (!goalTitle.trim()) return;
		if (goals.addGoal({ title: goalTitle, type })) {
			setGoalTitle('');
			setGoalsAdded(current => current + 1);
		}
	};
	const harvestRewards = () => {
		if (gameMode === 'lock-in') {
			setHarvested(true);
			return;
		}
		const rewards = goals.harvestAllPending(gameMode);
		setRewardSummary(rewardTotal(rewards));
		setHarvestedGoalCount(rewards.length);
		setHarvested(true);
	};
	const finish = () => {
		if (isCheckIn) {
			survey.completeCheckIn({ mood, goalsAdded, reflection });
			router.back();
		} else if (survey.completeCheckOut({ mood, goalsHarvested: harvestedGoalCount, reflection, rewards: rewardSummary }, !requireCheckIn)) router.back();
	};

	if (!isCheckIn && requireCheckIn && !survey.checkInCompleted)
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.blocked}>
					<Text style={styles.title}>Check-in comes first</Text>
					<Text style={uiStyles.muted}>Complete today’s check-in before closing the day, or disable this requirement in Settings.</Text>
					<ActionButton label="Go to check-in" onPress={() => router.replace('/check-in-survey')} />
				</View>
			</SafeAreaView>
		);
	if (!isCheckIn && survey.checkOutCompleted)
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.blocked}>
					<Text style={styles.title}>Check-out complete</Text>
					<Text style={uiStyles.muted}>Fill in another check-in before starting a new check-out cycle.</Text>
					<ActionButton label="Close" onPress={() => router.back()} />
				</View>
			</SafeAreaView>
		);

	return (
		<SafeAreaView style={styles.safe}>
			<View style={styles.header}>
				<ActionButton compact tone="quiet" label="×" accessibilityLabel="Exit survey" onPress={() => router.back()} />
				<View style={styles.headerCopy}>
					<Text style={styles.eyebrow}>{isCheckIn ? 'BEGIN THE DAY' : 'CLOSE THE DAY'}</Text>
					<Text style={styles.headerTitle}>{isCheckIn ? 'Check-In Survey' : 'Check-Out Survey'}</Text>
				</View>
				<Text style={styles.step}>{step + 1}/{totalSteps}</Text>
			</View>
			<ProgressBar value={step + 1} max={totalSteps} color={isCheckIn ? colors.gold : colors.crimsonBright} />
			<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
				<Animated.View key={step} entering={FadeInRight.duration(180)} style={styles.question}>
					{!isResultsStep && preferences.quotePosition === 'start' && step === 0 ? <QuoteCards quotes={quotes} /> : null}
					{isResultsStep ?
						<SurveyResults isCheckIn={isCheckIn} mood={mood} goalsAdded={goalsAdded} pendingGoalCount={goals.pendingHarvestIds.length} harvestedGoalCount={harvestedGoalCount} rewards={rewardSummary} onOpenRewards={() => setRewardPopupDismissed(false)} />
					: isHarvestStep ?
						<HarvestReview goals={harvestableGoals} pendingCount={goals.pendingHarvestIds.length} gameMode={gameMode} harvested={harvested} onRestore={goals.restoreGoal} onHarvest={harvestRewards} />
					: question === 'mood' ?
						<View style={styles.moodQuestion}>
							<Text style={[styles.questionTitle, styles.centeredText]}>How do you feel?</Text>
							<Text style={[styles.questionDescription, styles.centeredText]}>Choose the mood that best fits right now. It gently reduces Fury by 5, 3, or 1.</Text>
							{moodGroups.map(group => (
								<View key={group.label} style={styles.moodGroup}>
									<Text style={styles.moodGroupLabel}>{group.label}</Text>
									<View style={styles.moods}>{group.values.map(value => <Chip key={value} label={moodLabel(value)} selected={mood === value} onPress={() => setMood(value)} />)}</View>
								</View>
							))}
						</View>
					: question === 'create-habit' ?
						<>
							<Text style={styles.questionTitle}>Create a Habit</Text>
							<Text style={styles.questionDescription}>Choose one repeatable action to carry through the day.</Text>
							<TextInput value={goalTitle} onChangeText={setGoalTitle} placeholder="A small, sustainable habit" placeholderTextColor={colors.muted} style={styles.input} />
							<View style={styles.goalButtons}><ActionButton tone="quiet" label="Add Habit" disabled={!goalTitle.trim()} onPress={() => addSurveyGoal('habit')} /></View>
						</>
					: question === 'create-task' ?
						<>
							<Text style={styles.questionTitle}>Create a Task</Text>
							<Text style={styles.questionDescription}>Name one concrete action that would move today forward.</Text>
							<TextInput value={goalTitle} onChangeText={setGoalTitle} placeholder="A small, specific task" placeholderTextColor={colors.muted} style={styles.input} />
							<View style={styles.goalButtons}><ActionButton label="Add Task" disabled={!goalTitle.trim()} onPress={() => addSurveyGoal('task')} /></View>
						</>
					: question === 'review-goals' ?
						<SurveyGoalEditor kind={kind} onGoalAdded={() => setGoalsAdded(current => current + 1)} />
						: question === 'advice' ?
						<>
							<Text style={styles.questionTitle}>Survey Advice</Text>
							<Text style={styles.questionDescription}>A small encouragement for completing the briefing or debriefing.</Text>
							<Card accent="violet"><Text style={styles.advice}>{advice}</Text></Card>
							<View style={styles.moods}>{preferences.adviceCategories.map(category => <Chip key={category} label={category} />)}</View>
						</>
					: question === 'journal' ?
						<>
							<Text style={styles.questionTitle}>{isCheckIn ? 'Set your intention' : 'Leave a final note'}</Text>
							<Text style={styles.questionDescription}>{isCheckIn ? 'What would make today feel deliberately spent?' : 'What should tomorrow remember?'}</Text>
							<TextInput multiline value={reflection} onChangeText={setReflection} placeholder="Write a brief reflection…" placeholderTextColor={colors.muted} style={[styles.input, styles.journal]} />
							<Card accent={isCheckIn ? 'gold' : 'crimson'}><SectionTitle title={isCheckIn ? 'The dragon is listening' : 'The archive is ready'} detail={isCheckIn ? `${goals.incompleteHabits.length + goals.incompleteTasks.length} active goals will enter the day.` : `${goals.pendingHarvestIds.length} rewards can be collected from Harvest Goals.`} /></Card>
						</>
					: 	<><Text style={styles.questionTitle}>Ready when you are</Text><Text style={styles.questionDescription}>No optional questions are enabled. Complete the survey to continue.</Text></>}
					{!isResultsStep && preferences.quotePosition === 'end' && step === questions.length - 1 ? <QuoteCards quotes={quotes} /> : null}
				</Animated.View>
			</ScrollView>
			<View style={styles.footer}>
				{step > 0 ? <ActionButton tone="quiet" label="Back" onPress={() => setStep(current => current - 1)} /> : <View />}
				{step < totalSteps - 1 ?
					<ActionButton label={isHarvestStep ? 'Continue to results' : 'Continue'} disabled={isHarvestStep && goals.pendingHarvestIds.length > 0 && !harvested && gameMode !== 'lock-in'} onPress={() => setStep(current => current + 1)} />
				:	<ActionButton label={isCheckIn ? 'Complete check-in' : 'Complete check-out'} onPress={finish} />}
			</View>
			<RewardPopup visible={isResultsStep && !rewardPopupDismissed} isCheckIn={isCheckIn} mood={mood} rewards={rewardSummary} onClose={() => setRewardPopupDismissed(true)} />
		</SafeAreaView>
	);
}

function HarvestReview({ goals, pendingCount, gameMode, harvested, onRestore, onHarvest }: { goals: Goal[]; pendingCount: number; gameMode: GameMode; harvested: boolean; onRestore: (id: string) => boolean; onHarvest: () => void }) {
	return (
		<Card accent="gold">
			<Text style={styles.questionTitle}>Harvest Goals!</Text>
			<Text style={styles.questionDescription}>Confirm the completed goals that will become rewards. You can un-complete any goal before harvesting.</Text>
			{goals.length ?
				<View style={styles.harvestList}>
					{goals.map(goal => (
						<View key={goal.id} style={styles.harvestRow}>
							<View style={styles.goalCopy}><Text style={styles.reviewTitle}>{goal.title}</Text><Text style={uiStyles.muted}>{goal.type === 'habit' ? 'Habit' : 'Task'} · {goal.difficulty}</Text></View>
							<ActionButton compact tone="quiet" label="Un-complete" onPress={() => onRestore(goal.id)} />
						</View>
					))}
				</View>
			:	<EmptyState icon={harvested ? '✦' : '○'} title={harvested ? 'Rewards harvested' : 'No completed goals yet'} description={harvested ? 'Your confirmed rewards are ready in the results.' : 'Complete a goal in the editor above, or continue without a harvest.'} />}
			{gameMode === 'lock-in' ?
				<Text style={uiStyles.muted}>Lock-In keeps rewards hidden until the mode ends.</Text>
			:	<ActionButton label={harvested ? 'Rewards harvested' : `Harvest ${pendingCount} reward${pendingCount === 1 ? '' : 's'}`} disabled={harvested || !pendingCount} onPress={onHarvest} />}
		</Card>
	);
}

function SurveyResults({ isCheckIn, mood, goalsAdded, pendingGoalCount, harvestedGoalCount, rewards, onOpenRewards }: { isCheckIn: boolean; mood: string; goalsAdded: number; pendingGoalCount: number; harvestedGoalCount: number; rewards: SurveyRewardSummary; onOpenRewards: () => void }) {
	return (
		<View style={styles.results}>
			<Text style={styles.questionTitle}>Results</Text>
			<Text style={styles.questionDescription}>{isCheckIn ? 'Your briefing is complete. Check-out remains available until the end of the day.' : 'Your debriefing is complete. These rewards have been added to your progression.'}</Text>
			<Card accent={isCheckIn ? 'gold' : 'crimson'}>
				<SectionTitle title={`${moodLabel(mood)} mood`} detail={isCheckIn ? `${goalsAdded} goal${goalsAdded === 1 ? '' : 's'} added · ${pendingGoalCount} ready for Check-Out harvest` : `${harvestedGoalCount} goal${harvestedGoalCount === 1 ? '' : 's'} harvested`} action={<ActionButton compact tone="quiet" label="Reward details" onPress={onOpenRewards} />} />
			</Card>
			{!isCheckIn ?
				<Card accent="gold">
					<SectionTitle title="Rewards received" />
					<RewardRow label="Experience" value={rewards.xp} />
					<RewardRow label="Dark Energy" value={rewards.darkEnergy} />
					<RewardRow label="Crimson Shards" value={rewards.shards} />
					<RewardRow label="Quarks" value={rewards.quarks} />
					<RewardRow label="Fury reduced" value={rewards.furyReduction} />
				</Card>
			:	null}
		</View>
	);
}

function RewardPopup({ visible, isCheckIn, mood, rewards, onClose }: { visible: boolean; isCheckIn: boolean; mood: string; rewards: SurveyRewardSummary; onClose: () => void }) {
	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<Pressable style={styles.rewardScrim} onPress={onClose}>
				<Pressable style={styles.rewardModal} onPress={event => event.stopPropagation()}>
					<View style={styles.rewardModalHeader}>
						<View><Text style={styles.rewardEyebrow}>SURVEY REWARDS</Text><Text style={styles.rewardTitle}>{isCheckIn ? 'Check-In Results' : 'Check-Out Results'}</Text></View>
						<Pressable accessibilityRole="button" accessibilityLabel="Close rewards" onPress={onClose}><Text style={styles.rewardClose}>×</Text></Pressable>
					</View>
					<RewardRow label={`Take ${isCheckIn ? 'Check-In' : 'Check-Out'} Survey · Fury loss`} value={`-${surveyFuryLoss(mood)}`} />
					{!isCheckIn ?
						<>
							<RewardRow label="Goal experience" value={rewards.xp} />
							<RewardRow label="Goal Dark Energy" value={rewards.darkEnergy} />
							<RewardRow label="Goal Crimson Shards" value={rewards.shards} />
							<RewardRow label="Goal Quarks" value={rewards.quarks} />
							<RewardRow label="Goal Fury loss" value={`-${rewards.furyReduction}`} />
						</>
					:	null}
					<Text style={styles.rewardNote}>Linked survey and Pomodoro special goals are checked off automatically when their event happens.</Text>
					<ActionButton label="Continue" onPress={onClose} />
				</Pressable>
			</Pressable>
		</Modal>
	);
}

function RewardRow({ label, value }: { label: string; value: string }) {
	return <View style={styles.resultRow}><Text style={styles.resultLabel}>{label}</Text><Text style={styles.resultValue}>{formatDecimal(value)}</Text></View>;
}

function QuoteCards({ quotes }: { quotes: { id: string; text: string; author: string }[] }) {
	return <View style={styles.quoteList}>{quotes.map((quote, index) => <Card key={`${quote.id}-${index}`} accent="violet"><Text style={styles.quote}>“{quote.text}”</Text><Text style={styles.quoteAuthor}>— {quote.author}</Text></Card>)}</View>;
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.canvas },
	header: { minHeight: 74, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, gap: space.md },
	headerCopy: { flex: 1, alignItems: 'center' },
	eyebrow: { color: colors.gold, fontFamily: appFonts.semibold, fontSize: 9, letterSpacing: 1.7 },
	headerTitle: { color: colors.ink, fontFamily: appFonts.bold, fontSize: 16 },
	step: { width: 42, color: colors.muted, fontFamily: appFonts.mono, fontSize: 11, textAlign: 'right' },
	content: { flexGrow: 1, padding: space.xl, justifyContent: 'center' },
	question: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: space.lg },
	moodQuestion: { alignItems: 'center', gap: space.lg },
	centeredText: { textAlign: 'center' },
	questionTitle: { color: colors.ink, fontFamily: appFonts.black, fontSize: 30, letterSpacing: -0.8 },
	questionDescription: { color: colors.muted, fontFamily: appFonts.regular, fontSize: 14, lineHeight: 22 },
	moodGroup: { width: '100%', alignItems: 'center', gap: space.sm },
	moodGroupLabel: { color: colors.gold, fontFamily: appFonts.semibold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
	moods: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: space.sm },
	input: { minHeight: 52, borderRadius: radius.medium, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, color: colors.ink, fontFamily: appFonts.regular, paddingHorizontal: 15, paddingVertical: 12 },
	journal: { minHeight: 140, textAlignVertical: 'top' },
	goalButtons: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
	reviewList: { gap: space.sm },
	review: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.medium, padding: space.md },
	goalCopy: { flex: 1, gap: 3 },
	reviewTitle: { flex: 1, color: colors.ink, fontFamily: appFonts.medium, fontSize: 13 },
	harvestList: { gap: space.sm },
	harvestRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.canvas, borderColor: colors.line, borderWidth: 1, borderRadius: radius.medium, padding: space.md },
	results: { gap: space.lg },
	resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopColor: colors.line, borderTopWidth: 1, paddingVertical: space.sm },
	resultLabel: { color: colors.muted, fontFamily: appFonts.medium, fontSize: 13 },
	resultValue: { color: colors.gold, fontFamily: appFonts.bold, fontSize: 14 },
	footer: { minHeight: 78, borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, gap: space.md },
	blocked: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.lg, padding: 30 },
	title: { color: colors.ink, fontFamily: appFonts.black, fontSize: 28 },
	quoteList: { gap: space.sm },
	advice: { color: colors.ink, fontFamily: appFonts.medium, fontSize: 16, lineHeight: 24 },
	quote: { color: colors.ink, fontFamily: appFonts.medium, fontSize: 14, lineHeight: 21 },
	quoteAuthor: { color: colors.gold, fontFamily: appFonts.semibold, fontSize: 11 },
	rewardScrim: { flex: 1, backgroundColor: '#050308D9', justifyContent: 'center', padding: space.xl },
	rewardModal: { width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: colors.canvasRaised, borderColor: colors.gold, borderWidth: 1, borderRadius: radius.large, padding: space.lg, gap: space.sm },
	rewardModalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.md, paddingBottom: space.sm },
	rewardEyebrow: { color: colors.gold, fontFamily: appFonts.semibold, fontSize: 10, letterSpacing: 1.5 },
	rewardTitle: { color: colors.ink, fontFamily: appFonts.black, fontSize: 24, marginTop: 4 },
	rewardClose: { color: colors.muted, fontSize: 28, lineHeight: 28, paddingHorizontal: 4 },
	rewardNote: { color: colors.muted, fontFamily: appFonts.regular, fontSize: 11, lineHeight: 17, paddingVertical: space.sm },
});
