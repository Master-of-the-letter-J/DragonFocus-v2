import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { SPELL_SIZES } from '@/data/world-data/spells';
import { useGoalStore } from '@/store/store-productivity/createGoalSlice';
import { useSurveyStore } from '@/store/store-productivity/createSurveySlice';
import { useSpellsStore } from '@/store/store-production-special/createSpellsSlice';
import { usePopulationStore } from '@/store/store-world/createPopulationSlice';
import { useResourceStore } from '@/store/store-world/createResourceSlice';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import { useProductionStore } from '@/store/store-production/_useProductionStore';
import { formatDecimal } from '@/utils/decimal';
import { milestoneForEnergy } from '@/data/world-data/milestones';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Stat } from '@/components/ui/DragonUI';

export type PanelMode = 'dragon' | 'goals' | 'resources' | 'prestige' | 'spells' | 'population';

const { colors, space } = dragonTheme;

export function SecondaryPanel({ mode, onPress }: { mode: PanelMode; onPress?: () => void }) {
	const resources = useResourceStore(state => state.resources);
	const deaths = useResourceStore(state => state.populationDead);
	const dragon = useResourceStore(state => state.dragon);
	const hostiles = usePopulationStore();
	const goals = useGoalStore();
	const surveys = useSurveyStore();
	const spells = useSpellsStore(state => state.spellInventory);
	const furyBand = useWorldStore(state => state.dragonStore.getState().getFuryBand());
	const milestone = milestoneForEnergy(useResourceStore.getState().totalAllTime.energy);
	const production = useProductionStore();

	const content = (() => {
		switch (mode) {
			case 'goals':
				return [
					['Habits', `${goals.incompleteHabits.length}`],
					['Tasks', `${goals.incompleteTasks.length}`],
					['Special', `${goals.specialHabits.filter(goal => goal.status === 'incomplete').length}`],
					['Fury', `${furyBand} · ${formatDecimal(resources.fury)}`],
					['Streak', `${Math.max(surveys.checkInStreak, surveys.checkOutStreak)}`],
				];
			case 'prestige':
				return [
					['Plasma', formatDecimal(resources.plasma)],
					['Dark plasma', formatDecimal(resources.darkPlasma)],
					['Anomalies', formatDecimal(resources.anomaly)],
					['Quarks', formatDecimal(resources.quarks)],
					['Shards', formatDecimal(resources.shards)],
				];
			case 'spells':
				return [['Shards', formatDecimal(resources.shards)], ...SPELL_SIZES.map(size => [size.name, `${spells.filter(spell => spell.size === size.size).length}`])];
			case 'population':
				return [
					['Population', formatDecimal(resources.population)],
					['Zombies', formatDecimal(hostiles.zombies)],
					['Cyborgs', formatDecimal(hostiles.cyborgs)],
					['Deaths', formatDecimal(deaths)],
					['Plasma', formatDecimal(resources.plasma)],
				];
			case 'dragon':
				return [
					['Milestone', `${milestone}`],
					['Fury', `${furyBand} · ${formatDecimal(resources.fury)}`],
					['Age', `${dragon.ageDays.toFixed(1)}d`],
					['Streak', `${Math.max(surveys.checkInStreak, surveys.checkOutStreak)}`],
				];
			default:
				return [
					['Energy', formatDecimal(resources.energy)],
					['Dark energy', formatDecimal(resources.darkEnergy)],
					['Plasma', formatDecimal(resources.plasma)],
					['Anomalies', formatDecimal(resources.anomaly)],
					['Shards', formatDecimal(resources.shards)],
					['Owned', `${Object.values(production.levels).reduce((sum, level) => sum + level, 0)}`],
				];
		}
	})();

	return (
		<Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={styles.panel}>
			<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
				{content.map(([label, value]) => (
					<Stat
						key={label}
						label={label}
						value={value}
						tone={
							label === 'Shards' ? 'gold'
							: label === 'Fury' ?
								'crimson'
							:	'default'
						}
					/>
				))}
			</ScrollView>
			{onPress ?
				<Text style={styles.more}>•••</Text>
			:	null}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	panel: { minHeight: 68, backgroundColor: colors.surfaceRaised, borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
	content: { paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.lg, alignItems: 'center' },
	more: { color: colors.muted, fontFamily: appFonts.bold, fontSize: 16, paddingRight: 14 },
});
