import { DragonAppScreen } from '@/components/app-shell/DragonAppScreen';
import { ClickerList } from '@/components/pages/lair/ClickerList';
import { LairPurchaseButton, formatPurchaseCosts, missingPurchaseCosts } from '@/components/pages/lair/LairPurchaseButton';
import { LAIR_TABS, PRESTIGE_TABS, PRODUCTION_TABS, SPECIAL_PRODUCTION_TABS, UPGRADE_TABS, type LairTab, type PrestigeTab, type ProductionTab, type SpecialProductionTab, type UpgradeTab } from '@/components/pages/lair/lair-tabs';
import { styles } from '@/components/pages/lair/lair.styles';
import { ActionButton, Card, Chip, EmptyState, PageIntro, ProgressBar, SectionTitle, Stat, TabStrip, uiStyles } from '@/components/ui/DragonUI';
import { dragonTheme } from '@/constants/dragon-theme';
import { calculateProgressionPreview } from '@/data/calculations/progression-preview';
import { AMPLIFIERS, APOCALYPSE_BOOST_UPGRADES, DEITIES, DRAGON_CLICKERS, ENERGY_UPGRADES, FORGES, GOAL_MULTIPLIERS, PRODUCERS, PRODUCER_UPGRADES, SPECIAL_GENERATORS, TITANS } from '@/data/production-data';
import { DRAGON_QUOTES } from '@/data/statistics-data/dragon-quotes';
import { MILESTONES, milestoneForEnergy, milestoneLabel } from '@/data/world-data/milestones';
import { useOnlineProgressStore } from '@/store/store-online-progress/_useOnlineProgressStore';
import { usePrestigeStore } from '@/store/store-prestige/_usePrestigeStore';
import { useProductionSpecialStore } from '@/store/store-production-special/_useProductionSpecialStore';
import type { SpellConversionMode } from '@/store/store-production-special/createConvertorSlice';
import { FUELABLE_MONUMENT_IDS } from '@/store/store-production-special/createMonumentsSlice';
import { useProductionStore, type ProductionStoreState } from '@/store/store-production/_useProductionStore';
import { getProducerDisplayName } from '@/store/store-production/createProducerSlice';
import { useProductivityStore } from '@/store/store-productivity/_useProductivityStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import { useAppStore } from '@/store/useAppStore';
import type { ProductionItem } from '@/types/production.types';
import type { ResourceAmounts } from '@/types/resources.types';
import { decimal, formatDecimal } from '@/utils/decimal';
import { SPELL_SIZES } from '@/data/world-data/spells';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

const { colors } = dragonTheme;
const COSMETIC_GLOWS = { classic: colors.crimsonSoft, ember: '#7A2D16', astral: '#40276B' } as const;
const feedbackLeft = (x: number, width: number, stageWidth: number) => stageWidth ? Math.max(8, Math.min(x - width / 2, stageWidth - width - 8)) : x - width / 2;
const feedbackTop = (y: number) => Math.max(8, y - 10);
export default function LairRoute() {
	const params = useLocalSearchParams<{ tab?: LairTab }>();
	const milestone = milestoneForEnergy(useWorldStore(state => state.resourceStore.totalAllTime.energy));
	const [tab, setTab] = useState<LairTab>(LAIR_TABS.some(candidate => candidate.id === params.tab) ? params.tab! : 'nexus');
	const requiredMilestone = LAIR_TABS.find(candidate => candidate.id === tab)?.unlockMilestone ?? 0;
	const checkInRequired = useAppStore(state => state.requireDailyCheckIn);
	const checkOutRequired = useAppStore(state => state.requireDailyCheckOut);
	const checkedIn = useProductivityStore(state => state.surveys.checkInCompleted);
	const checkedOut = useProductivityStore(state => state.surveys.checkOutCompleted);
	const mode = useWorldStore(state => state.optionsStore.gameMode);
	const panel = tab === 'nexus' ? 'world' : 'resources';
	const gated = tab !== 'nexus' && tab !== 'heart' && ((checkInRequired || mode === 'hard' || mode === 'hard-plus') && !checkedIn || checkOutRequired && !checkedOut);
	return (
		<DragonAppScreen title="Dragon's Lair" panel={panel} effects>
			<TabStrip tabs={LAIR_TABS} value={tab} onChange={setTab} milestone={milestone} />
			{milestone < requiredMilestone ?
				<EmptyState icon="🔒" title="Lair chamber sealed" description={`Unlocks at Milestone ${milestoneLabel(requiredMilestone)}.`} />
			: gated ?
				<Card accent="gold">
					<SectionTitle title="The Lair is sleeping" detail="Complete today’s check-in to wake production and prestige systems, or disable this gate in Options." />
					<ActionButton label="Begin check-in" onPress={() => router.push('/check-in-survey')} />
				</Card>
			: tab === 'nexus' ?
				<Nexus />
			: tab === 'heart' ?
				<CrimsonHeart />
			: tab === 'production' ?
				<Production />
			: tab === 'special' ?
				<SpecialProduction />
			: tab === 'upgrades' ?
				<Upgrades />
			:	<Prestige />}
		</DragonAppScreen>
	);
}

