import { ActionButton, Card, Chip, ProgressBar, SectionTitle, uiStyles } from '@/components/ui/DragonUI';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { useGoalStore } from '@/store/store-productivity/createGoalSlice';
import { useSurveyStore, type SurveyKind } from '@/store/store-productivity/createSurveySlice';
import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

const { colors, radius, space } = dragonTheme;
const moods = ['great', 'good', 'calm', 'content', 'okay', 'uneasy', 'anxious', 'tired'] as const;

export default function SurveyScreen({ kind }: { kind: SurveyKind }) {
	const survey = useSurveyStore();
	const goals = useGoalStore();
	const [step, setStep] = useState(0);
	const [mood, setMood] = useState<string>('calm');
	const [goalTitle, setGoalTitle] = useState('');
	const [reflection, setReflection] = useState('');
	const isCheckIn = kind === 'check-in';
	const totalSteps = isCheckIn ? 3 : 3;
	const finish = () => {
		if (isCheckIn) survey.completeCheckIn({ mood, goalsAdded: goals.incompleteHabits.length + goals.incompleteTasks.length });
		else survey.completeCheckOut({ mood, goalsHarvested: goals.archived.length });
		router.back();
	};
	if (!isCheckIn && !survey.checkInCompleted)
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.blocked}>
					<Text style={styles.title}>Check-in comes first</Text>
					<Text style={uiStyles.muted}>Complete today’s check-in before closing the day.</Text>
					<ActionButton label="Go to check-in" onPress={() => router.replace('/check-in-survey')} />
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
				<Text style={styles.step}>
					{step + 1}/{totalSteps}
				</Text>
			</View>
			<ProgressBar value={step + 1} max={totalSteps} color={isCheckIn ? colors.gold : colors.crimsonBright} />
			<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
				<Animated.View key={step} entering={FadeInRight.duration(280)} style={styles.question}>
					{step === 0 ?
						<>
							<Text style={styles.questionTitle}>How are you arriving?</Text>
							<Text style={styles.questionDescription}>An honest reading changes Fury without judging the answer.</Text>
							<View style={styles.moods}>
								{moods.map(value => (
									<Chip key={value} label={value} selected={mood === value} onPress={() => setMood(value)} />
								))}
							</View>
						</>
					: step === 1 && isCheckIn ?
						<>
							<Text style={styles.questionTitle}>What matters today?</Text>
							<Text style={styles.questionDescription}>Add one clear next action. You can build a fuller plan afterward.</Text>
							<TextInput value={goalTitle} onChangeText={setGoalTitle} placeholder="A small, specific goal" placeholderTextColor={colors.muted} style={styles.input} />
							<View style={styles.goalButtons}>
								<ActionButton
									tone="quiet"
									label="Add as habit"
									disabled={!goalTitle.trim()}
									onPress={() => {
										if (goals.addGoal({ title: goalTitle, type: 'habit' })) setGoalTitle('');
									}}
								/>
								<ActionButton
									label="Add as to-do"
									disabled={!goalTitle.trim()}
									onPress={() => {
										if (goals.addGoal({ title: goalTitle, type: 'task' })) setGoalTitle('');
									}}
								/>
							</View>
						</>
					: step === 1 ?
						<>
							<Text style={styles.questionTitle}>What moved forward?</Text>
							<Text style={styles.questionDescription}>Review incomplete goals and mark the ones you actually finished.</Text>
							<View style={styles.reviewList}>
								{[...goals.incompleteHabits, ...goals.incompleteTasks].slice(0, 8).map(goal => (
									<View key={goal.id} style={styles.review}>
										<Text style={styles.reviewTitle}>{goal.title}</Text>
										<ActionButton compact label="Complete" onPress={() => goals.completeGoal(goal.id)} />
									</View>
								))}
							</View>
						</>
					:	<>
							<Text style={styles.questionTitle}>{isCheckIn ? 'Set your intention' : 'Leave a final note'}</Text>
							<Text style={styles.questionDescription}>{isCheckIn ? 'What would make today feel deliberately spent?' : 'What should tomorrow remember?'}</Text>
							<TextInput multiline value={reflection} onChangeText={setReflection} placeholder="Write a brief reflection…" placeholderTextColor={colors.muted} style={[styles.input, styles.journal]} />
							<Card accent={isCheckIn ? 'gold' : 'crimson'}>
								<SectionTitle title={isCheckIn ? 'The dragon is listening' : 'The archive is ready'} detail={isCheckIn ? `${goals.incompleteHabits.length + goals.incompleteTasks.length} active goals will enter the day.` : `${goals.pendingHarvestIds.length} rewards can be harvested from Finished Goals.`} />
							</Card>
						</>
					}
				</Animated.View>
			</ScrollView>
			<View style={styles.footer}>
				{step > 0 ?
					<ActionButton tone="quiet" label="Back" onPress={() => setStep(current => current - 1)} />
				:	<View />}
				{step < totalSteps - 1 ?
					<ActionButton label="Continue" onPress={() => setStep(current => current + 1)} />
				:	<ActionButton label={isCheckIn ? 'Complete check-in' : 'Complete check-out'} onPress={finish} />}
			</View>
		</SafeAreaView>
	);
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
	questionTitle: { color: colors.ink, fontFamily: appFonts.black, fontSize: 30, letterSpacing: -0.8 },
	questionDescription: { color: colors.muted, fontFamily: appFonts.regular, fontSize: 14, lineHeight: 22 },
	moods: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
	input: { minHeight: 52, borderRadius: radius.medium, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, color: colors.ink, fontFamily: appFonts.regular, paddingHorizontal: 15, paddingVertical: 12 },
	journal: { minHeight: 140, textAlignVertical: 'top' },
	goalButtons: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
	reviewList: { gap: space.sm },
	review: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.medium, padding: space.md },
	reviewTitle: { flex: 1, color: colors.ink, fontFamily: appFonts.medium, fontSize: 13 },
	footer: { minHeight: 78, borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, gap: space.md },
	blocked: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.lg, padding: 30 },
	title: { color: colors.ink, fontFamily: appFonts.black, fontSize: 28 },
});
