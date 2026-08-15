import { styles } from '@/components/pages/archives/archives.styles';
import { DragonAppScreen } from '@/components/app-shell/DragonAppScreen';
import { ARCHIVE_TABS, type ArchiveTab } from '@/components/pages/archives/archive-tabs';
import { ActionButton, Card, EmptyState, PageIntro, ProgressBar, SectionTitle, TabStrip, uiStyles } from '@/components/ui/DragonUI';
import { dragonTheme } from '@/constants/dragon-theme';
import { ACHIEVEMENTS } from '@/data/statistics-data/achievements';
import { DRAGON_PACT_BENEFITS, DRAGON_PACT_PRODUCTS } from '@/data/premium-data/premium-catalog';
import { FIXED_MARKET_BUNDLES, SHARD_PACKS } from '@/data/world-data/black-market';
import { SPELL_LOOTBOXES } from '@/data/world-data/spell-lootboxes';
import { usePremiumStore } from '@/store/store-premium/_usePremiumStore';
import { useProductionSpecialStore } from '@/store/store-production-special/_useProductionSpecialStore';
import { useProductivityStore } from '@/store/store-productivity/_useProductivityStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import { useStatsStore } from '@/store/useStatsStore';
import { formatDecimal } from '@/utils/decimal';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

const { colors } = dragonTheme;
export default function ArchivesRoute() {
	const params = useLocalSearchParams<{ tab?: ArchiveTab }>();
	const [tab, setTab] = useState<ArchiveTab>(ARCHIVE_TABS.some(candidate => candidate.id === params.tab) ? params.tab! : 'pact');
	return (
		<DragonAppScreen title="The Scrolls" panel="spells" effects={tab === 'market'}>
			<TabStrip tabs={ARCHIVE_TABS} value={tab} onChange={setTab} />
			{tab === 'pact' ?
				<DragonPact />
			: tab === 'market' ?
				<BlackMarket />
			: tab === 'logs' ?
				<Chronicles />
			: tab === 'records' ?
				<Records />
			:	<SecretLogs />}
		</DragonAppScreen>
	);
}

function DragonPact() {
	const premium = usePremiumStore(
		useShallow(state => ({
			isPremium: state.isPremium,
			plan: state.plan,
			expiresAt: state.expiresAt,
			account: state.account,
			signOut: state.signOut,
		})),
	);
	return (
		<>
			<PageIntro eyebrow="Account & premium" title="The Dragon Pact" description="A single verified entitlement follows an authenticated profile across supported devices." />
			<Card accent={premium.isPremium ? 'gold' : 'crimson'}>
				<SectionTitle title={premium.isPremium ? 'Pact active' : 'Choose your pact'} detail={premium.isPremium ? `${premium.plan ?? 'verified'} access${premium.expiresAt ? ` · renews ${new Date(premium.expiresAt).toLocaleDateString()}` : ''}` : 'Storefront prices replace these display estimates at checkout.'} />
				{!premium.isPremium ?
					<View style={styles.planGrid}>
						{DRAGON_PACT_PRODUCTS.map(product => (
							<View key={product.id} style={styles.plan}>
								<Text style={styles.planPeriod}>{product.period}</Text>
								<Text style={styles.planPrice}>{product.displayPriceUsd}</Text>
								<ActionButton compact disabled label="Connect store" />
							</View>
						))}
					</View>
				:	null}
			</Card>
			<Card>
				<SectionTitle title="Benefits" />
				{['Unlimited Habit and To-Do goals', `Up to ${DRAGON_PACT_BENEFITS.challengeLimitPerType} Quark and Crimson challenges per type`, 'Double Crimson Heart charge and maximum', 'Double complete Harvest rewards', 'Five-times goal shard cap', '10% more Black Market value'].map(benefit => (
					<View key={benefit} style={styles.benefit}>
						<Text style={styles.check}>✦</Text>
						<Text style={uiStyles.body}>{benefit}</Text>
					</View>
				))}
			</Card>
			<Card>
				<SectionTitle title="Account" detail={premium.account ? `Signed in as ${premium.account.displayName ?? premium.account.email ?? premium.account.userId}` : 'Google, Apple, and password authentication require the configured backend.'} />
				{premium.account ?
					<ActionButton tone="quiet" label="Sign out" onPress={premium.signOut} />
				:	<View style={uiStyles.wrap}>
						<ActionButton disabled label="Continue with Google" />
						<ActionButton disabled tone="quiet" label="Email & password" />
						<ActionButton disabled tone="quiet" label="Continue with Apple" />
					</View>
				}
				<Text style={uiStyles.muted}>Buttons remain disabled until server keys, redirect URLs, and verified entitlement webhooks are configured.</Text>
			</Card>
		</>
	);
}

