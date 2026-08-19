import { GoalEditorModal, type EditorTarget } from '@/components/pages/earth/GoalEditorModal';
import { ActionButton, Card, EmptyState, PageIntro, SectionTitle, TabStrip, uiStyles } from '@/components/ui/DragonUI';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { useProductivityStore } from '@/store/store-productivity/_useProductivityStore';
import { usePremiumStore } from '@/store/store-premium/_usePremiumStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import type { Goal } from '@/types/goals.types';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { colors, space } = dragonTheme;
type GoalFilter = 'habit' | 'task' | 'special-habit' | 'all';

const GOAL_FILTERS = [
	{ id: 'habit', label: 'Habits' },
	{ id: 'task', label: 'Tasks' },
	{ id: 'all', label: 'View all' },
	{ id: 'special-habit', label: 'Dragon Rituals' },
] as const;

export function GoalBoard({ completed }: { completed: boolean }) {
	const store = useProductivityStore(state => state.goals);
	const customCategories = useProductivityStore(state => state.surveyPreferences.customGoalCategories);
	const mode = useWorldStore(state => state.optionsStore.gameMode);
	const isPremium = usePremiumStore(state => state.isPremium);
	const [filter, setFilter] = useState<GoalFilter>('all');
	const [editorTarget, setEditorTarget] = useState<EditorTarget>();
	const active = [...store.incompleteHabits, ...store.incompleteTasks];
	const goals = completed ? store.completed : active;
	const shown =
		filter === 'special-habit' ? store.specialHabits.filter(goal => goal.status === (completed ? 'completed' : 'incomplete'))
		: filter === 'all' ? goals
		: goals.filter(goal => goal.type === filter);

	return (
		<>
			<PageIntro eyebrow={completed ? 'Ready for rewards' : 'Today'} title={completed ? 'Harvest Goals' : 'Active Goals'} description={completed ? 'Review, undo, or permanently harvest every completed goal.' : 'Habits first, then tasks, with permanent Dragon Rituals alongside them.'} />
			<TabStrip tabs={GOAL_FILTERS} value={filter} onChange={setFilter} />
			{!completed ?
				<Card>
					<SectionTitle title="Add a goal" detail="Configure its schedule, archetype, subgoals, and optional challenge." />
					<View style={styles.addRow}>
						<ActionButton label="New habit" onPress={() => setEditorTarget({ kind: 'create', type: 'habit' })} />
						<ActionButton tone="secondary" label="New task" onPress={() => setEditorTarget({ kind: 'create', type: 'task' })} />
					</View>
				</Card>
			: null}
			{store.lastWarning ? <Card accent="crimson"><Text style={styles.warning}>⚠️ {store.lastWarning}</Text></Card> : null}
			<View style={styles.goalList}>
				{shown.length ?
					shown.map(goal => (
						<GoalCard
							key={goal.id}
							goal={goal}
							completed={completed}
							onAction={() => (completed ? store.restoreGoal(goal.id) : store.completeGoal(goal.id))}
							onEdit={goal.type === 'special-habit' || completed ? undefined : () => setEditorTarget({ kind: 'edit', goal })}
							onRemove={goal.type === 'special-habit' || completed ? undefined : () => store.removeGoal(goal.id)}
						/>
					))
				: <EmptyState icon={completed ? '✦' : '✓'} title={completed ? 'Nothing waiting to harvest' : 'Clear skies'} description={completed ? 'Completed goals stay here until you undo or harvest them.' : 'Add a goal or enjoy the quiet.'} />}
			</View>
			{completed ?
				<Card accent={store.pendingHarvestIds.length ? 'crimson' : 'gold'}>
					<SectionTitle title="Harvest rewards" detail={`${store.pendingHarvestIds.length} reward bundles are ready. Normal shards: ${store.shardsHarvestedToday}/${isPremium ? 250 : 50} today. Harvest Challenge bonuses bypass the cap.`} action={<ActionButton compact tone="quiet" label={`Auto: ${store.autoHarvestEnabled ? 'On' : 'Off'}`} onPress={() => store.setAutoHarvest(!store.autoHarvestEnabled)} />} />
					<ActionButton label={`${store.pendingHarvestIds.length ? '⚠️ ' : ''}Harvest all (${store.pendingHarvestIds.length})`} disabled={!store.pendingHarvestIds.length || mode === 'lock-in'} onPress={() => store.harvestAllPending(mode)} />
				</Card>
			: <View style={styles.surveyRow}>
					<ActionButton tone="quiet" label="Check in" onPress={() => router.push('/check-in-survey')} />
					<ActionButton tone="quiet" label="Check out" onPress={() => router.push('/check-out-survey')} />
				</View>}
			{editorTarget ? <GoalEditorModal key={editorTarget.kind === 'edit' ? editorTarget.goal.id : `create-${editorTarget.type}`} target={editorTarget} customCategories={customCategories} onClose={() => setEditorTarget(undefined)} /> : null}
		</>
	);
}

