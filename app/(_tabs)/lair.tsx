import { styles } from '@/components/pages/lair/lair.styles';
import { DragonAppScreen } from '@/components/app-shell/DragonAppScreen';
import { LAIR_TABS, PRESTIGE_TABS, PRODUCTION_TABS, UPGRADE_TABS, type LairTab, type PrestigeTab, type ProductionTab, type UpgradeTab } from '@/components/pages/lair/lair-tabs';
import { ActionButton, Card, Chip, EmptyState, PageIntro, ProgressBar, SectionTitle, TabStrip, uiStyles } from '@/components/ui/DragonUI';
import { dragonTheme } from '@/constants/dragon-theme';
import { AMPLIFIERS, APOCALYPSE_BOOST_UPGRADES, DEITIES, ENERGY_UPGRADES, GOAL_MULTIPLIERS, PRODUCERS, PRODUCER_UPGRADES, SPECIAL_GENERATORS, TITANS, FORGES } from '@/data/production-data';
import type { ProductionItem } from '@/types/production.types';
import type { ResourceAmounts } from '@/types/resources.types';
import { useProductionStore, type ProductionStoreState } from '@/store/store-production/_useProductionStore';
import { getProducerDisplayName } from '@/store/store-production/createProducerSlice';
import { usePrestigeStore } from '@/store/store-prestige/_usePrestigeStore';
import { useProductionSpecialStore } from '@/store/store-production-special/_useProductionSpecialStore';
import { FUELABLE_MONUMENT_IDS } from '@/store/store-production-special/createMonumentsSlice';
import { useProductivityStore } from '@/store/store-productivity/_useProductivityStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import { useAppStore } from '@/store/useAppStore';
import { formatDecimal } from '@/utils/decimal';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

