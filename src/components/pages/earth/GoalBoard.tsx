import { ActionButton, Card, Chip, EmptyState, PageIntro, SectionTitle, TabStrip, uiStyles } from '@/components/ui/DragonUI';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { useProductivityStore } from '@/store/store-productivity/_useProductivityStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import type { Goal, GoalType } from '@/types/goals.types';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { colors, radius, space } = dragonTheme;
type GoalFilter = 'habit' | 'task' | 'special-habit' | 'all';

const GOAL_FILTERS = [
	{ id: 'habit', label: 'Habits' },
	{ id: 'task', label: 'Tasks' },
	{ id: 'special-habit', label: 'Special' },
	{ id: 'all', label: 'View all' },
] as const;

export function GoalBoard({ completed }: { completed: boolean }) {
	const store = useProductivityStore(state => state.goals);
	const mode = useWorldStore(state => state.optionsStore.gameMode);
	const [filter, setFilter] = useState<GoalFilter>('all');
	const [newGoal, setNewGoal] = useState('');
	const [newType, setNewType] = useState<Extract<GoalType, 'habit' | 'task'>>('task');
	const [openedAt] = useState(() => Date.now());
	const active = [...store.incompleteHabits, ...store.incompleteTasks, ...store.specialHabits.filter(goal => goal.status === 'incomplete')];
	const goals = completed ? store.completed.filter(goal => !goal.completedAt || openedAt - Date.parse(goal.completedAt) <= 86_400_000) : active;
	const shown = filter === 'all' ? goals : goals.filter(goal => goal.type === filter);

	return (
		<>
			<PageIntro eyebrow={completed ? 'Last 24 hours' : 'Today'} title={completed ? 'Finished Goals' : 'Active Goals'} description={completed ? 'Everything ready to turn into rewards.' : 'Habits first, then tasks, with permanent special goals alongside them.'} />
			<TabStrip tabs={GOAL_FILTERS} value={filter} onChange={setFilter} />
			{!completed ?
				<Card>
					<SectionTitle title="Add a goal" detail="A compact creator for the everyday case. Full editing lives in check-in." />
					<View style={styles.goalInputRow}>
						<TextInput value={newGoal} onChangeText={setNewGoal} placeholder="What will you finish?" placeholderTextColor={colors.muted} style={styles.input} />
						<ActionButton compact label="Add" disabled={!newGoal.trim()} onPress={() => store.addGoal({ title: newGoal, type: newType }) && setNewGoal('')} />
					</View>
					<View style={uiStyles.wrap}>
						{(['habit', 'task'] as const).map(type => <Chip key={type} label={type === 'habit' ? 'Habit' : 'To-do'} selected={newType === type} onPress={() => setNewType(type)} />)}
					</View>
				</Card>
			: null}
			<View style={styles.goalList}>
				{shown.length ? shown.map(goal => <GoalCard key={goal.id} goal={goal} completed={completed} onAction={() => (completed ? store.restoreGoal(goal.id) : store.completeGoal(goal.id))} />) : <EmptyState icon={completed ? '✦' : '✓'} title={completed ? 'Nothing waiting to harvest' : 'Clear skies'} description={completed ? 'Completed goals will appear here for 24 hours.' : 'Add a goal or enjoy the quiet.'} />}
			</View>
			{completed ?
				<Card accent="gold">
					<SectionTitle title="Harvest rewards" detail={`${store.pendingHarvestIds.length} reward bundles are ready. Harvesting always includes every goal.`} />
					<ActionButton label={`Harvest all (${store.pendingHarvestIds.length})`} disabled={!store.pendingHarvestIds.length || mode === 'lock-in'} onPress={() => store.harvestAllPending(mode)} />
				</Card>
			: <View style={styles.surveyRow}>
					<ActionButton tone="quiet" label="Check in" onPress={() => router.push('/check-in-survey')} />
					<ActionButton tone="quiet" label="Check out" onPress={() => router.push('/check-out-survey')} />
				</View>}
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
							{goal.challenge !== 'none' ? <Text style={styles.challenge}>{goal.challenge}</Text> : null}
						</View>
						<Text style={styles.goalTitle}>{goal.title}</Text>
						{goal.description ? <Text style={uiStyles.muted}>{goal.description}</Text> : null}
					</View>
					<ActionButton compact tone={completed ? 'quiet' : 'primary'} label={completed ? 'Undo' : 'Done'} onPress={onAction} />
				</View>
			</Card>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	goalInputRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
	input: { flex: 1, minHeight: 46, backgroundColor: colors.canvas, borderColor: colors.line, borderWidth: 1, borderRadius: radius.medium, color: colors.ink, fontFamily: appFonts.regular, paddingHorizontal: 14 },
	goalList: { gap: space.sm },
	goalRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
	goalCopy: { flex: 1, gap: 5 },
	goalTitle: { color: colors.ink, fontFamily: appFonts.semibold, fontSize: 15 },
	goalType: { color: colors.gold, fontFamily: appFonts.bold, fontSize: 10, textTransform: 'uppercase' },
	goalDifficulty: { color: colors.muted, fontFamily: appFonts.medium, fontSize: 10, textTransform: 'uppercase' },
	challenge: { color: colors.violet, fontFamily: appFonts.bold, fontSize: 10, textTransform: 'uppercase' },
	surveyRow: { flexDirection: 'row', gap: space.sm },
});

