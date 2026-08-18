import { useOfflineProgressStore } from '@/store/store-offline-progress/_useOfflineProgressStore';
import { useOnlineProgressStore } from '@/store/store-online-progress/_useOnlineProgressStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import { useAppStore } from '@/store/useAppStore';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { setDefaultDecimalFormat } from '@/utils/decimal';
import { GOVERNMENT_LOGS } from '@/data/world-data/government-logs';
import { milestoneForEnergy } from '@/data/world-data/milestones';
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
	useEffect(() => {
		if (!hasEntered) return;
		let previous = Date.now();
		let active = AppState.currentState === 'active';
		const interval = setInterval(() => {
			const now = Date.now();
			const seconds = active ? Math.max(0, (now - previous) / 1_000) : 0;
			previous = now;
			if (!active) return;
			useWorldStore.getState().optionsStore.processGameModeTimer(new Date(now));
			useOnlineProgressStore.getState().tickWorld(seconds);
		}, 1_000);
		const subscription = AppState.addEventListener('change', state => {
			active = state === 'active';
			previous = Date.now();
		});
		return () => {
			clearInterval(interval);
			subscription.remove();
		};
	}, [hasEntered]);
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
	const totalEnergy = useWorldStore(state => state.resourceStore.totalAllTime.energy);
	const milestone = milestoneForEnergy(totalEnergy);
	const unlockStoresHydrated = useUnlockStoresHydrated();
	useEffect(() => {
		if (!unlockStoresHydrated || !hasEntered || noticesInitialized) return;
		useAppStore.getState().initializePageUnlockNotices(unlockedPageNoticeIds(milestone, dragonSpawned));
	}, [dragonSpawned, hasEntered, milestone, noticesInitialized, unlockStoresHydrated]);
	const log = hasEntered ? GOVERNMENT_LOGS.find(item => !seen.includes(item.id) && milestone >= item.milestone && (!item.requiresDragon || dragonSpawned)) : undefined;
	return (
		<>
			<NewGameManager />
			<NewOfflineManager />
			<Modal visible={Boolean(log)} transparent animationType="fade">
				<View style={managerStyles.scrim}><View style={managerStyles.card}><Text style={managerStyles.eyebrow}>SECRET GOVERNMENT LOG</Text><Text style={managerStyles.title}>{log?.title}</Text><Text style={managerStyles.body}>{log?.body}</Text><Pressable style={managerStyles.button} onPress={() => log && useAppStore.getState().dismissGovernmentLog(log.id)}><Text style={managerStyles.buttonText}>Acknowledge</Text></Pressable></View></View>
			</Modal>
		</>
	);
}

const managerStyles = StyleSheet.create({
	scrim: { flex: 1, backgroundColor: '#050308E8', justifyContent: 'center', padding: 24 },
	card: { backgroundColor: dragonTheme.colors.canvasRaised, borderColor: dragonTheme.colors.gold, borderWidth: 1, borderRadius: 20, padding: 24, gap: 16 },
	eyebrow: { color: dragonTheme.colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
	title: { color: dragonTheme.colors.ink, fontSize: 24, fontWeight: '800' },
	body: { color: dragonTheme.colors.muted, fontSize: 15, lineHeight: 23 },
	button: { backgroundColor: dragonTheme.colors.crimson, borderRadius: 12, padding: 14, alignItems: 'center' },
	buttonText: { color: dragonTheme.colors.ink, fontWeight: '700' },
});
