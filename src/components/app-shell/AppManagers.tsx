import { useOfflineProgressStore } from '@/store/store-offline-progress/_useOfflineProgressStore';
import { useOnlineProgressStore } from '@/store/store-online-progress/_useOnlineProgressStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import { useAppStore } from '@/store/useAppStore';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

const MAX_LIVE_STEP_SECONDS = 5;

/** One global clock owns online progress. Screens never create competing intervals. */
function NewGameManager() {
	const hasEntered = useAppStore(state => state.hasEntered);
	useEffect(() => {
		if (!hasEntered) return;
		let previous = Date.now();
		const interval = setInterval(() => {
			const now = Date.now();
			const seconds = Math.min(MAX_LIVE_STEP_SECONDS, Math.max(0, (now - previous) / 1_000));
			previous = now;
			useOnlineProgressStore.getState().tickWorld(seconds);
		}, 1_000);
		return () => clearInterval(interval);
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
	return (
		<>
			<NewGameManager />
			<NewOfflineManager />
		</>
	);
}