const stageSprites = {
	egg: require('@/assets/images/dragon-stages/dragon-egg-test.png'),
	hatchling: require('@/assets/images/dragon-stages/dragon-hatchling-test.png'),
	dragonet: require('@/assets/images/dragon-stages/dragon-dragonet-test.png'),
	juvenile: require('@/assets/images/dragon-stages/dragon-juvinelle-test.png'),
	'young-adult': require('@/assets/images/dragon-stages/dragon-young-adult-test.png'),
	'elder-dragon': require('@/assets/images/dragon-stages/dragon-elder-test.png'),
	'great-wyrm': require('@/assets/images/dragon-stages/great-wyrm-test.png'),
	'heart-of-chaos': require('@/assets/images/dragon-stages/dragon-heart.png'),
} as const;

function Nexus() {
	const numberFormat = useAppStore(state => state.numberFormat);
	const noSpritesMode = useAppStore(state => state.noSpritesMode);
	const cosmetic = useAppStore(state => state.dragonCosmetic);
	const heroFormat = numberFormat === 'scientific' ? 'scientific' : 'long';
	const resources = useWorldStore(state => state.resourceStore.resources);
	const heartCharge = useProductionSpecialStore(state => state.crimsonHeart.charge);
	const totalAllTimeEnergy = useWorldStore(state => state.resourceStore.totalAllTime.energy);
	const dragon = useWorldStore(state => state.resourceStore.dragon);
	const worldDragon = useWorldStore(state => state.dragonStore);
	const currentMilestone = milestoneForEnergy(totalAllTimeEnergy);
	const nextMilestone = MILESTONES.find(candidate => candidate.id > currentMilestone);
	const progression = calculateProgressionPreview(heartCharge);
	const tap = useSharedValue(1);
	const [stageWidth, setStageWidth] = useState(0);
	const [clickFeedback, setClickFeedback] = useState<{ id: number; x: number; y: number; energy: string; fury: string }>();
	const animated = useAnimatedStyle(() => ({ transform: [{ scale: tap.value }] }));
	const source = stageSprites[dragon.stage as keyof typeof stageSprites] ?? require('@/assets/images/dragon-stages/dragon.png');
	if (!worldDragon.dragonSpawned) {
		return (
			<Card accent="gold">
				<PageIntro eyebrow="CLASSIFIED NEXUS" title="Spawn your dragon" description="The rest of Dragon Focus remains sealed until the government Nexus recognizes your dragon." />
				<ActionButton label="Spawn Dragon" onPress={() => worldDragon.spawnDragon()} />
			</Card>
		);
	}
	return (
		<>
			<PageIntro eyebrow="The core" title="The Nexus" description="Your dragon is both companion and engine. Tap it to spark Energy and a little Fury." />
			<Card style={styles.energyHero}>
				<Text style={styles.metricLabel}>Current Energy</Text>
				<Text style={styles.energy}>{formatDecimal(resources.energy, 2, heroFormat)}</Text>
				{progression.heartTicksPerSecond <= 0 ?
					<View style={styles.heartWarning}>
						<Text style={styles.heartWarningTitle}>Crimson Heart inactive</Text>
						<Text style={styles.heartWarningText}>Heart is at 0% — passive Energy generation is paused.</Text>
					</View>
				: 		<View style={styles.generationStats}>
						<View style={styles.generationStat}>
							<Text style={styles.generationLabel}>Energy / tick</Text>
							<Text style={styles.generationValue}>{formatDecimal(progression.energyPerTick, 2, heroFormat)}</Text>
						</View>
						<View style={styles.generationStat}>
							<Text style={styles.generationLabel}>Heart ticks / second</Text>
							<Text style={styles.generationValue}>{formatDecimal(progression.heartTicksPerSecond, 3, heroFormat)}</Text>
						</View>
					</View>}
			</Card>
			<Pressable
				style={styles.dragonStage}
				onLayout={event => setStageWidth(event.nativeEvent.layout.width)}
				onPress={event => {
					// Reanimated shared values are intentionally mutable animation handles.
					// eslint-disable-next-line react-hooks/immutability
					tap.value = withSequence(withSpring(0.92), withSpring(1.04), withSpring(1));
					const reward = worldDragon.clickDragon();
					if (reward) {
						const id = Date.now();
						setClickFeedback({ id, x: event.nativeEvent.locationX, y: event.nativeEvent.locationY, energy: reward.energy, fury: reward.fury });
						setTimeout(() => setClickFeedback(current => (current?.id === id ? undefined : current)), 900);
					}
				}}>
				<View style={[styles.dragonHalo, { backgroundColor: COSMETIC_GLOWS[cosmetic] }]} />
				<Animated.View style={[styles.dragonWrap, animated]}>
					{noSpritesMode ?
						<Text style={styles.dragonGlyph}>♜</Text>
					:	<Image source={source} resizeMode="contain" style={styles.dragon} />}
				</Animated.View>
				{clickFeedback ?
					<Animated.Text key={clickFeedback.id} exiting={FadeOutUp.duration(700)} style={[styles.clickFeedback, { left: feedbackLeft(clickFeedback.x, 220, stageWidth), top: feedbackTop(clickFeedback.y) }]}>
						+{formatDecimal(clickFeedback.energy)} Energy · +{formatDecimal(clickFeedback.fury, 3)} Fury
					</Animated.Text>
				:	null}
				<Text style={styles.dragonName}>{dragon.name}</Text>
				<Text style={styles.dragonMeta}>
					{dragon.stage.replaceAll('-', ' ')} · age {dragon.ageDays.toFixed(2)} days · {cosmetic} cosmetic
				</Text>
			</Pressable>
			<Card accent="gold">
				<SectionTitle title={nextMilestone ? `Approaching Milestone ${milestoneLabel(nextMilestone.id)}` : 'All known milestones reached'} detail={nextMilestone ? `${formatDecimal(totalAllTimeEnergy)} / ${formatDecimal(nextMilestone.energy)} lifetime Energy` : 'The horizon is yours.'} />
				{nextMilestone ?
					<ProgressBar value={totalAllTimeEnergy.div(nextMilestone.energy).times(100).toNumber()} label={`Milestone ${milestoneLabel(currentMilestone)} Complete`} color={colors.gold} />
				:	null}
			</Card>
			<Card accent="gold">
				<SectionTitle title="Dragon Clickers" detail="Small permanent upgrades for the very start of the game." />
				<Text style={uiStyles.muted}>Dragon clicks start at 1 Energy and add +0.01 Anger. Dragon click upgrades persist through Armageddons and Transcensions, and their effects scale the Earth clicker system proportionally.</Text>
				<Text style={uiStyles.muted}>Buy one level of the last visible clicker to reveal the next at no unlock cost. Maxed clickers disappear forever.</Text>
			</Card>
			<ClickerList items={DRAGON_CLICKERS} />
			<Card>
				<SectionTitle title="Missions" detail="The mission board is being prepared." />
				<EmptyState icon="⌁" title="Coming in a future era" description="Missions will turn longer focus arcs into dragon-specific adventures." />
			</Card>
		</>
	);
}