function BlackMarket() {
	const [subtab, setSubtab] = useState<'magic' | 'shards'>('magic');
	const shards = useWorldStore(state => state.resourceStore.resources.shards);
	const buyBundle = useProductionSpecialStore(state => state.blackMarket.purchaseFixedBundle);
	const openBox = useProductionSpecialStore(state => state.spells.openLootbox);
	const remainingAds = useProductionSpecialStore(state => state.spells.getRewardedAdClaimsRemaining());
	return (
		<>
			<PageIntro eyebrow="Shards & scrolls" title="Black Market" description="Trade Crimson Shards for fixed resources or randomized spell scrolls. Odds are shown in each box's detail." />
			<TabStrip
				tabs={[
					{ id: 'magic', label: 'Magic Spells' },
					{ id: 'shards', label: 'Shard Conversions' },
				]}
				value={subtab}
				onChange={setSubtab}
			/>
			<Card accent="gold">
				<SectionTitle title={`${formatDecimal(shards)} Crimson Shards`} detail={subtab === 'magic' ? `${remainingAds} rewarded Basic boxes remain in the current window.` : 'Real-money deliveries require server verification.'} />
			</Card>
			{subtab === 'magic' ?
				<>
					<View style={styles.marketGrid}>
						{SPELL_LOOTBOXES.map(box => (
							<Card key={box.id}>
								<SectionTitle title={`${box.name} Lootbox`} detail={`${box.minimumRolls}–${box.maximumRolls} rolls · ${box.shardCost} shards`} />
								<Text style={uiStyles.muted}>
									Standard odds:{' '}
									{Object.entries(box.standardWeights)
										.map(([size, weight]) => `S${size} ${weight}%`)
										.join(' · ')}
								</Text>
								<ActionButton label={`Open for ${box.shardCost}`} onPress={() => openBox(box.id)} />
							</Card>
						))}
					</View>
					<Text style={styles.disclosure}>Randomized rewards • Exact probabilities displayed • No guaranteed monetary value</Text>
				</>
			:	<>
					<View style={styles.marketGrid}>
						{FIXED_MARKET_BUNDLES.map(bundle => (
							<Card key={bundle.id}>
								<SectionTitle title={bundle.id.replaceAll('-', ' ')} detail={`${bundle.spellCount} Large ${bundle.spellType.replaceAll('-', ' ')} spells`} />
								<Text style={styles.planPrice}>{bundle.shardCost} ◆</Text>
								<ActionButton label="Trade shards" onPress={() => buyBundle(bundle.id)} />
							</Card>
						))}
					</View>
					<SectionTitle title="Buy Crimson Shards" detail="Checkout activates only after storefront and backend verification are configured." />
					<View style={styles.planGrid}>
						{SHARD_PACKS.map(pack => (
							<View key={pack.id} style={styles.plan}>
								<Text style={styles.planPeriod}>{pack.shards.toLocaleString()} shards</Text>
								<Text style={styles.planPrice}>{pack.displayPriceUsd}</Text>
								<ActionButton compact disabled label="Store required" />
							</View>
						))}
					</View>
				</>
			}
		</>
	);
}

