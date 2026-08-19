import { ActionButton, Card, Chip, EmptyState, SectionTitle, TabStrip, uiStyles } from '@/components/ui/DragonUI';
import { GoalEditorModal, type EditorTarget } from '@/components/pages/earth/GoalEditorModal';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { DEFAULT_GOAL_CATEGORIES } from '@/store/store-productivity/createSurveyPreferencesSlice';
import { useProductivityStore } from '@/store/store-productivity/_useProductivityStore';
import type { Goal, GoalCategory, GoalType } from '@/types/goals.types';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

const { colors, radius, space } = dragonTheme;
type GoalFilter = 'habit' | 'task' | 'all';

const GOAL_FILTERS = [
	{ id: 'habit', label: 'Habits' },
	{ id: 'task', label: 'Tasks' },
	{ id: 'all', label: 'Show all' },
] as const;

export function SurveyGoalEditor({ kind, onGoalAdded }: { kind: 'check-in' | 'check-out'; onGoalAdded?: () => void }) {
	const store = useProductivityStore(useShallow(state => ({
		addGoal: state.goals.addGoal,
		completeGoal: state.goals.completeGoal,
		incompleteHabits: state.goals.incompleteHabits,
		incompleteTasks: state.goals.incompleteTasks,
		removeGoal: state.goals.removeGoal,
	})));
	const customCategories = useProductivityStore(state => state.surveyPreferences.customGoalCategories);
	const [filter, setFilter] = useState<GoalFilter>('all');
	const [title, setTitle] = useState('');
	const [type, setType] = useState<Extract<GoalType, 'habit' | 'task'>>('task');
	const [category, setCategory] = useState<GoalCategory>('personal');
	const [editorTarget, setEditorTarget] = useState<EditorTarget>();
	const activeGoals = useMemo(() => [...store.incompleteHabits, ...store.incompleteTasks], [store.incompleteHabits, store.incompleteTasks]);
	const visibleGoals = filter === 'all' ? activeGoals : activeGoals.filter(goal => goal.type === filter);
	const categories = useMemo(() => [...DEFAULT_GOAL_CATEGORIES, ...customCategories], [customCategories]);
	const add = () => {
		if (store.addGoal({ title, type, category })) {
			setTitle('');
			onGoalAdded?.();
		}
	};

	return (
		<Card accent={kind === 'check-in' ? 'gold' : 'blue'}>
			<SectionTitle title={kind === 'check-in' ? 'Edit today’s goals' : 'Check off today’s goals'} detail="View every active habit and task, add a goal, mark work complete, or remove a goal." />
			<Card style={styles.addCard}>
				<SectionTitle title="Add a goal" detail="Choose Habit or Task before saving." />
				<View style={styles.inputRow}>
					<TextInput value={title} onChangeText={setTitle} onSubmitEditing={add} returnKeyType="done" placeholder={type === 'habit' ? 'A repeatable habit' : 'A specific task'} placeholderTextColor={colors.muted} style={styles.input} />
					<ActionButton compact label="Add" disabled={!title.trim()} onPress={add} />
				</View>
				<View style={uiStyles.wrap}>
					{(['habit', 'task'] as const).map(goalType => <Chip key={goalType} label={goalType === 'habit' ? 'Habit' : 'Task'} selected={type === goalType} onPress={() => setType(goalType)} />)}
				</View>
				<View style={uiStyles.wrap}>
					{categories.map(goalCategory => <Chip key={goalCategory} label={goalCategory} selected={category === goalCategory} onPress={() => setCategory(goalCategory)} />)}
				</View>
			</Card>
			<TabStrip tabs={GOAL_FILTERS} value={filter} onChange={setFilter} />
			{visibleGoals.length ?
				<View style={styles.goalList}>
					{visibleGoals.map(goal => <SurveyGoalCard key={goal.id} goal={goal} onComplete={() => store.completeGoal(goal.id)} onEdit={() => setEditorTarget({ kind: 'edit', goal })} onRemove={() => store.removeGoal(goal.id)} />)}
				</View>
			:	<EmptyState icon="✓" title="No active goals in this view" description="Add a habit or task above, or switch to Show all." />}
			{editorTarget ? <GoalEditorModal key={editorTarget.kind === 'edit' ? editorTarget.goal.id : `create-${editorTarget.type}`} target={editorTarget} customCategories={customCategories} onClose={() => setEditorTarget(undefined)} /> : null}
		</Card>
	);
}

function SurveyGoalCard({ goal, onComplete, onEdit, onRemove }: { goal: Goal; onComplete: () => void; onEdit: () => void; onRemove: () => void }) {
	return (
		<Animated.View entering={FadeInDown.duration(220)}>
			<Card>
				<View style={styles.goalRow}>
					<View style={styles.goalCopy}>
						<View style={uiStyles.wrap}>
							<Text style={styles.goalType}>{goal.type.replace('-', ' ')}</Text>
							<Text style={styles.goalMeta}>{goal.category}</Text>
							<Text style={styles.goalMeta}>{goal.difficulty}</Text>
							{goal.challenge !== 'none' ? <Text style={styles.challenge}>{goal.challenge}</Text> : null}
						</View>
						<Text style={styles.goalTitle}>{goal.title}</Text>
						{goal.description ? <Text style={uiStyles.muted}>{goal.description}</Text> : null}
					</View>
					<View style={styles.goalActions}>
						<ActionButton compact label="Done" onPress={onComplete} />
						<ActionButton compact tone="quiet" label="Edit" onPress={onEdit} />
						<ActionButton compact tone="quiet" label="Remove" onPress={onRemove} />
					</View>
				</View>
			</Card>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	addCard: { backgroundColor: colors.canvas, borderColor: colors.line, padding: space.md },
	inputRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
	input: { flex: 1, minHeight: 46, borderRadius: radius.medium, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, color: colors.ink, fontFamily: appFonts.regular, paddingHorizontal: 14 },
	goalList: { gap: space.sm },
	goalRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
	goalCopy: { flex: 1, gap: 5 },
	goalActions: { gap: space.xs, alignItems: 'stretch' },
	goalType: { color: colors.gold, fontFamily: appFonts.bold, fontSize: 10, textTransform: 'uppercase' },
	goalMeta: { color: colors.muted, fontFamily: appFonts.medium, fontSize: 10, textTransform: 'uppercase' },
	challenge: { color: colors.violet, fontFamily: appFonts.bold, fontSize: 10, textTransform: 'uppercase' },
	goalTitle: { color: colors.ink, fontFamily: appFonts.semibold, fontSize: 14 },
});
