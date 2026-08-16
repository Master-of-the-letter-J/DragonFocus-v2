import { DragonAppScreen } from '@/components/app-shell/DragonAppScreen';
import { ARCHIVE_TABS, type ArchiveTab } from '@/components/pages/archives/archive-tabs';
import { styles } from '@/components/pages/archives/archives.styles';
import { ActionButton, Card, EmptyState, PageIntro, ProgressBar, SectionTitle, TabStrip, uiStyles } from '@/components/ui/DragonUI';
import { dragonTheme } from '@/constants/dragon-theme';
import { DRAGON_PACT_BENEFITS, DRAGON_PACT_PRODUCTS } from '@/data/premium-data/premium-catalog';
import { ACHIEVEMENTS } from '@/data/statistics-data/achievements';
import { FIXED_MARKET_BUNDLES, REWARDED_SHARD_AD, SHARD_PACKS } from '@/data/world-data/black-market';
import { GOVERNMENT_LOGS } from '@/data/world-data/government-logs';
import { milestoneForEnergy } from '@/data/world-data/milestones';
import { SPELL_SNACKBOXES } from '@/data/world-data/spell-snackboxes';
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
	const totalEnergy = useWorldStore(state => state.resourceStore.totalAllTime.energy);
	const milestone = milestoneForEnergy(totalEnergy);
	const requiredMilestone = ARCHIVE_TABS.find(candidate => candidate.id === tab)?.unlockMilestone ?? 0;
	return (
		<DragonAppScreen title="The Scrolls" panel="spells" effects={tab === 'market'}>
			<TabStrip tabs={ARCHIVE_TABS} value={tab} onChange={setTab} milestone={milestone} />
			{milestone < requiredMilestone ?
				<EmptyState icon="🔒" title="Archive sealed" description={`Unlocks at Milestone ${requiredMilestone}.`} />
			: tab === 'pact' ?
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
			<PageIntro eyebrow="Account & premium" title="The Dragon Pact" description="Sign in to carry verified progress across supported devices. A backend-verified first signup awards 50 Crimson Shards." />
			<Card accent={premium.isPremium ? 'gold' : 'crimson'}>
				<SectionTitle title="Account" detail={premium.account ? `Signed in as ${premium.account.displayName ?? premium.account.email ?? premium.account.userId}` : 'Google, Apple, and username/password login require the configured backend.'} />
				{premium.account ?
					<ActionButton tone="quiet" label="Sign out" onPress={premium.signOut} />
				:	<View style={uiStyles.wrap}>
						<ActionButton disabled label="Continue with Google" />
						<ActionButton disabled tone="quiet" label="Username & password" />
						<ActionButton disabled tone="quiet" label="Continue with Apple" />
					</View>
				}
				<Text style={uiStyles.muted}>Account actions stay disabled until server keys, redirect URLs, and verified profile endpoints are configured.</Text>
			</Card>
			<Card>
				<SectionTitle title="Benefits" />
				{['Unlimited Habit and To-Do goals', `Up to ${DRAGON_PACT_BENEFITS.challengeLimitPerType} Quark and Crimson challenges per type`, 'Double Crimson Heart charge and maximum', 'Double Dark Energy from every Harvest', 'Double base XP and Fury reduction from every Harvest', 'Five-times goal shard cap', '10% bonus value throughout the Black Market, including shard packs'].map(benefit => (
					<View key={benefit} style={styles.benefit}>
						<Text style={styles.check}>✦</Text>
						<Text style={uiStyles.body}>{benefit}</Text>
					</View>
				))}
			</Card>
			<Card>
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
				<Text style={uiStyles.muted}>Pricing B: $1.99 monthly · $4.99 yearly · $14.99 permanent.</Text>
			</Card>
		</>
	);
}

