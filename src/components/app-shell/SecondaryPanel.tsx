import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { SPELL_SIZES } from '@/data/world-data/spells';
import { useProductivityStore } from '@/store/store-productivity/_useProductivityStore';
import { useProductionSpecialStore } from '@/store/store-production-special/_useProductionSpecialStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import { useProductionStore } from '@/store/store-production/_useProductionStore';
import { formatDecimal } from '@/utils/decimal';
import { milestoneForEnergy } from '@/data/world-data/milestones';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Stat } from '@/components/ui/DragonUI';
import { useShallow } from 'zustand/react/shallow';

export type PanelMode = 'dragon' | 'goals' | 'resources' | 'prestige' | 'spells' | 'population';

const { colors, space } = dragonTheme;

export function SecondaryPanel({ mode, onPress }: { mode: PanelMode; onPress?: () => void }) {
	const { resources, deaths, dragon, hostiles, getFuryBand } = useWorldStore(
		useShallow(state => ({ resources: state.resourceStore.resources, deaths: state.resourceStore.populationDead, dragon: state.resourceStore.dragon, hostiles: state.populationStore, getFuryBand: state.dragonStore.getFuryBand })),
	);
	const goals = useProductivityStore(state => state.goals);
	const surveys = useProductivityStore(state => state.surveys);
	const spells = useProductionSpecialStore(state => state.spells.spellInventory);
	const furyBand = getFuryBand();
	const milestone = milestoneForEnergy(useWorldStore.getState().resourceStore.totalAllTime.energy);
	const productionLevels = useProductionStore(state => state.levels);

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
					['Owned', `${Object.values(productionLevels).reduce((sum, level) => sum + level, 0)}`],
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