function Chronicles() {
	const sessions = useProductivityStore(state => state.surveys.archived);
	return (
		<>
			<PageIntro eyebrow="Daily record" title="The Logs" description="Check-ins, check-outs, and daily outcomes stay readable as a horizontal chronicle." />
			{sessions.length ?
				<Card style={styles.tableCard}>
					<ScrollView horizontal showsHorizontalScrollIndicator>
						<View>
							<View style={styles.tableRow}>
								{['Date', 'Mood in', 'Mood out', 'Goals added', 'Harvested'].map(column => (
									<Text key={column} style={[styles.cell, styles.headerCell]}>
										{column}
									</Text>
								))}
							</View>
							{sessions.map(session => (
								<View key={session.id} style={styles.tableRow}>
									<Text style={styles.cell}>{session.date}</Text>
									<Text style={styles.cell}>{session.checkIn?.mood ?? '—'}</Text>
									<Text style={styles.cell}>{session.checkOut?.mood ?? '—'}</Text>
									<Text style={styles.cell}>{session.checkIn?.goalsAdded ?? 0}</Text>
									<Text style={styles.cell}>{session.checkOut?.goalsHarvested ?? 0}</Text>
								</View>
							))}
						</View>
					</ScrollView>
				</Card>
			:	<EmptyState icon="☷" title="The first page is blank" description="Complete a check-in and check-out to begin the chronicle." />}
		</>
	);
}

function Records() {
	const stats = useStatsStore();
	const [subtab, setSubtab] = useState<'achievements' | 'statistics' | 'graveyard'>('achievements');
	return (
		<>
			<PageIntro eyebrow="Legacy" title="Records" description="Achievements, lifetime statistics, and every dragon remembered by the Nexus." />
			<TabStrip
				tabs={[
					{ id: 'achievements', label: 'Achievements' },
					{ id: 'statistics', label: 'Statistics' },
					{ id: 'graveyard', label: 'Dragon Graveyard' },
				]}
				value={subtab}
				onChange={setSubtab}
			/>
			{subtab === 'achievements' ?
				<View style={styles.achievementGrid}>
					{ACHIEVEMENTS.map(achievement => {
						const unlocked = stats.unlockedAchievementIds.includes(achievement.id);
						return (
							<View key={achievement.id} style={[styles.achievement, unlocked && styles.achievementUnlocked]}>
								<Text style={styles.achievementIcon}>{unlocked ? '✦' : '◇'}</Text>
								<Text numberOfLines={2} style={styles.achievementTitle}>
									{achievement.title}
								</Text>
								<Text numberOfLines={3} style={uiStyles.muted}>
									{achievement.description}
								</Text>
							</View>
						);
					})}
				</View>
			: subtab === 'statistics' ?
				<View style={styles.marketGrid}>
					{[
						['Goals complete', `${stats.totalGoalsCompleted}`],
						['Focus sessions', `${stats.pomodoroSessions}`],
						['Focus time', `${Math.floor(stats.pomodoroSeconds / 60)}m`],
						['Longest focus', `${Math.floor(stats.longestPomodoroSeconds / 60)}m`],
						['Check-ins', `${stats.checkIns}`],
						['Check-outs', `${stats.checkOuts}`],
						['Armageddons', `${stats.armageddons}`],
						['Transcensions', `${stats.transcensions}`],
						['Best Energy', formatDecimal(stats.bestResources.energy)],
					].map(([label, value]) => (
						<Card key={label}>
							<Text style={styles.metricLabel}>{label}</Text>
							<Text style={styles.statLarge}>{value}</Text>
						</Card>
					))}
				</View>
			: stats.dragonGraveyard.length ?
				stats.dragonGraveyard.map(entry => (
					<Card key={`${entry.name}-${entry.diedAt}`} accent="crimson">
						<SectionTitle title={entry.name} detail={`Age ${entry.ageDays.toFixed(1)} days`} />
						<Text style={uiStyles.muted}>
							Died {new Date(entry.diedAt).toLocaleDateString()} · {entry.respawnAt}
						</Text>
					</Card>
				))
			:	<EmptyState icon="♢" title="No names carved in stone" description="May the graveyard remain quiet." />}
		</>
	);
}

function SecretLogs() {
	const unlocked = useStatsStore(state => state.unlockedAchievementIds.length);
	return (
		<>
			<PageIntro eyebrow="Government archive" title="Secret Logs" description="Milestones and rare achievements decrypt fragments of the hidden record." />
			<Card accent="violet">
				<SectionTitle title="Clearance status" detail={`${unlocked} achievements recognized`} />
				<ProgressBar value={Math.min(100, unlocked * 5)} color={colors.violet} />
			</Card>
			<EmptyState icon="⌾" title="Encrypted" description="Secret log content will appear as its linked milestone and achievement definitions are authored." />
		</>
	);
}
