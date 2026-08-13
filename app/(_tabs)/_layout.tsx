import { Tabs } from 'expo-router';
import { BottomTabIcon } from '@/components/app-shell/BottomTabIcon';
import { dragonTheme } from '@/constants/dragon-theme';
import { usePomodoroStore } from '@/store/store-productivity/createPomodoroSlice';

export default function TabLayout() {
	const focusSessionActive = usePomodoroStore(state => state.status !== 'idle');
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarShowLabel: false,
				tabBarHideOnKeyboard: true,
				sceneStyle: { backgroundColor: dragonTheme.colors.canvas },
				tabBarStyle: { display: focusSessionActive ? 'none' : 'flex', position: 'absolute', height: 76, paddingTop: 8, paddingBottom: 14, backgroundColor: '#100D17F5', borderTopColor: dragonTheme.colors.line, borderTopWidth: 1, elevation: 0 },
			}}>
			<Tabs.Screen name="earth" options={{ title: 'The Earth', tabBarIcon: ({ focused }) => <BottomTabIcon symbol="◎" label="Earth" focused={focused} /> }} />
			<Tabs.Screen name="lair" options={{ title: "Dragon's Lair", tabBarIcon: ({ focused }) => <BottomTabIcon symbol="♜" label="Lair" focused={focused} /> }} />
			<Tabs.Screen name="archives" options={{ title: 'The Scrolls', tabBarIcon: ({ focused }) => <BottomTabIcon symbol="▤" label="Scrolls" focused={focused} /> }} />
			<Tabs.Screen name="options" options={{ title: 'The Options', tabBarIcon: ({ focused }) => <BottomTabIcon symbol="⚙" label="Options" focused={focused} /> }} />
		</Tabs>
	);
}
