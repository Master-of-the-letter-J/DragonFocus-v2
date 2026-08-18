import { ActionButton, Card, PageIntro, SectionTitle, TabStrip, uiStyles } from '@/components/ui/DragonUI';
import { TUTORIAL_CHAPTERS, type TutorialChapter } from '@/components/pages/tutorial/tutorial-chapters';
import { styles } from '@/components/pages/tutorial/tutorial.styles';
import { SPELL_SNACKBOXES } from '@/data/world-data/spell-snackboxes';
import { SPELL_SIZES } from '@/data/world-data/spells';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TutorialRoute() {
	const [chapter, setChapter] = useState<TutorialChapter>('goals');
	const current = TUTORIAL_CHAPTERS.find(item => item.id === chapter)!;
	return (
		<SafeAreaView style={styles.safe}>
			<View style={styles.header}>
				<ActionButton compact tone="quiet" label="Close" onPress={() => router.back()} />
				<Text style={styles.headerTitle}>Dragon Focus Tutorial</Text>
				<View style={{ width: 60 }} />
			</View>
			<ScrollView contentContainerStyle={styles.content}>
				<PageIntro eyebrow="Field guide" title={current.title} description="The essential rules, kept short enough to use while playing." />
				<TabStrip tabs={TUTORIAL_CHAPTERS} value={chapter} onChange={setChapter} />
				<Card accent="gold">
					<SectionTitle title={current.label} />
					{current.body.map((line, index) => (
						<View key={line} style={styles.rule}>
							<Text style={styles.number}>{index + 1}</Text>
							<Text style={uiStyles.body}>{line}</Text>
						</View>
					))}
				</Card>
				{chapter === 'snackboxes' ?
					<SnackboxOdds />
				:	null}
			</ScrollView>
		</SafeAreaView>
	);
}

function SnackboxOdds() {
	return (
		<>
			<Card accent="crimson">
				<SectionTitle title="How rolls work" detail="Randomized rewards have no guaranteed monetary value." />
				<Text style={uiStyles.body}>The Snackbox chooses its roll count first. Every roll independently chooses a spell size from the applicable table, then chooses a spell type.</Text>
				<Text style={uiStyles.body}>You can hold three rewarded-ad charges. One charge returns every three real-time hours, including while offline, and each verified ad awards 5 Crimson Shards.</Text>
			</Card>
			{SPELL_SNACKBOXES.map(box => (
				<Card key={box.id}>
					<SectionTitle title={box.name} detail={`${box.shardCost.toLocaleString()} Shards · ${box.minimumRolls}–${box.maximumRolls} rolls${box.identicalRollBundle > 1 ? ` · ${box.identicalRollBundle} identical spells per roll` : ''}`} />
					<OddsTable title="Standard chances" weights={box.standardWeights} />
					<OddsTable title="With Hecate unlocked" weights={box.hecateWeights} />
				</Card>
			))}
		</>
	);
}

function OddsTable({ title, weights }: { title: string; weights: (typeof SPELL_SNACKBOXES)[number]['standardWeights'] }) {
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