function Production() {
	const milestone = milestoneForEnergy(useWorldStore(state => state.resourceStore.totalAllTime.energy));
	const levels = useProductionStore(state => state.levels);
	const goalMultiplier = useProductionStore(state => state.goalMultiplierStore.getProductionMultiplier());
	const online = useOnlineProgressStore.getState();
	const productionPerSecond = online.calculateProducerEnergy(1, 1, 'idle');
	const amplification = online.calculateAmplification();
	const energyPerSecond = productionPerSecond.times(amplification).times(online.calculateOtherEnergyMultipliers());
	const [tab, setTab] = useState<ProductionTab>('producers');
	const requiredMilestone = PRODUCTION_TABS.find(candidate => candidate.id === tab)?.unlockMilestone ?? 0;
	const [quantity, setQuantity] = useState(1);
	const items =
		tab === 'producers' ? PRODUCERS
		: tab === 'amplifiers' ? AMPLIFIERS
		: GOAL_MULTIPLIERS;
	return (
		<>
			<PageIntro eyebrow="Energy systems" title="Production" description="Build from the core outward. Every output follows production × amplification × goal multiplier × other effects." />
			<TabStrip tabs={PRODUCTION_TABS} value={tab} onChange={setTab} milestone={milestone} />
			{milestone < requiredMilestone ?
				<EmptyState icon="🔒" title="Production system sealed" description={`Unlocks at Milestone ${requiredMilestone}.`} />
			:	<>
			<Card accent="gold">
				<SectionTitle
					title={
						tab === 'amplifiers' ? `⌁ ×${formatDecimal(amplification)} amplification`
						: tab === 'goals' ?
							`✦ ×${formatDecimal(goalMultiplier)} goal multiplier`
						:	`⚡ ${formatDecimal(energyPerSecond)} Energy/s`
					}
					detail={tab === 'producers' ? `⚙ ${formatDecimal(productionPerSecond)} raw production/s · ${Object.values(levels).reduce((sum, level) => sum + level, 0)} total owned` : 'Section totals update live and include every currently active effect.'}
				/>
			</Card>
			<>
					<Card>
						<SectionTitle title="Purchase amount" detail="Sell returns half of the Energy purchase cost where selling is allowed." />
						<View style={uiStyles.wrap}>
							{[1, 10, 25, 100].map(amount => (
								<Chip key={amount} label={`×${amount}`} selected={quantity === amount} onPress={() => setQuantity(amount)} />
							))}
							<Chip label="MAX" selected={quantity === 999} onPress={() => setQuantity(999)} />
						</View>
					</Card>
					<ItemList items={items} quantity={quantity} />
			</>
			</>}
		</>
	);
}

