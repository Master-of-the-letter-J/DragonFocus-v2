import { useOfflineProgressStore } from '@/store/store-offline-progress/_useOfflineProgressStore';
import { useOnlineProgressStore } from '@/store/store-online-progress/_useOnlineProgressStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import { useAppStore } from '@/store/useAppStore';
import { useProductivityStore } from '@/store/store-productivity/_useProductivityStore';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDecimal, setDefaultDecimalFormat } from '@/utils/decimal';
import { GOVERNMENT_LOGS } from '@/data/world-data/government-logs';
import { MILESTONES, milestoneForEnergy } from '@/data/world-data/milestones';
import { dragonTheme } from '@/constants/dragon-theme';
import { unlockedPageNoticeIds } from '@/data/world-data/page-unlocks';

const subscribeAppHydration = (notify: () => void) => {
	const stopStart = useAppStore.persist.onHydrate(notify);
	const stopFinish = useAppStore.persist.onFinishHydration(notify);
	return () => { stopStart(); stopFinish(); };
};
const subscribeWorldHydration = (notify: () => void) => {
	const stopStart = useWorldStore.persist.onHydrate(notify);
	const stopFinish = useWorldStore.persist.onFinishHydration(notify);
	return () => { stopStart(); stopFinish(); };
};

function useUnlockStoresHydrated() {
	const appHydrated = useSyncExternalStore(subscribeAppHydration, useAppStore.persist.hasHydrated, () => true);
	const worldHydrated = useSyncExternalStore(subscribeWorldHydration, useWorldStore.persist.hasHydrated, () => true);
	return appHydrated && worldHydrated;
}

/** One global clock owns online progress. Screens never create competing intervals. */
function NewGameManager() {
	const hasEntered = useAppStore(state => state.hasEntered);
	const updateFrequencyHz = useAppStore(state => state.progressUpdateFrequencyHz);
	useEffect(() => {
		if (!hasEntered) return;
		const requestedIntervalMs = 1_000 / updateFrequencyHz;
		let previousCommit = Date.now();
		let nextCommit = previousCommit + requestedIntervalMs;
		let active = AppState.currentState === 'active';
		let frame: number;
		const runFrame = () => {
			const now = Date.now();
			if (active && now >= nextCommit) {
				const seconds = Math.max(0, (now - previousCommit) / 1_000);
				previousCommit = now;
				const intervalsElapsed = Math.max(1, Math.floor((now - nextCommit) / requestedIntervalMs) + 1);
				nextCommit += intervalsElapsed * requestedIntervalMs;
				useWorldStore.getState().optionsStore.processGameModeTimer(new Date(now));
				useOnlineProgressStore.getState().tickWorld(seconds);
			}
			frame = requestAnimationFrame(runFrame);
		};
		frame = requestAnimationFrame(runFrame);
		const subscription = AppState.addEventListener('change', state => {
			active = state === 'active';
			previousCommit = Date.now();
			nextCommit = previousCommit + requestedIntervalMs;
		});
		return () => {
			cancelAnimationFrame(frame);
			subscription.remove();
		};
	}, [hasEntered, updateFrequencyHz]);
	return null;
}

/** AppState transitions delimit one O(1) offline progression calculation. */
function NewOfflineManager() {
	const hasEntered = useAppStore(state => state.hasEntered);
	const stateRef = useRef<AppStateStatus>(AppState.currentState);
	useEffect(() => {
		if (!hasEntered) return;
		useOnlineProgressStore.getState().giveOfflineProgress();
		const subscription = AppState.addEventListener('change', nextState => {
			const previous = stateRef.current;
			stateRef.current = nextState;
			if (nextState === 'background' || nextState === 'inactive') {
				useOfflineProgressStore.getState().markBackgrounded();
				useWorldStore.getState().optionsStore.setActivity('off-app');
			} else if (nextState === 'active' && previous !== 'active') {
				useOnlineProgressStore.getState().giveOfflineProgress();
				useWorldStore.getState().optionsStore.setActivity('idle');
				useAppStore.getState().markOpened();
			}
		});
		return () => subscription.remove();
	}, [hasEntered]);
	return null;
}

