import { ToggleRow } from '@/components/pages/options/SettingsControls';
import { ActionButton, Card, Chip, PageIntro, SectionTitle, uiStyles } from '@/components/ui/DragonUI';
import { DEFAULT_GOAL_CATEGORIES, type SurveyQuestionId } from '@/store/store-productivity/createSurveyPreferencesSlice';
import { useProductivityStore } from '@/store/store-productivity/_useProductivityStore';
import { useAppStore } from '@/store/useAppStore';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { styles } from './options.styles';

const QUESTION_LABELS: Record<SurveyQuestionId, string> = { mood: 'Mood', goals: 'Goals', advice: 'Advice', journal: 'Journal' };

export function SurveySettings() {
	const requireCheckIn = useAppStore(state => state.requireDailyCheckIn);
	const setRequireCheckIn = useAppStore(state => state.setRequireDailyCheckIn);
	const preferences = useProductivityStore(state => state.surveyPreferences);
	return (
		<>
			<PageIntro eyebrow="☀ Daily ritual" title="Check-In & Out Options" description="Choose what each survey asks, its order, and the vocabulary used for goals, emotions, advice, and quotes." />
			<Card accent="gold">
				<SectionTitle title="Check-in requirements" />
				<ToggleRow label="Require daily check-in" detail="Locks check-in-dependent Lair systems until today’s check-in is complete." value={requireCheckIn} onChange={setRequireCheckIn} />
			</Card>
			<Card>
				<SectionTitle title="Questions" detail="Disable optional questions or move them into the order you prefer." />
				{preferences.questionOrder.map((question, index) => (
					<View key={question} style={styles.orderRow}>
						<Text style={styles.orderIndex}>{index + 1}</Text>
						<View style={styles.orderCopy}>
							<Text style={styles.orderLabel}>{QUESTION_LABELS[question]}</Text>
							<Chip label={preferences.enabledQuestions[question] ? 'Enabled' : 'Disabled'} selected={preferences.enabledQuestions[question]} onPress={() => preferences.setQuestionEnabled(question, !preferences.enabledQuestions[question])} />
						</View>
						<ActionButton compact tone="quiet" label="↑" disabled={index === 0} onPress={() => preferences.moveQuestion(question, -1)} />
						<ActionButton compact tone="quiet" label="↓" disabled={index === preferences.questionOrder.length - 1} onPress={() => preferences.moveQuestion(question, 1)} />
					</View>
				))}
			</Card>
			<EditableOptions
				title="Goal categories"
				detail="Pillars of Archetypes remain fixed; custom categories can be added or removed."
				fixed={[...DEFAULT_GOAL_CATEGORIES]}
				items={preferences.customGoalCategories}
				placeholder="New category"
				onAdd={preferences.addGoalCategory}
				onRemove={preferences.removeGoalCategory}
			/>
			<EditableOptions title="Survey emotions" detail="These choices appear in mood questions." items={preferences.emotions} placeholder="New emotion" onAdd={preferences.addEmotion} onRemove={preferences.removeEmotion} />
			<EditableOptions title="Advice & quote categories" detail="Choose the themes available to check-in and check-out advice." items={preferences.adviceCategories} placeholder="New advice category" onAdd={preferences.addAdviceCategory} onRemove={preferences.removeAdviceCategory} />
			<Card>
				<SectionTitle title="Quotes" detail="Choose one to three quotes and whether they appear at the start or end of a survey." />
				<View style={uiStyles.wrap}>{([1, 2, 3] as const).map(count => <Chip key={count} label={`${count} quote${count === 1 ? '' : 's'}`} selected={preferences.quoteCount === count} onPress={() => preferences.setQuoteCount(count)} />)}</View>
				<View style={uiStyles.wrap}>{(['start', 'end'] as const).map(position => <Chip key={position} label={`At ${position}`} selected={preferences.quotePosition === position} onPress={() => preferences.setQuotePosition(position)} />)}</View>
			</Card>
		</>
	);
}

function EditableOptions({ title, detail, fixed = [], items, placeholder, onAdd, onRemove }: { title: string; detail: string; fixed?: string[]; items: string[]; placeholder: string; onAdd: (value: string) => boolean; onRemove: (value: string) => void }) {
	const [draft, setDraft] = useState('');
	const add = () => {
		if (onAdd(draft)) setDraft('');
	};
	return (
		<Card>
			<SectionTitle title={title} detail={detail} />
			<View style={uiStyles.wrap}>
				{fixed.map(item => <Chip key={item} label={`🔒 ${item}`} disabled />)}
				{items.map(item => <Chip key={item} label={`${item} ×`} onPress={() => onRemove(item)} />)}
			</View>
			<View style={styles.inputRow}>
				<TextInput value={draft} onChangeText={setDraft} onSubmitEditing={add} returnKeyType="done" placeholder={placeholder} style={styles.input} />
				<ActionButton compact label="Add" disabled={!draft.trim()} onPress={add} />
			</View>
		</Card>
	);
}