function BlackMarket() {
	const [subtab, setSubtab] = useState<'magic' | 'shards'>('magic');
	const shards = useWorldStore(state => state.resourceStore.resources.shards);
	const buyBundle = useProductionSpecialStore(state => state.blackMarket.purchaseFixedBundle);
	const openSnackbox = useProductionSpecialStore(state => state.spells.openSnackbox);
	const remainingAds = useProductionSpecialStore(state => state.blackMarket.rewardedShardAdStacks);

	return (
		<>
			<PageIntro eyebrow="Shards & scrolls" title="Black Market" description="Trade Crimson Shards for fixed resources or open the single randomized Dragon Snackbox. Its exact odds are always shown." />
			<TabStrip
				tabs={[
					{ id: 'magic', label: 'Magic Spells' },
					{ id: 'shards', label: 'Shard Conversions' },
				]}
				value={subtab}
				onChange={setSubtab}
			/>
			<Card accent="gold">
				<SectionTitle title={`${formatDecimal(shards)} Crimson Shards`} detail={subtab === 'magic' ? 'Snackbox odds are shown before every purchase.' : `${remainingAds}/${REWARDED_SHARD_AD.maxStacks} ad charges · one returns every three real-time hours.`} />
			</Card>
			{subtab === 'magic' ?
				<>
					<View style={styles.marketGrid}>
						{SPELL_SNACKBOXES.map(box => (
							<Card key={box.id}>
								<SectionTitle title={box.name} detail={`${box.minimumRolls}–${box.maximumRolls} rolls · ${box.shardCost} shards`} />
								<Text style={uiStyles.muted}>
									Standard odds:{' '}
									{Object.entries(box.standardWeights)
										.map(([size, weight]) => `S${size} ${weight}%`)
										.join(' · ')}
								</Text>
								<ActionButton label={`Open Snackbox for ${box.shardCost} ◆`} onPress={() => openSnackbox(box.id)} />
							</Card>
						))}
					</View>
					<Text style={styles.disclosure}>Randomized rewards • Exact probabilities displayed • No guaranteed monetary value</Text>
				</>
			:	<>
					<Card accent="gold">
						<SectionTitle title="Watch an ad" detail={`${remainingAds}/${REWARDED_SHARD_AD.maxStacks} charges available · refills online or offline`} />
						<Text style={styles.planPrice}>+{REWARDED_SHARD_AD.shards} ◆</Text>
						<ActionButton disabled label={remainingAds > 0 ? 'Ad provider required' : 'Next charge in under 3 hours'} />
					</Card>
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
								{'badge' in pack ? <Text style={uiStyles.muted}>{pack.badge}</Text> : null}
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
	const milestone = milestoneForEnergy(useWorldStore(state => state.resourceStore.totalAllTime.energy));
	const [subtab, setSubtab] = useState<'achievements' | 'statistics' | 'graveyard'>('achievements');
	return (
		<>
			<PageIntro eyebrow="Legacy" title="Records" description="Achievements, lifetime statistics, and every dragon remembered by the Nexus." />
			<TabStrip
				tabs={[
					{ id: 'achievements', label: 'Achievements' },
					{ id: 'statistics', label: 'Statistics' },
					{ id: 'graveyard', label: 'Dragon Graveyard', unlockMilestone: 3 },
				]}
				value={subtab}
				onChange={setSubtab}
				milestone={milestone}
			/>
			{subtab === 'achievements' ?
				<View style={styles.achievementGrid}>
					{ACHIEVEMENTS.map(achievement => {
						const unlocked = stats.unlockedAchievementIds.includes(achievement.id);
						const metric = stats.metricValue(achievement.metric);
						const progress = typeof metric === 'number' ? metric : metric.toNumber();
						return (
							<View key={achievement.id} style={[styles.achievement, unlocked && styles.achievementUnlocked]}>
								<Text style={styles.achievementIcon}>{unlocked ? '✦' : '◇'}</Text>
								<Text numberOfLines={2} style={styles.achievementTitle}>
									{achievement.title}
								</Text>
								<Text numberOfLines={3} style={uiStyles.muted}>
									{achievement.description}
								</Text>
								<Text style={uiStyles.muted}>
									{Math.min(progress, achievement.target).toLocaleString()} / {achievement.target.toLocaleString()} · +{achievement.shards} ◆
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
	const totalEnergy = useWorldStore(state => state.resourceStore.totalAllTime.energy);
	const milestone = milestoneForEnergy(totalEnergy);
	const logs = GOVERNMENT_LOGS.filter(log => milestone >= log.milestone);
	return (
		<>
			<PageIntro eyebrow="Government archive" title="Secret Logs" description="Milestones and rare achievements decrypt fragments of the hidden record." />
			<Card accent="violet">
				<SectionTitle title="Clearance status" detail={`${unlocked} achievements recognized`} />
				<ProgressBar value={Math.min(100, unlocked * 5)} color={colors.violet} />
			</Card>
			{logs.map(log => (
				<Card key={log.id} accent="violet">
					<SectionTitle title={`⌾ ${log.title}`} detail={`Declassified at Milestone ${log.milestone}`} />
					<Text style={uiStyles.body}>{log.body}</Text>
				</Card>
			))}
			{!logs.length ?
				<EmptyState icon="⌾" title="Encrypted" description="Reach milestones and secret achievements to decrypt the archive." />
			:	null}
		</>
	);
}
