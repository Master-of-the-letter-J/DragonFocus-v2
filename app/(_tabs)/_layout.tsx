import { Tabs } from 'expo-router';
import { BottomTabIcon } from '@/components/app-shell/BottomTabIcon';
import { dragonTheme } from '@/constants/dragon-theme';
import { useProductivityStore } from '@/store/store-productivity/_useProductivityStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import { useAppStore } from '@/store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { hasUnvisitedPageInSection } from '@/data/world-data/page-unlocks';
import { milestoneForEnergy } from '@/data/world-data/milestones';

export default function TabLayout() {
	const focusSessionActive = useProductivityStore(state => state.pomodoro.status !== 'idle');
	const { dragonSpawned, totalEnergy } = useWorldStore(useShallow(state => ({ dragonSpawned: state.dragonStore.dragonSpawned, totalEnergy: state.resourceStore.totalAllTime.energy })));
	const { noticesInitialized, seenNoticeIds, dismissNotice } = useAppStore(useShallow(state => ({
		noticesInitialized: state.pageUnlockNoticesInitialized,
		seenNoticeIds: state.seenPageUnlockNoticeIds,
		dismissNotice: state.dismissPageUnlockNotice,
	})));
	const milestone = milestoneForEnergy(totalEnergy);
	const earthWarning = noticesInitialized && hasUnvisitedPageInSection('earth', milestone, dragonSpawned, seenNoticeIds);
	const lairWarning = noticesInitialized && hasUnvisitedPageInSection('lair', milestone, dragonSpawned, seenNoticeIds);
	const scrollsWarning = noticesInitialized && hasUnvisitedPageInSection('archives', milestone, dragonSpawned, seenNoticeIds);
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarShowLabel: false,
				tabBarHideOnKeyboard: true,
				sceneStyle: { backgroundColor: dragonTheme.colors.canvas },
				tabBarStyle: { display: focusSessionActive ? 'none' : 'flex', position: 'absolute', height: 76, paddingTop: 8, paddingBottom: 14, backgroundColor: '#100D17F5', borderTopColor: dragonTheme.colors.line, borderTopWidth: 1, elevation: 0 },
			}}>
			<Tabs.Screen name="earth" listeners={{ tabPress: event => { if (!dragonSpawned) event.preventDefault(); else dismissNotice('earth'); }, focus: () => { if (dragonSpawned) dismissNotice('earth'); } }} options={{ title: 'The Earth', tabBarIcon: ({ focused }) => <BottomTabIcon symbol={dragonSpawned ? '◎' : '🔒'} label={dragonSpawned ? 'Earth' : 'Locked'} focused={focused && dragonSpawned} warning={earthWarning} /> }} />
			<Tabs.Screen name="lair" options={{ title: "Dragon's Lair", tabBarIcon: ({ focused }) => <BottomTabIcon symbol="♜" label="Lair" focused={focused} warning={lairWarning} /> }} />
			<Tabs.Screen name="archives" listeners={{ tabPress: event => { if (!dragonSpawned) event.preventDefault(); else dismissNotice('scrolls'); }, focus: () => { if (dragonSpawned) dismissNotice('scrolls'); } }} options={{ title: 'The Scrolls', tabBarIcon: ({ focused }) => <BottomTabIcon symbol={dragonSpawned ? '▤' : '🔒'} label={dragonSpawned ? 'Scrolls' : 'Locked'} focused={focused && dragonSpawned} warning={scrollsWarning} /> }} />
			<Tabs.Screen name="options" options={{ title: 'The Options', tabBarIcon: ({ focused }) => <BottomTabIcon symbol="⚙" label="Options" focused={focused} /> }} />
		</Tabs>
	);
}