export function AppManagers() {
	const numberFormat = useAppStore(state => state.numberFormat);
	setDefaultDecimalFormat(numberFormat);
	const hasEntered = useAppStore(state => state.hasEntered);
	const seen = useAppStore(state => state.seenGovernmentLogIds);
	const noticesInitialized = useAppStore(state => state.pageUnlockNoticesInitialized);
	const dragonSpawned = useWorldStore(state => state.dragonStore.dragonSpawned);
	const dragon = useWorldStore(state => state.resourceStore.dragon);
	const totalEnergy = useWorldStore(state => state.resourceStore.totalAllTime.energy);
	const milestone = milestoneForEnergy(totalEnergy);
	const unlockStoresHydrated = useUnlockStoresHydrated();
	const specialReward = useProductivityStore(state => state.goals.specialRewardNotifications[0]);
	const [buriedDeathKey, setBuriedDeathKey] = useState<string>();
	useEffect(() => {
		if (!unlockStoresHydrated || !hasEntered || noticesInitialized) return;
		useAppStore.getState().initializePageUnlockNotices(unlockedPageNoticeIds(milestone, dragonSpawned));
	}, [dragonSpawned, hasEntered, milestone, noticesInitialized, unlockStoresHydrated]);
	useEffect(() => {
		if (!unlockStoresHydrated || !hasEntered) return;
		for (const reached of MILESTONES) {
			if (reached.id > 0 && reached.id <= milestone) useWorldStore.getState().claimMilestone(reached.id);
		}
	}, [hasEntered, milestone, unlockStoresHydrated]);
	const log = hasEntered ? GOVERNMENT_LOGS.find(item => !seen.includes(item.id) && milestone >= item.milestone && (!item.requiresDragon || dragonSpawned)) : undefined;
	const deathKey = dragon.lastDeathAt ?? `${dragon.name}-${dragon.ageDays}`;
	const lifecyclePhase = !unlockStoresHydrated || !hasEntered ? undefined
		: !dragonSpawned ? 'spawn'
		: !dragon.isAlive ? buriedDeathKey === deathKey ? 'respawn' : 'bury'
		: undefined;
	const lifecycleCopy = lifecyclePhase === 'spawn' ? {
		eyebrow: 'CLASSIFIED NEXUS',
		glyph: '◇',
		title: 'Spawn Your Dragon',
		body: 'The government Nexus has detected your signal. Spawn your dragon to awaken Energy production and open the rest of Dragon Focus.',
		button: 'Spawn Dragon',
	} : lifecyclePhase === 'bury' ? {
		eyebrow: 'DRAGON FALLEN',
		glyph: '♢',
		title: `Bury ${dragon.name}`,
		body: `${dragon.name} fell at age ${dragon.ageDays.toFixed(1)} days${dragon.deathReason ? ` after ${dragon.deathReason === 'fury' ? 'Fury reached mass destruction' : 'the population collapsed'}` : ''}. Their record has been carved into the Dragon Graveyard.`,
		button: 'Bury Dragon',
	} : lifecyclePhase === 'respawn' ? {
		eyebrow: 'THE NEXUS ANSWERS',
		glyph: '✦',
		title: 'Respawn Your Dragon',
		body: 'The burial is complete. Call your dragon back through the Nexus with Fury cleared and temporary population-recovery grace.',
		button: 'Respawn Dragon',
	} : undefined;
	const handleLifecycleAction = () => {
		if (lifecyclePhase === 'spawn') useWorldStore.getState().dragonStore.spawnDragon();
		else if (lifecyclePhase === 'bury') setBuriedDeathKey(deathKey);
		else if (lifecyclePhase === 'respawn') useWorldStore.getState().dragonStore.reviveDragon();
	};
	return (
		<>
			<NewGameManager />
			<NewOfflineManager />
			<Modal visible={Boolean(lifecycleCopy)} transparent animationType="fade" onRequestClose={() => undefined}>
				<View style={managerStyles.scrim}>
					<View style={[managerStyles.card, lifecyclePhase !== 'spawn' && managerStyles.deathCard]}>
						<Text style={managerStyles.lifecycleGlyph}>{lifecycleCopy?.glyph}</Text>
						<Text style={managerStyles.eyebrow}>{lifecycleCopy?.eyebrow}</Text>
						<Text style={managerStyles.title}>{lifecycleCopy?.title}</Text>
						<Text style={managerStyles.body}>{lifecycleCopy?.body}</Text>
						<Pressable accessibilityRole="button" style={managerStyles.button} onPress={handleLifecycleAction}>
							<Text style={managerStyles.buttonText}>{lifecycleCopy?.button}</Text>
						</Pressable>
					</View>
				</View>
			</Modal>
			<Modal visible={!lifecycleCopy && Boolean(log)} transparent animationType="fade">
				<View style={managerStyles.scrim}><View style={managerStyles.card}><Text style={managerStyles.eyebrow}>SECRET GOVERNMENT LOG</Text><Text style={managerStyles.title}>{log?.title}</Text><Text style={managerStyles.body}>{log?.body}</Text><Pressable style={managerStyles.button} onPress={() => log && useAppStore.getState().dismissGovernmentLog(log.id)}><Text style={managerStyles.buttonText}>Acknowledge</Text></Pressable></View></View>
			</Modal>
			<Modal visible={!lifecycleCopy && Boolean(specialReward) && !log} transparent animationType="fade" onRequestClose={() => useProductivityStore.getState().goals.dismissSpecialRewardNotification()}>
				<View style={managerStyles.scrim}>
					<View style={managerStyles.card}>
						<Text style={managerStyles.eyebrow}>SPECIAL REWARD HARVESTED</Text>
						<Text style={managerStyles.title}>{specialReward?.title}</Text>
						<Text style={managerStyles.body}>Completed automatically · Streak {specialReward?.streak ?? 0}</Text>
						<View style={managerStyles.rewards}>
							{specialReward && specialReward.reward.xp !== '0' ? <Text style={managerStyles.reward}>✦ +{formatDecimal(specialReward.reward.xp)} Goal Power XP</Text> : null}
							{specialReward && specialReward.reward.darkEnergy !== '0' ? <Text style={managerStyles.reward}>◈ +{formatDecimal(specialReward.reward.darkEnergy)} Dark Energy</Text> : null}
							{specialReward && specialReward.reward.shards !== '0' ? <Text style={managerStyles.reward}>◆ +{formatDecimal(specialReward.reward.shards)} Crimson Shards</Text> : null}
						</View>
						<Pressable style={managerStyles.button} onPress={() => useProductivityStore.getState().goals.dismissSpecialRewardNotification()}><Text style={managerStyles.buttonText}>Collect</Text></Pressable>
					</View>
				</View>
			</Modal>
		</>
	);
}

const managerStyles = StyleSheet.create({
	scrim: { flex: 1, backgroundColor: '#050308E8', justifyContent: 'center', padding: 24 },
	card: { backgroundColor: dragonTheme.colors.canvasRaised, borderColor: dragonTheme.colors.gold, borderWidth: 1, borderRadius: 20, padding: 24, gap: 16 },
	deathCard: { borderColor: dragonTheme.colors.crimsonBright },
	lifecycleGlyph: { color: dragonTheme.colors.gold, fontSize: 44, lineHeight: 50, textAlign: 'center' },
	eyebrow: { color: dragonTheme.colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
	title: { color: dragonTheme.colors.ink, fontSize: 24, fontWeight: '800' },
	body: { color: dragonTheme.colors.muted, fontSize: 15, lineHeight: 23 },
	rewards: { gap: 8, paddingVertical: 4 },
	reward: { color: dragonTheme.colors.ink, fontSize: 16, fontWeight: '700' },
	button: { backgroundColor: dragonTheme.colors.crimson, borderRadius: 12, padding: 14, alignItems: 'center' },
	buttonText: { color: dragonTheme.colors.ink, fontWeight: '700' },
});
