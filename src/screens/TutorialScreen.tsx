import { ActionButton, Card, PageIntro, SectionTitle, TabStrip, uiStyles } from '@/components/ui/DragonUI';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { SPELL_LOOTBOXES } from '@/data/world-data/spell-lootboxes';
import { SPELL_SIZES } from '@/data/world-data/spells';
import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const { colors, space } = dragonTheme;
const chapters = [
	{ id: 'goals', label: 'Goals & Harvesting', title: 'Turn intention into resources', body: ['Check in to choose goals.', 'Complete goals honestly; rapid emergency completions can lose rewards.', 'Harvest every finished goal together for XP, Dark Energy, Shards, calm, and challenge rewards.'] },
	{ id: 'focus', label: 'Pomodoro & Offline', title: 'Focus charges the Heart', body: ['Pomodoro, stopwatch, and quiet sessions place the Heart in its active state.', 'Allowed-app and off-phone time can be summarized as offline progression.', 'Blocked time earns nothing when the blocking mode applies.'] },
	{
		id: 'production',
		label: 'Production & Heart',
		title: 'Read the energy equation',
		body: ['Energy = producer output × amplification × goal multiplier × other multipliers.', 'Amplification begins at ×1, so producers always retain base output.', 'Difficulty acts through Crimson Heart behavior rather than duplicated production and population multipliers.'],
	},
	{ id: 'prestige', label: 'Prestige', title: 'Destroy a run to deepen it', body: ['Armageddon turns accumulated Energy into Plasma.', 'Transcension trades deeper progress for Dark Plasma and Anomalies.', 'Apocalypse effects upgrade independently and combine in their reward calculation.'] },
	{ id: 'special', label: 'Special Features', title: 'Pantheons, spells, and Titanomachy', body: ['Hectate improves spell luck and unlocks Divine lootbox rarities.', 'Fuelable shrines are independent of Crimson Heart and spells.', 'Titanomachy is a high-risk accord that ends when its prerequisites fail.'] },
	{
		id: 'lootboxes',
		label: 'Lootbox Chances',
		title: 'Know every spell chance',
		body: [
			'Each listed percentage is the chance for one roll before Hectate luck is applied.',
			'Hectate uses the disclosed Hectate table and biases rolls toward higher rarities through ×2 Spell Luck per level.',
			'Divine I and Divine II are exclusive to Hectate-enabled lootboxes. Impossible and Infinity appear without Hectate only where standard odds list them.',
		],
	},
] as const;
export default function TutorialScreen() {
	const [chapter, setChapter] = useState<(typeof chapters)[number]['id']>('goals');
	const current = chapters.find(item => item.id === chapter)!;
	return (
		<SafeAreaView style={styles.safe}>
			<View style={styles.header}>
				<ActionButton compact tone="quiet" label="Close" onPress={() => router.back()} />
				<Text style={styles.headerTitle}>Dragon Focus Tutorial</Text>
				<View style={{ width: 60 }} />
			</View>
			<ScrollView contentContainerStyle={styles.content}>
				<PageIntro eyebrow="Field guide" title={current.title} description="The essential rules, kept short enough to use while playing." />
				<TabStrip tabs={chapters} value={chapter} onChange={setChapter} />
				<Card accent="gold">
					<SectionTitle title={current.label} />
					{current.body.map((line, index) => (
						<View key={line} style={styles.rule}>
							<Text style={styles.number}>{index + 1}</Text>
							<Text style={uiStyles.body}>{line}</Text>
						</View>
					))}
				</Card>
				{chapter === 'lootboxes' ?
					<LootboxOdds />
				:	null}
			</ScrollView>
		</SafeAreaView>
	);
}

function LootboxOdds() {
	return (
		<>
			<Card accent="crimson">
				<SectionTitle title="How rolls work" detail="Randomized rewards have no guaranteed monetary value." />
				<Text style={uiStyles.body}>A box chooses its roll count first. Every roll independently chooses a spell size from the applicable table, then chooses a spell type. The Impossible Lootbox awards ten identical spells per roll.</Text>
				<Text style={uiStyles.body}>Up to three verified rewarded-ad claims per eight-hour window award a Basic Lootbox without spending Shards.</Text>
			</Card>
			{SPELL_LOOTBOXES.map(box => (
				<Card key={box.id}>
					<SectionTitle title={box.name} detail={`${box.shardCost.toLocaleString()} Shards · ${box.minimumRolls}–${box.maximumRolls} rolls${box.identicalRollBundle > 1 ? ` · ${box.identicalRollBundle} identical spells per roll` : ''}`} />
					<OddsTable title="Standard chances" weights={box.standardWeights} />
					<OddsTable title="With Hectate unlocked" weights={box.hectateWeights} />
				</Card>
			))}
		</>
	);
}

function OddsTable({ title, weights }: { title: string; weights: (typeof SPELL_LOOTBOXES)[number]['standardWeights'] }) {
	return (
		<View style={styles.oddsGroup}>
			<Text style={styles.oddsTitle}>{title}</Text>
			<View style={styles.oddsGrid}>
				{SPELL_SIZES.map(size => (
					<View key={size.size} style={styles.oddsRow}>
						<Text style={styles.oddsName}>{size.name}</Text>
						<Text style={styles.oddsValue}>{weights[size.size] ?? 0}%</Text>
					</View>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.canvas },
	header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.md, borderBottomColor: colors.line, borderBottomWidth: 1 },
	headerTitle: { color: colors.ink, fontFamily: appFonts.bold, fontSize: 16 },
	content: { width: '100%', maxWidth: 800, alignSelf: 'center', padding: space.lg, paddingBottom: 60, gap: space.lg },
	rule: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', borderTopColor: colors.line, borderTopWidth: 1, paddingTop: space.md },
	number: { color: colors.gold, fontFamily: appFonts.black, fontSize: 16, width: 22 },
	oddsGroup: { gap: space.sm, borderTopColor: colors.line, borderTopWidth: 1, paddingTop: space.md },
	oddsTitle: { color: colors.gold, fontFamily: appFonts.semibold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
	oddsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
	oddsRow: { width: '47%', flexGrow: 1, minWidth: 130, flexDirection: 'row', justifyContent: 'space-between', gap: space.sm, backgroundColor: colors.canvasRaised, borderRadius: 10, paddingHorizontal: space.md, paddingVertical: space.sm },
	oddsName: { color: colors.ink, fontFamily: appFonts.medium, fontSize: 11 },
	oddsValue: { color: colors.gold, fontFamily: appFonts.mono, fontSize: 11 },
});
