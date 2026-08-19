import { ActionButton, Card, Chip, SectionTitle, uiStyles } from '@/components/ui/DragonUI';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { DEFAULT_GOAL_CATEGORIES } from '@/store/store-productivity/createSurveyPreferencesSlice';
import { useProductivityStore } from '@/store/store-productivity/_useProductivityStore';
import { useProductionStore } from '@/store/store-production/_useProductionStore';
import type { Goal, GoalArchetype, GoalCategory, GoalDifficulty, GoalImportance, SubGoal, Weekday } from '@/types/goals.types';
import { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

const { colors, radius, space } = dragonTheme;
type EditableGoalType = 'habit' | 'task';
export type EditorTarget = { kind: 'create'; type: EditableGoalType } | { kind: 'edit'; goal: Goal };

const ARCHETYPES: readonly GoalArchetype[] = ['personal', 'scholar', 'athlete', 'entrepreneur', 'fellowship', 'balanced'];
const DIFFICULTIES: readonly GoalDifficulty[] = ['trivial', 'easy', 'medium', 'hard', 'hard-plus'];
const IMPORTANCE: readonly GoalImportance[] = ['important-plus', 'important', 'not-important'];
const REPEATS = ['daily', 'weekdays', 'weekly', 'biweekly', 'custom'] as const;
const WEEKDAYS: readonly Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const CHALLENGES: readonly Goal['challenge'][] = ['none', 'harvest', 'quantum', 'both'];
const challengeLabel = (challenge: Goal['challenge']) =>
	challenge === 'none' ? 'No challenge'
	: challenge === 'harvest' ? 'Harvest · 3 shards'
	: challenge === 'quantum' ? 'Quantum · 6 shards'
	: 'Both · 9 shards';

export function GoalEditorModal({ target, customCategories, onClose, onSaved }: { target: EditorTarget; customCategories: GoalCategory[]; onClose: () => void; onSaved?: () => void }) {
	const existing = target.kind === 'edit' ? target.goal : undefined;
	const type: EditableGoalType = target.kind === 'create' ? target.type : target.goal.type === 'task' ? 'task' : 'habit';
	const actions = useProductivityStore(useShallow(state => ({ addGoal: state.goals.addGoal, updateGoal: state.goals.updateGoal, setGoalChallenge: state.goals.setGoalChallenge })));
	const milestone = useProductionStore(state => state.unlockState.milestone);
	const [title, setTitle] = useState(existing?.title ?? '');
	const [description, setDescription] = useState(existing?.description ?? '');
	const [category, setCategory] = useState<GoalCategory>(existing?.category ?? 'custom');
	const [archetype, setArchetype] = useState<GoalArchetype>(existing?.archetype ?? 'personal');
	const [difficulty, setDifficulty] = useState<GoalDifficulty>(existing?.difficulty ?? 'easy');
	const [importance, setImportance] = useState<GoalImportance>(existing?.importance ?? 'not-important');
	const [dueAt, setDueAt] = useState(existing?.dueAt ?? '');
	const [estimatedMinutes, setEstimatedMinutes] = useState(existing?.type === 'task' ? String(existing.estimatedMinutes) : '15');
	const [estimatedPomodoros, setEstimatedPomodoros] = useState(String(existing?.estimatedPomodoros ?? 1));
	const [repeat, setRepeat] = useState(existing && existing.type !== 'task' ? existing.repeat : 'daily');
	const [daysOfWeek, setDaysOfWeek] = useState<Weekday[]>(existing && existing.type !== 'task' ? existing.daysOfWeek : [...WEEKDAYS]);
	const [challenge, setChallenge] = useState<Goal['challenge']>(existing?.challenge ?? 'none');
	const [subgoals, setSubgoals] = useState<SubGoal[]>(existing?.subgoals ?? []);
	const [subgoalTitle, setSubgoalTitle] = useState('');
	const [error, setError] = useState('');
	const [openedAt] = useState(Date.now);
	const categories = useMemo(() => [...new Set([...DEFAULT_GOAL_CATEGORIES, ...customCategories, ...(existing?.category ? [existing.category] : [])])], [customCategories, existing]);
	const dueLocked = Boolean(existing?.dueAt && Date.parse(existing.dueAt) <= openedAt);
	const quantumLocked = milestone < 6;

	const toggleDay = (day: Weekday) => setDaysOfWeek(current => current.includes(day) ? current.filter(item => item !== day) : [...current, day]);
	const addSubgoal = () => {
		const clean = subgoalTitle.trim();
		if (!clean) return;
		setSubgoals(current => [...current, { id: `subgoal-${Date.now()}-${current.length}`, title: clean }]);
		setSubgoalTitle('');
	};
	const save = () => {
		if (!title.trim()) {
			setError('Give this goal a title before saving.');
			return;
		}
		if (dueAt.trim() && Number.isNaN(Date.parse(dueAt.trim()))) {
			setError('Use a valid due date, such as 2026-08-20 18:00.');
			return;
		}
		const parsedDueAt = dueAt.trim() ? new Date(dueAt.trim()).toISOString() : undefined;
		const common = {
			title: title.trim(), description: description.trim() || undefined, category, archetype, difficulty, importance,
			dueAt: dueLocked ? existing?.dueAt : parsedDueAt,
			estimatedPomodoros: Math.max(1, Number(estimatedPomodoros) || 1),
		};
		let goalId: string | undefined;
		if (existing) {
			goalId = existing.id;
			actions.updateGoal(existing.id, {
				...common,
				subgoals,
				...(type === 'task' ? { estimatedMinutes: Math.max(1, Number(estimatedMinutes) || 15) } : { repeat, daysOfWeek }),
			} as Partial<Goal>);
		} else {
			const created = actions.addGoal({
				...common, type,
				...(type === 'task' ? { estimatedMinutes: Math.max(1, Number(estimatedMinutes) || 15) } : { repeat, daysOfWeek }),
			});
			if (!created) {
				setError('This goal could not be added. Check your active-goal limit.');
				return;
			}
			goalId = created.id;
			actions.updateGoal(created.id, { subgoals } as Partial<Goal>);
		}
		if (goalId && challenge !== (existing?.challenge ?? 'none') && !actions.setGoalChallenge(goalId, challenge)) {
			setError('The goal was saved, but the challenge could not be applied. Check its difficulty, milestone, challenge limit, and shard cost.');
			return;
		}
		onSaved?.();
		onClose();
	};

	return (
		<Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
			<SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
				<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
					<SectionTitle title={existing ? 'Edit goal' : `Create ${type}`} detail="Tune the goal, its rewards, schedule, and optional challenge." action={<ActionButton compact tone="quiet" label="Close" onPress={onClose} />} />
					<Card>
						<Field label="Title" value={title} onChangeText={setTitle} placeholder="What will you accomplish?" />
						<Field label="Description" value={description} onChangeText={setDescription} placeholder="Add helpful details" multiline />
					</Card>
					<ChoiceSection title="Category" options={categories} value={category} onChange={setCategory} />
					<ChoiceSection title="Archetype" options={ARCHETYPES} value={archetype} onChange={setArchetype} />
					<ChoiceSection title="Difficulty" options={DIFFICULTIES} value={difficulty} onChange={setDifficulty} />
					<ChoiceSection title="Importance" options={IMPORTANCE} value={importance} onChange={setImportance} />
					<Card>
						<SectionTitle title="Timing and effort" detail={dueLocked ? 'This due date has passed, so it stays fixed until the goal is restored.' : 'Dates accept formats such as 2026-08-20 18:00.'} />
						<Field label="Due date (optional)" value={dueAt} onChangeText={setDueAt} editable={!dueLocked} placeholder="YYYY-MM-DD HH:MM" />
						<Field label="Estimated Pomodoros" value={estimatedPomodoros} onChangeText={setEstimatedPomodoros} keyboardType="number-pad" />
						{type === 'task' ? <Field label="Estimated minutes" value={estimatedMinutes} onChangeText={setEstimatedMinutes} keyboardType="number-pad" /> : null}
					</Card>
					{type === 'habit' ?
						<Card>
							<SectionTitle title="Habit schedule" />
							<View style={uiStyles.wrap}>{REPEATS.map(item => <Chip key={item} label={item} selected={repeat === item} onPress={() => setRepeat(item)} />)}</View>
							{repeat === 'weekdays' || repeat === 'custom' ? <View style={uiStyles.wrap}>{WEEKDAYS.map(day => <Chip key={day} label={day.slice(0, 3)} selected={daysOfWeek.includes(day)} onPress={() => toggleDay(day)} />)}</View> : null}
						</Card>
					: null}
					<Card>
						<SectionTitle title="Subgoals" detail="Break the work into smaller, editable checkpoints." />
						{subgoals.map(subgoal => <View key={subgoal.id} style={styles.subgoalRow}><Text style={styles.subgoalText}>• {subgoal.title}</Text><ActionButton compact tone="quiet" label="Remove" onPress={() => setSubgoals(current => current.filter(item => item.id !== subgoal.id))} /></View>)}
						<View style={styles.inputRow}><TextInput value={subgoalTitle} onChangeText={setSubgoalTitle} onSubmitEditing={addSubgoal} placeholder="Add a subgoal" placeholderTextColor={colors.muted} style={styles.input} /><ActionButton compact tone="quiet" label="Add" onPress={addSubgoal} /></View>
					</Card>
					<Card accent="violet">
						<SectionTitle title="Challenge" detail="Harvest doubles XP and grants 6 cap-free shards. Quantum grants 12 Quarks. Missing the goal adds Fury." />
						<View style={uiStyles.wrap}>{CHALLENGES.map(item => {
							const harvestUnavailable = (item === 'harvest' || item === 'both') && difficulty === 'trivial';
							const quantumUnavailable = (item === 'quantum' || item === 'both') && (quantumLocked || ['trivial', 'easy'].includes(difficulty));
							return <Chip key={item} label={challengeLabel(item)} selected={challenge === item} disabled={harvestUnavailable || quantumUnavailable} onPress={() => setChallenge(item)} />;
						})}</View>
						{quantumLocked ? <Text style={uiStyles.muted}>Quantum Challenge unlocks at Milestone 6.</Text> : null}
					</Card>
					{error ? <Text style={styles.error}>{error}</Text> : null}
					<ActionButton label={existing ? 'Save changes' : 'Create goal'} onPress={save} />
				</ScrollView>
			</SafeAreaView>
		</Modal>
	);
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
	const { label, multiline, style, ...inputProps } = props;
	return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...inputProps} multiline={multiline} placeholderTextColor={colors.muted} style={[styles.input, multiline && styles.multiline, style]} /></View>;
}

function ChoiceSection<T extends string>({ title, options, value, onChange }: { title: string; options: readonly T[]; value: T; onChange: (value: T) => void }) {
	return <Card><SectionTitle title={title} /><View style={uiStyles.wrap}>{options.map(option => <Chip key={option} label={option.replace('-', ' ')} selected={value === option} onPress={() => onChange(option)} />)}</View></Card>;
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: colors.canvas },
	content: { padding: space.lg, gap: space.md, paddingBottom: 48 },
	field: { gap: space.xs },
	label: { color: colors.muted, fontFamily: appFonts.medium, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
	input: { flex: 1, minHeight: 46, borderRadius: radius.medium, backgroundColor: colors.surfaceRaised, borderColor: colors.line, borderWidth: 1, color: colors.ink, fontFamily: appFonts.regular, paddingHorizontal: 14, paddingVertical: 10 },
	multiline: { minHeight: 92, textAlignVertical: 'top' },
	inputRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
	subgoalRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
	subgoalText: { flex: 1, color: colors.ink, fontFamily: appFonts.regular, fontSize: 13 },
	error: { color: colors.danger, fontFamily: appFonts.semibold, fontSize: 12, lineHeight: 18 },
});