function ItemList({ items, quantity = 1 }: { items: readonly ProductionItem[]; quantity?: number }) {
	const reverseItemLayout = useAppStore(state => state.reverseItemLayout);
	const online = useOnlineProgressStore.getState();
	const totalProducerRate = online.calculateProducerEnergy(1, 1, 'idle');
	const totalAmplification = online.calculateAmplification();
	const store = useProductionStore(
		useShallow(state => ({
			levels: state.levels,
			producerStore: state.producerStore,
			getCost: state.getCost,
			getCosts: state.getCosts,
			canPurchase: state.canPurchase,
			isItemUnlocked: state.isItemUnlocked,
			purchase: state.purchase,
			sell: state.sell,
		})),
	);
	const resources = useWorldStore(state => state.resourceStore.resources);
	const firstLockedIndex = items.findIndex(item => !store.isItemUnlocked(item.id));
	const visibleItems = items.filter((item, index) => store.isItemUnlocked(item.id) || index === firstLockedIndex);
	return (
		<View style={styles.itemList}>
			{visibleItems.map((item, index) => {
				const level = store.levels[item.id] ?? 0;
				const unlocked = store.isItemUnlocked(item.id);
				const requestedCount = quantity === 999 ? maximumAffordable(store, item.id, resources) : quantity;
				const remainingLevels = item.maxLevel === undefined ? Number.POSITIVE_INFINITY : Math.max(0, item.maxLevel - level);
				const count = Math.min(requestedCount, remainingLevels);
				const cost = store.getCost(item.id, count);
				const costs = store.getCosts(item.id, count);
				const maxed = remainingLevels === 0;
				const missing = maxed ? ['Maximum level reached.'] : missingPurchaseCosts(costs, resources);
				const progress = store.producerStore.progress[item.id];
				const itemRate = item.kind === 'producer' && 'baseProduction' in item ? decimal(item.baseProduction).times(level) : decimal(0);
				const itemAmplification = item.kind === 'amplifier' && 'amplification' in item ? decimal(item.amplification).times(level) : decimal(0);
				const contribution =
					item.kind === 'producer' && totalProducerRate.gt(0) ? itemRate.div(totalProducerRate).times(100)
					: item.kind === 'amplifier' && totalAmplification.gt(0) ? itemAmplification.div(totalAmplification).times(100)
					: decimal(0);
				return (
					<Animated.View key={item.id} entering={FadeInDown.delay(Math.min(index * 25, 250))}>
						{!unlocked ?
							<Card accent="violet">
								<EmptyState icon="🔒" title="Classified blueprint" description={`Unlocked by ${item.unlocks?.map(requirement => (requirement.metric === 'milestone' ? `Milestone ${milestoneLabel(requirement.amount ?? 0)}` : requirement.metric.replaceAll('-', ' '))).join(' and ') || 'the previous discovery'}.`} />
							</Card>
						:	<Card style={styles.itemCard}>
								<View style={[styles.itemRow, reverseItemLayout && styles.itemRowReversed]}>
									<View style={styles.itemIcon}>
										<Text style={styles.itemIconText}>
											{item.kind === 'producer' ?
												'⚙'
											: item.kind === 'amplifier' ?
												'⌁'
											: item.kind === 'deity' || item.kind === 'titan' ?
												'♜'
											:	'✦'}
										</Text>
									</View>
									<View style={styles.itemCopy}>
										<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={styles.itemLevel}>
											LEVEL {formatDecimal(level, 0)}
										</Text>
										<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={styles.itemName}>
											{progress && item.kind === 'producer' ? getProducerDisplayName(item as (typeof PRODUCERS)[number], progress) : item.name}
										</Text>
										<Text numberOfLines={2} style={uiStyles.muted}>
											{item.description}
										</Text>
										{item.kind === 'producer' ?
											<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.62} style={styles.metric}>
												⚡ {formatDecimal(itemRate)} /s · {formatDecimal(contribution, 1)}%
											</Text>
										:	null}
										{item.kind === 'amplifier' ?
											<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.62} style={styles.metric}>
												⌁ +{formatDecimal(itemAmplification)} · {formatDecimal(contribution, 1)}%
											</Text>
										:	null}
										<Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.58} style={styles.cost}>
											{maxed ? 'Maximum level reached' : formatPurchaseCosts(costs) || `${formatDecimal(cost)} ${item.costs[0]?.resource ?? 'resource'}`}
										</Text>
									</View>
									<View style={styles.itemActions}>
										<LairPurchaseButton
											compact
											label={maxed ? 'Maxed' : item.maxLevel === 1 ? 'Unlock' : quantity === 999 ? `Buy MAX (${formatDecimal(count, 0)})` : `Buy ${formatDecimal(count, 0)}`}
											disabled={maxed || !count || !store.canPurchase(item.id) || missing.length > 0}
											missing={missing}
											onPress={() => store.purchase(item.id, count)}
										/>
										{item.kind === 'producer' || item.kind === 'amplifier' ?
											<ActionButton compact tone="quiet" label="Sell 1" disabled={!level} onPress={() => store.sell(item.id, 1)} />
										:	null}
									</View>
								</View>
							</Card>
						}
					</Animated.View>
				);
			})}
		</View>
	);
}

const maximumAffordable = (store: Pick<ProductionStoreState, 'getCosts'>, itemId: string, resources: ResourceAmounts) => {
	const canAfford = (quantity: number) => Object.entries(store.getCosts(itemId, quantity)).every(([resource, cost]) => resources[resource as keyof ResourceAmounts].gte(cost!));
	if (!canAfford(1)) return 0;
	let low = 1;
	let high = 2;
	while (high < 1_000_000 && canAfford(high)) {
		low = high;
		high *= 2;
	}
	high = Math.min(high, 1_000_000);
	while (low + 1 < high) {
		const middle = Math.floor((low + high) / 2);
		if (canAfford(middle)) low = middle;
		else high = middle;
	}
	return canAfford(high) ? high : low;
};

