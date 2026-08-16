import { Tabs } from 'expo-router';
import { BottomTabIcon } from '@/components/app-shell/BottomTabIcon';
import { dragonTheme } from '@/constants/dragon-theme';
import { useProductivityStore } from '@/store/store-productivity/_useProductivityStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';

export default function TabLayout() {
	const focusSessionActive = useProductivityStore(state => state.pomodoro.status !== 'idle');
	const dragonSpawned = useWorldStore(state => state.dragonStore.dragonSpawned);
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarShowLabel: false,
				tabBarHideOnKeyboard: true,
				sceneStyle: { backgroundColor: dragonTheme.colors.canvas },
				tabBarStyle: { display: focusSessionActive ? 'none' : 'flex', position: 'absolute', height: 76, paddingTop: 8, paddingBottom: 14, backgroundColor: '#100D17F5', borderTopColor: dragonTheme.colors.line, borderTopWidth: 1, elevation: 0 },
			}}>
			<Tabs.Screen name="earth" listeners={{ tabPress: event => { if (!dragonSpawned) event.preventDefault(); } }} options={{ title: 'The Earth', tabBarIcon: ({ focused }) => <BottomTabIcon symbol={dragonSpawned ? '◎' : '🔒'} label={dragonSpawned ? 'Earth' : 'Locked'} focused={focused && dragonSpawned} /> }} />
			<Tabs.Screen name="lair" options={{ title: "Dragon's Lair", tabBarIcon: ({ focused }) => <BottomTabIcon symbol="♜" label="Lair" focused={focused} /> }} />
			<Tabs.Screen name="archives" listeners={{ tabPress: event => { if (!dragonSpawned) event.preventDefault(); } }} options={{ title: 'The Scrolls', tabBarIcon: ({ focused }) => <BottomTabIcon symbol={dragonSpawned ? '▤' : '🔒'} label={dragonSpawned ? 'Scrolls' : 'Locked'} focused={focused && dragonSpawned} /> }} />
			<Tabs.Screen name="options" options={{ title: 'The Options', tabBarIcon: ({ focused }) => <BottomTabIcon symbol="⚙" label="Options" focused={focused} /> }} />
		</Tabs>
	);
}
