import { AppManagers } from '@/components/app-shell/AppManagers';
import { dragonTheme } from '@/constants/dragon-theme';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
	const [loaded] = useFonts({
		'Poppins-Regular': require('@/assets/fonts/Poppins-Regular.ttf'),
		'Poppins-Medium': require('@/assets/fonts/Poppins-Medium.ttf'),
		'Poppins-SemiBold': require('@/assets/fonts/Poppins-SemiBold.ttf'),
		'Poppins-Bold': require('@/assets/fonts/Poppins-Bold.ttf'),
		'Poppins-Black': require('@/assets/fonts/Poppins-Black.ttf'),
		SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
	});
	if (!loaded) return null;
	return (
		<GestureHandlerRootView style={{ flex: 1, backgroundColor: dragonTheme.colors.canvas }}>
			<StatusBar style="light" />
			<AppManagers />
			<Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: dragonTheme.colors.canvas }, animation: 'fade' }}>
				<Stack.Screen name="index" />
				<Stack.Screen name="landing" />
				<Stack.Screen name="(_tabs)" />
				<Stack.Screen name="check-in-survey" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
				<Stack.Screen name="check-out-survey" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
				<Stack.Screen name="focus-session" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
				<Stack.Screen name="tutorial" options={{ presentation: 'modal' }} />
			</Stack>
		</GestureHandlerRootView>
	);
}