function CrimsonHeart() {
	const heart = useProductionSpecialStore(useShallow(state => ({
		charge: state.crimsonHeart.charge,
		getMaximumCharge: state.crimsonHeart.getMaximumCharge,
		getTargetCharge: state.crimsonHeart.getTargetCharge,
	})));
	const upgrades = ENERGY_UPGRADES.filter(item => item.id.includes('crimson'));
	const pulse = useSharedValue(1);
	const [stageWidth, setStageWidth] = useState(0);
	const [quote, setQuote] = useState<{ id: number; x: number; y: number; text: string }>();
	const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
	const onApp = heart.getTargetCharge('idle');
	const onPhone = heart.getTargetCharge('allowed-app');
	const offPhone = heart.getTargetCharge('off-app');
	const maximumCharge = heart.getMaximumCharge();
	const heartPercent = Math.max(0, heart.charge);
	return (
		<>
			<PageIntro eyebrow="Real-time production clock" title="Crimson Heart" description="The Heart converts real seconds into production and population ticks. Blocked apps and Lock-In produce nothing; Harvests, conversions, shrines, spells, and the Incinerator keep their own timing." />
			<Card>
				<View style={styles.heartStatsRow}>
					<Stat label="Dragon Focus" value={`${onApp.toFixed(1)}%`} tone="crimson" />
					<Stat label="Allowed app" value={`${onPhone.toFixed(1)}%`} tone="blue" />
					<Stat label="Off phone" value={`${offPhone.toFixed(1)}%`} tone="gold" />
				</View>
			</Card>
			<Card accent="crimson">
				<SectionTitle title="Current charge" detail="Game mode and the Dragon Pact scale the Heart and its maximum." />
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Listen to the Crimson Heart"
					onLayout={event => setStageWidth(event.nativeEvent.layout.width)}
					onPress={event => {
						// eslint-disable-next-line react-hooks/immutability
						pulse.value = withSequence(withSpring(0.9), withSpring(1.08), withSpring(1));
						const text = DRAGON_QUOTES[Math.floor(Math.random() * DRAGON_QUOTES.length)] ?? 'The Heart remembers every focused second.';
						const id = Date.now();
						setQuote({ id, x: event.nativeEvent.locationX, y: event.nativeEvent.locationY, text });
						setTimeout(() => setQuote(current => (current?.id === id ? undefined : current)), 1_800);
					}}
					style={styles.heartStage}>
					<Animated.Text style={[styles.heartGlyph, heartStyle]}>♥</Animated.Text>
					{quote ?
						<Animated.Text key={quote.id} exiting={FadeOutUp.duration(1_200)} style={[styles.heartQuote, { left: feedbackLeft(quote.x, 280, stageWidth), top: feedbackTop(quote.y) }]}>{quote.text}</Animated.Text>
					:	null}
				</Pressable>
				<Text style={styles.heartNumber}>{heartPercent.toFixed(1)}%</Text>
				<Text style={styles.heartChargeDetail}>{heart.charge.toFixed(1)} / {maximumCharge.toFixed(0)} charge</Text>
				<ProgressBar value={heart.charge} max={maximumCharge} label={`Crimson Heart · ${heartPercent.toFixed(1)}%`} />
			</Card>
			<ItemList items={upgrades} />
		</>
	);
}

function SpecialProduction() {
	const milestone = milestoneForEnergy(useWorldStore(state => state.resourceStore.totalAllTime.energy));
	const [tab, setTab] = useState<SpecialProductionTab>('generation');
	const requiredMilestone = SPECIAL_PRODUCTION_TABS.find(candidate => candidate.id === tab)?.unlockMilestone ?? 0;
	return (
		<>
			<PageIntro eyebrow="Independent systems" title="Special Production" description="Special generators, the Primordial Incinerator, and the Convertor share one chamber while retaining their own rules." />
			<TabStrip tabs={SPECIAL_PRODUCTION_TABS} value={tab} onChange={setTab} milestone={milestone} />
			{milestone < requiredMilestone ?
				<EmptyState icon="🔒" title="Special system sealed" description={`Unlocks at Milestone ${requiredMilestone}.`} />
			: tab === 'generation' ?
				<ItemList items={SPECIAL_GENERATORS} />
			: tab === 'incinerator' ?
				<Incinerator />
			:	<Convertor />}
		</>
	);
}