function GoalCard({ goal, completed, onAction, onEdit, onRemove }: { goal: Goal; completed: boolean; onAction: () => void; onEdit?: () => void; onRemove?: () => void }) {
	return (
		<Animated.View entering={FadeInDown.duration(240)}>
			<Card>
				<View style={styles.goalRow}>
					<View style={styles.goalCopy}>
						<View style={uiStyles.wrap}>
							<Text style={styles.goalType}>{goal.type.replace('-', ' ')}</Text>
							<Text style={styles.goalMeta}>{goal.category}</Text>
							<Text style={styles.goalMeta}>{goal.archetype}</Text>
							<Text style={styles.goalMeta}>{goal.difficulty}</Text>
							{goal.challenge !== 'none' ? <Text style={styles.challenge}>{goal.challenge}</Text> : null}
						</View>
						<Text style={styles.goalTitle}>{goal.title}</Text>
						{goal.description ? <Text style={uiStyles.muted}>{goal.description}</Text> : null}
						<Text style={uiStyles.muted}>{goal.importance.replace('-', ' ')}{goal.type !== 'task' ? ` · ${goal.streak} streak · ${goal.streakState}` : ` · ${goal.estimatedMinutes} min`}{goal.dueAt ? ` · Due ${new Date(goal.dueAt).toLocaleString()}` : ''}</Text>
					</View>
					<View style={styles.goalActions}>
						<ActionButton compact tone={completed ? 'quiet' : 'primary'} label={completed ? 'Undo' : goal.type === 'special-habit' ? 'Automatic' : 'Done'} disabled={!completed && goal.type === 'special-habit'} onPress={onAction} />
						{onEdit ? <ActionButton compact tone="quiet" label="Edit" onPress={onEdit} /> : null}
						{onRemove ? <ActionButton compact tone="danger" label="Delete" onPress={onRemove} /> : null}
					</View>
				</View>
			</Card>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	addRow: { flexDirection: 'row', gap: space.sm },
	goalList: { gap: space.sm },
	goalRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
	goalCopy: { flex: 1, gap: 5 },
	goalActions: { gap: space.xs },
	goalTitle: { color: colors.ink, fontFamily: appFonts.semibold, fontSize: 15 },
	goalType: { color: colors.gold, fontFamily: appFonts.bold, fontSize: 10, textTransform: 'uppercase' },
	goalMeta: { color: colors.muted, fontFamily: appFonts.medium, fontSize: 10, textTransform: 'uppercase' },
	challenge: { color: colors.violet, fontFamily: appFonts.bold, fontSize: 10, textTransform: 'uppercase' },
	warning: { color: colors.danger, fontFamily: appFonts.semibold, fontSize: 12, lineHeight: 18 },
	surveyRow: { flexDirection: 'row', gap: space.sm },
});