const { colors } = dragonTheme;
export default function LairRoute() {
	const params = useLocalSearchParams<{ tab?: LairTab }>();
	const [tab, setTab] = useState<LairTab>(LAIR_TABS.some(candidate => candidate.id === params.tab) ? params.tab! : 'nexus');
	const checkInRequired = useAppStore(state => state.requireDailyCheckIn);
	const checkedIn = useProductivityStore(state => state.surveys.checkInCompleted);
	const panel = tab === 'prestige' ? 'prestige' : 'resources';
	const gated = tab !== 'nexus' && checkInRequired && !checkedIn;
	return (
		<DragonAppScreen title="Dragon's Lair" panel={panel} effects>
			<TabStrip tabs={LAIR_TABS} value={tab} onChange={setTab} />
			{gated ?
				<Card accent="gold">
					<SectionTitle title="The Lair is sleeping" detail="Complete today’s check-in to wake production and prestige systems, or disable this gate in Options." />
					<ActionButton label="Begin check-in" onPress={() => router.push('/check-in-survey')} />
				</Card>
			: tab === 'nexus' ?
				<Nexus />
			: tab === 'production' ?
				<Production />
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
	const resources = useWorldStore(state => state.resourceStore.resources);
	const dragon = useWorldStore(state => state.resourceStore.dragon);
	const worldDragon = useWorldStore(state => state.dragonStore);
	const tap = useSharedValue(1);
	const animated = useAnimatedStyle(() => ({ transform: [{ scale: tap.value }] }));
	const source = stageSprites[dragon.stage as keyof typeof stageSprites] ?? require('@/assets/images/dragon-stages/dragon.png');
	return (
		<>
			<PageIntro eyebrow="The core" title="The Nexus" description="Your dragon is both companion and engine. Tap it to spark Energy and a little Fury." />
			<Card style={styles.energyHero}>
				<Text style={styles.metricLabel}>Current energy</Text>
				<Text style={styles.energy}>{formatDecimal(resources.energy)}</Text>
			</Card>
			<Pressable
				style={styles.dragonStage}
				onPress={() => {
					// Reanimated shared values are intentionally mutable animation handles.
					// eslint-disable-next-line react-hooks/immutability
					tap.value = withSequence(withSpring(0.92), withSpring(1.04), withSpring(1));
					worldDragon.clickDragon();
				}}>
				<View style={styles.dragonHalo} />
				<Animated.View style={[styles.dragonWrap, animated]}>
					<Image source={source} resizeMode="contain" style={styles.dragon} />
				</Animated.View>
				<Text style={styles.dragonName}>{dragon.name}</Text>
				<Text style={styles.dragonMeta}>
					{dragon.stage.replaceAll('-', ' ')} · age {dragon.ageDays.toFixed(2)} days
				</Text>
			</Pressable>
			<Card accent="crimson">
				<SectionTitle title="Dragon's Fury" detail={`${worldDragon.getFuryBand()} · ${worldDragon.angerShields.toFixed(0)} anger shields`} />
				<ProgressBar value={resources.fury.toNumber()} max={dragon.maxFury.toNumber()} color={colors.crimsonBright} label={`${formatDecimal(resources.fury)} / ${formatDecimal(dragon.maxFury)}`} />
			</Card>
			<Card>
				<SectionTitle title="Missions" detail="The mission board is being prepared." />
				<EmptyState icon="⌁" title="Coming in a future era" description="Missions will turn longer focus arcs into dragon-specific adventures." />
			</Card>
		</>
	);
}

function Production() {
	const [tab, setTab] = useState<ProductionTab>('producers');
	const [quantity, setQuantity] = useState(1);
	const items =
		tab === 'producers' ? PRODUCERS
		: tab === 'amplifiers' ? AMPLIFIERS
		: tab === 'goals' ? GOAL_MULTIPLIERS
		: tab === 'special' ? SPECIAL_GENERATORS
		: [];
	return (
		<>
			<PageIntro eyebrow="Energy systems" title="Production" description="Build from the core outward. Every output follows production × amplification × goal multiplier × other effects." />
			<TabStrip tabs={PRODUCTION_TABS} value={tab} onChange={setTab} />
			{items.length ?
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
			: tab === 'heart' ?
				<HeartUnlocks />
			: tab === 'incinerator' ?
				<Incinerator />
			:	<Convertor />}
		</>
	);
}

function ItemList({ items, quantity = 1 }: { items: readonly ProductionItem[]; quantity?: number }) {
	const store = useProductionStore(
		useShallow(state => ({
			levels: state.levels,
			producerStore: state.producerStore,
			getCost: state.getCost,
			getCosts: state.getCosts,
			canPurchase: state.canPurchase,
			purchase: state.purchase,
			sell: state.sell,
		})),
	);
	const resources = useWorldStore(state => state.resourceStore.resources);
	return (
		<View style={styles.itemList}>
			{items.map((item, index) => {
				const level = store.levels[item.id] ?? 0;
				const count = quantity === 999 ? maximumAffordable(store, item.id, resources) : quantity;
				const cost = store.getCost(item.id, count);
				const progress = store.producerStore.progress[item.id];
				return (
					<Animated.View key={item.id} entering={FadeInDown.delay(Math.min(index * 25, 250))}>
						<Card style={styles.itemCard}>
							<View style={styles.itemRow}>
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
									<Text style={styles.itemLevel}>LEVEL {level}</Text>
									<Text style={styles.itemName}>{progress && item.kind === 'producer' ? getProducerDisplayName(item as (typeof PRODUCERS)[number], progress) : item.name}</Text>
									<Text numberOfLines={2} style={uiStyles.muted}>
										{item.description}
									</Text>
									<Text style={styles.cost}>
										{formatDecimal(cost)} {item.costs[0]?.resource ?? 'resource'}
									</Text>
								</View>
								<View style={styles.itemActions}>
									<ActionButton compact label={quantity === 999 ? `Buy MAX (${count})` : `Buy ${count}`} disabled={!count || !store.canPurchase(item.id)} onPress={() => store.purchase(item.id, count)} />
									{item.kind === 'producer' || item.kind === 'amplifier' ?
										<ActionButton compact tone="quiet" label="Sell 1" disabled={!level} onPress={() => store.sell(item.id, 1)} />
									:	null}
								</View>
							</View>
						</Card>
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

function HeartUnlocks() {
	const heart = useProductionSpecialStore(state => state.crimsonHeart);
	const upgrades = ENERGY_UPGRADES.filter(item => item.id.includes('crimson'));
	return (
		<>
			<Card accent="crimson">
				<SectionTitle title="Crimson Heart" detail="Difficulty and Dragon Pact scale charge rate and maximum here, not as duplicate production/population multipliers." />
				<Text style={styles.heartNumber}>
					{heart.charge.toFixed(1)} / {heart.getMaximumCharge().toFixed(0)}%
				</Text>
				<ProgressBar value={heart.charge} max={heart.getMaximumCharge()} />
			</Card>
			<ItemList items={upgrades} />
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
	const converter = useProductionSpecialStore(state => state.convertor);
	const conversions = [
		['Dark Plasma → Dark Energy', () => converter.convertDarkPlasmaToDarkEnergy(1)],
		['Quark → 10K Micro-Quarks', converter.convertQuarkToMicroQuarks],
		['Micro-Quarks → Quark', converter.convertMicroQuarksToQuark],
		['Eros: Plasma → -1 Fury', converter.convertPlasmaToFury],
		['Chronos: Plasma → +1 Age', converter.convertPlasmaToAge],
	] as const;
	return (
		<Card accent="violet">
			<SectionTitle title="The Convertor" detail="Conversions do not count toward earned all-time totals." />
			{conversions.map(([label, action]) => (
				<View key={label} style={styles.ability}>
					<Text style={styles.itemName}>{label}</Text>
					<ActionButton compact label="Convert" onPress={action} />
				</View>
			))}
		</Card>
	);
}

function Upgrades() {
	const [tab, setTab] = useState<UpgradeTab>('amplifier');
	const split = Math.ceil(PRODUCER_UPGRADES.length / 2);
	const items =
		tab === 'amplifier' ? ENERGY_UPGRADES
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
	const prestige = usePrestigeStore(
		useShallow(state => ({ transcensionCount: state.transcensionCount, commitTranscension: state.commitTranscension })),
	);
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