function Incinerator() {
	const incinerator = useProductionSpecialStore(state => state.incinerator);
	const population = useWorldStore(state => state.populationStore);
	return (
		<>
			<Card accent="crimson">
				<SectionTitle title="Primordial Incinerator" detail={`Level ${incinerator.level} · ${formatDuration(incinerator.fuelSeconds)} fuel`} />
				<Text style={uiStyles.body}>
					Zombie effect ×{incinerator.getZombieEffect().toFixed(2)} · Cyborg effect ×{incinerator.getCyborgEffect().toFixed(2)}
				</Text>
				<View style={uiStyles.wrap}>
					{!incinerator.unlocked ?
						<ActionButton label="Unlock" onPress={incinerator.unlock} />
					:	<>
							<ActionButton label="Fuel 30 min" onPress={() => incinerator.fuel(30)} />
							<ActionButton tone="secondary" label="Upgrade" onPress={incinerator.upgrade} />
						</>
					}
				</View>
			</Card>
			<Card>
				<SectionTitle title="Population threats" detail={`Zombies ${formatDecimal(population.zombies)} · Cyborgs ${formatDecimal(population.cyborgs)}`} />
				<View style={styles.itemList}>
					<Ability title="Plasma Nuke" unlocked={incinerator.nukeUnlocked} onUnlock={incinerator.unlockNuke} onUse={incinerator.useNuke} />
					<Ability title="Cyber Hack" unlocked={incinerator.cyberHackUnlocked} onUnlock={incinerator.unlockCyberHack} onUse={incinerator.useCyberHack} />
					<Ability title="Angry Virus" unlocked={incinerator.angryVirusUnlocked} onUnlock={incinerator.unlockAngryVirus} onUse={incinerator.useAngryVirus} />
				</View>
			</Card>
		</>
	);
}
function Ability({ title, unlocked, onUnlock, onUse }: { title: string; unlocked: boolean; onUnlock: () => boolean; onUse: () => boolean }) {
	return (
		<View style={styles.ability}>
			<Text style={styles.itemName}>{title}</Text>
			<ActionButton compact tone={unlocked ? 'danger' : 'quiet'} label={unlocked ? 'Activate' : 'Unlock'} onPress={unlocked ? onUse : onUnlock} />
		</View>
	);
}

function Convertor() {
	const { converter, spellInventory } = useProductionSpecialStore(useShallow(state => ({ converter: state.convertor, spellInventory: state.spells.spellInventory })));
	const { ageDays, bestDragonAge } = useWorldStore(useShallow(state => ({ ageDays: state.resourceStore.dragon.ageDays, bestDragonAge: state.dragonStore.bestDragonAge })));
	const [darkPlasmaAmount, setDarkPlasmaAmount] = useState('1');
	const [spellMode, setSpellMode] = useState<SpellConversionMode>('next-size');
	const [selectedSpellIds, setSelectedSpellIds] = useState<string[]>([]);
	const erosUses = converter.erosConversionDate === new Date().toISOString().slice(0, 10) ? converter.erosConversionsToday : 0;
	const erosPlasmaCost = decimal(4).pow(erosUses);
	const agePlasmaCost = decimal(4).pow(Math.floor(ageDays));
	const spellModeCopy: Record<SpellConversionMode, string> = {
		'next-size': '3 same-type spells → 1 next size (up to Titanic)',
		mega: 'All 6 different types at one size → 1 Mega spell',
		'next-mega-size': '3 same-type Mega spells → 1 next-size Mega',
		split: '1 spell → 2 spells of the next smaller size',
		'divine-upgrade': 'Divine I → Impossible or Divine II → Infinity',
	};
	const toggleSpell = (id: string) => setSelectedSpellIds(current => current.includes(id) ? current.filter(selected => selected !== id) : [...current, id]);
	const convertSelectedSpells = () => {
		if (converter.convertSpells(spellMode, selectedSpellIds)) setSelectedSpellIds([]);
	};
	return (
		<View style={styles.itemList}>
			<Card accent="violet">
				<SectionTitle title="The Convertor" detail="Uses Quarks to reshape special currencies and spells. Converted outputs never increase lifetime, Armageddon, or Transcension earned totals." />
				<Text style={uiStyles.body}>Choose a mode below. The converter is available after the Primordial Convertor monument is active.</Text>
			</Card>
			<Card>
				<SectionTitle title="Special Plasma → Plasma" detail="Choose a special plasma source when one is available. This currency is not currently generated in the resource model." />
				<Text style={uiStyles.muted}>The source picker will appear here when a special plasma type is unlocked; no conversion rate is invented until that source is defined.</Text>
			</Card>
			<Card>
				<SectionTitle title="Dark Plasma → Dark Energy" detail="1 Quark + N Dark Plasma → N × 100 Dark Energy" />
				<View style={styles.converterInputRow}>
					<TextInput value={darkPlasmaAmount} onChangeText={setDarkPlasmaAmount} keyboardType="decimal-pad" style={styles.converterInput} />
					<Text style={uiStyles.body}>Dark Plasma</Text>
					<ActionButton compact label="Convert" onPress={() => converter.convertDarkPlasmaToDarkEnergy(Number(darkPlasmaAmount))} />
				</View>
			</Card>
			<Card>
				<SectionTitle title="Quark exchange" detail="Nano-Quarks are displayed as Micro-Quarks in the current resource model." />
				<View style={styles.ability}><Text style={styles.itemName}>1 Quark → 10,000 Micro-Quarks</Text><ActionButton compact label="Convert" onPress={converter.convertQuarkToMicroQuarks} /></View>
				<View style={styles.ability}><Text style={styles.itemName}>1 Shard + 1,000,000 Micro-Quarks → 1 Quark</Text><ActionButton compact label="Convert" onPress={converter.convertMicroQuarksToQuark} /></View>
			</Card>
			<Card>
				<SectionTitle title="Spell Conversion Mode" detail={`${spellModeCopy[spellMode]} · 1 Quark per conversion`} />
				<View style={uiStyles.wrap}>{(Object.keys(spellModeCopy) as SpellConversionMode[]).map(mode => <Chip key={mode} label={modeCopyLabel(mode)} selected={spellMode === mode} onPress={() => { setSpellMode(mode); setSelectedSpellIds([]); }} />)}</View>
				{spellInventory.length ?
					<View style={uiStyles.wrap}>{spellInventory.map(spell => <Chip key={spell.id} label={`${spell.name} · ${SPELL_SIZES[spell.size - 1]?.name ?? spell.size}`} selected={selectedSpellIds.includes(spell.id)} onPress={() => toggleSpell(spell.id)} />)}</View>
				:	<EmptyState icon="✧" title="No spells in the backpack" description="Create or earn spells before using spell conversion." />}
				<ActionButton label={`Convert selected (${selectedSpellIds.length})`} disabled={!selectedSpellIds.length} onPress={convertSelectedSpells} />
			</Card>
			<Card accent="gold">
				<SectionTitle title="Eros Conversion" detail="Requires Eros · 5 Quarks + Plasma → -1 Fury. The Plasma cost quadruples with each use today." />
				<View style={styles.ability}><Text style={styles.itemName}>Cost this day: {formatDecimal(erosPlasmaCost)} Plasma</Text><ActionButton compact label="Reduce Fury" onPress={converter.convertPlasmaToFury} /></View>
				<Text style={uiStyles.muted}>Used today: {erosUses}. Fury cannot be restored into shields through this conversion.</Text>
			</Card>
			<Card accent="blue">
				<SectionTitle title="Chronos Conversion" detail="Requires Chronos · 10 Quarks + 4^(current age number) Plasma → +1 Age, up to your best age." />
				<View style={styles.ability}><Text style={styles.itemName}>Cost now: {formatDecimal(agePlasmaCost)} Plasma · Age {formatDecimal(ageDays)} / {formatDecimal(bestDragonAge)}</Text><ActionButton compact label="Advance Age" disabled={ageDays >= bestDragonAge} onPress={converter.convertPlasmaToAge} /></View>
			</Card>
		</View>
	);
}

const modeCopyLabel = (mode: SpellConversionMode) => ({
	'next-size': 'Next size',
	mega: 'Make Mega',
	'next-mega-size': 'Next Mega',
	split: 'Split spell',
	'divine-upgrade': 'Divine upgrade',
}[mode]);

function Upgrades() {
	const [tab, setTab] = useState<UpgradeTab>('amplifier');
	const split = Math.ceil(PRODUCER_UPGRADES.length / 2);
	const items =
		tab === 'amplifier' ? ENERGY_UPGRADES.filter(item => !item.id.startsWith('crimson-'))
		: tab === 'producer1' ? PRODUCER_UPGRADES.slice(0, split)
		: tab === 'producer2' ? PRODUCER_UPGRADES.slice(split)
		: tab === 'boosts' ? APOCALYPSE_BOOST_UPGRADES
		: [];
	return (
		<>
			<PageIntro eyebrow="Dark energy" title="Upgrades" description="Permanent unlocks, activations, efficiencies, and the machine-to-dragon evolution path." />
			<TabStrip tabs={UPGRADE_TABS} value={tab} onChange={setTab} />
			{tab === 'evolution' ?
				<Evolution />
			:	<ItemList items={items} />}
		</>
	);
}

function Evolution() {
	const producerStore = useProductionStore(state => state.producerStore);
	return (
		<View style={styles.itemList}>
			{PRODUCERS.map(producer => {
				const progress = producerStore.progress[producer.id] ?? { durability: producer.baseDurability * 100, quantumGrowths: 0, evolutions: 0, metamorphosed: false };
				return (
					<Card key={producer.id} accent={progress.metamorphosed ? 'gold' : undefined}>
						<SectionTitle title={getProducerDisplayName(producer, progress)} detail={`${progress.quantumGrowths} Quantum Growths · ${progress.evolutions} Evolutions`} />
						<Text style={uiStyles.muted}>{producer.metamorphosis.specialEffect}</Text>
						<View style={uiStyles.wrap}>
							<ActionButton compact label="Quantum Growth" onPress={() => producerStore.grow(producer.id)} />
							<ActionButton compact tone="secondary" label="Evolution Serum" onPress={() => producerStore.evolve(producer.id)} />
							<ActionButton compact tone="danger" disabled={progress.metamorphosed} label={progress.metamorphosed ? 'Metamorphosed' : 'Metamorphose'} onPress={() => producerStore.metamorphose(producer.id)} />
						</View>
					</Card>
				);
			})}
		</View>
	);
}

function Prestige() {
	const [tab, setTab] = useState<PrestigeTab>('armageddon');
	const prestige = usePrestigeStore(
		useShallow(state => ({
			respecApocalypseUpgrades: state.respecApocalypseUpgrades,
			titanomachyActive: state.titanomachyActive,
			tartarusActive: state.tartarusActive,
			setTitanomachyActive: state.setTitanomachyActive,
			setTartarusActive: state.setTartarusActive,
		})),
	);
	return (
		<>
			<PageIntro eyebrow="Beyond the world" title="Prestige & Pantheons" description="Sacrifice a run for Plasma, transcend for Dark Plasma and Anomalies, then negotiate with gods and Titans." />
			<TabStrip tabs={PRESTIGE_TABS} value={tab} onChange={setTab} />
			{tab === 'armageddon' ?
				<Armageddon />
			: tab === 'transcension' ?
				<Transcension />
			: tab === 'olympians' ?
				<>
					<ItemList items={[...DEITIES, ...FORGES.filter(item => item.forgeTarget === 'deity')]} />
				</>
			: tab === 'titans' ?
				<ItemList items={[...TITANS, ...FORGES.filter(item => item.forgeTarget === 'titan')]} />
			: tab === 'respec' ?
				<Card>
					<SectionTitle title="Respec Monolith" detail="Refund eligible upgrade families without erasing the world." />
					<ActionButton tone="secondary" label="Respec Apocalypse upgrades" onPress={prestige.respecApocalypseUpgrades} />
				</Card>
			:	<Card accent="violet">
					<SectionTitle title="Titanomachy & Tartarus" detail="A dangerous accord between Olympians and Titans." />
					<Text style={uiStyles.body}>
						Titanomachy: {prestige.titanomachyActive ? 'active' : 'inactive'} · Tartarus: {prestige.tartarusActive ? 'open' : 'sealed'}
					</Text>
					<View style={uiStyles.wrap}>
						<ActionButton label={prestige.titanomachyActive ? 'End Titanomachy' : 'Begin Titanomachy'} onPress={() => prestige.setTitanomachyActive(!prestige.titanomachyActive)} />
						<ActionButton tone="danger" label={prestige.tartarusActive ? 'Seal Tartarus' : 'Open Tartarus'} onPress={() => prestige.setTartarusActive(!prestige.tartarusActive)} />
					</View>
				</Card>
			}
		</>
	);
}

function Armageddon() {
	const prestige = usePrestigeStore(
		useShallow(state => ({
			armageddonCount: state.armageddonCount,
			commitArmageddon: state.commitArmageddon,
			apocalypseLevels: state.apocalypseLevels,
			selectedApocalypse: state.selectedApocalypse,
			upgradeApocalypse: state.upgradeApocalypse,
			setSelectedApocalypse: state.setSelectedApocalypse,
		})),
	);
	const resources = useWorldStore(state => state.resourceStore.resources);
	return (
		<>
			<Card accent="crimson">
				<SectionTitle title="Commit Armageddon" detail={`Run ${prestige.armageddonCount + 1} · converts accumulated Energy into Plasma`} />
				<Text style={styles.prestigeNumber}>{formatDecimal(resources.energy)} Energy</Text>
				<ActionButton tone="danger" label="Commit Armageddon" onPress={prestige.commitArmageddon} />
			</Card>
			<Card>
				<SectionTitle title="Apocalypse types" detail="Upgrade independently; combine their earned effects." />
				{(Object.keys(prestige.apocalypseLevels) as (keyof typeof prestige.apocalypseLevels)[]).map(type => (
					<View key={type} style={styles.ability}>
						<View>
							<Text style={styles.itemName}>{type}</Text>
							<Text style={uiStyles.muted}>Level {prestige.apocalypseLevels[type]}</Text>
						</View>
						<ActionButton compact tone={prestige.selectedApocalypse === type ? 'primary' : 'quiet'} label={prestige.selectedApocalypse === type ? 'Upgrade' : 'Select'} onPress={() => (prestige.selectedApocalypse === type ? prestige.upgradeApocalypse(type) : prestige.setSelectedApocalypse(type))} />
					</View>
				))}
			</Card>
			<MonumentBars />
		</>
	);
}
function MonumentBars() {
	const store = useProductionSpecialStore(state => state.monuments);
	return (
		<Card accent="gold">
			<SectionTitle title="Primordial shrines" detail="Fuelable boosts remain independent from Crimson Heart and spell effects." />
			{FUELABLE_MONUMENT_IDS.map(id => (
				<View key={id} style={styles.monument}>
					<View style={{ flex: 1 }}>
						<Text style={styles.itemName}>{id}</Text>
						<ProgressBar value={store.fuelSeconds[id]} max={store.getFuelCapacitySeconds(id)} color={colors.gold} label={`Level ${store.upgradeLevels[id]} · ${formatDuration(store.fuelSeconds[id])}`} />
					</View>
					<ActionButton compact label="Fuel" onPress={() => store.fuelMonument(id)} />
				</View>
			))}
		</Card>
	);
}
function Transcension() {
	const prestige = usePrestigeStore(useShallow(state => ({ transcensionCount: state.transcensionCount, commitTranscension: state.commitTranscension })));
	const resources = useWorldStore(state => state.resourceStore.resources);
	return (
		<>
			<Card accent="violet">
				<SectionTitle title="Transcension" detail={`Transcensions ${prestige.transcensionCount} · reset deep progression for permanent currencies.`} />
				<Text style={styles.prestigeNumber}>{formatDecimal(resources.plasma)} Plasma</Text>
				<ActionButton tone="danger" label="Transcend" onPress={prestige.commitTranscension} />
			</Card>
			<MonumentBars />
		</>
	);
}

const formatDuration = (seconds: number) => (seconds < 60 ? `${Math.floor(seconds)}s` : `${Math.floor(seconds / 60)}m`);
