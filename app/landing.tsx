import { ActionButton } from '@/components/ui/DragonUI';
import { styles } from '@/components/pages/landing/landing.styles';
import { useAppStore } from '@/store/useAppStore';
import { router } from 'expo-router';
import { Image, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

export default function LandingRoute() {
	const startGame = useAppStore(state => state.startGame);
	const left = useSharedValue(0);
	const right = useSharedValue(0);
	const content = useSharedValue(1);
	const leftStyle = useAnimatedStyle(() => ({ transform: [{ translateX: `${-left.value * 100}%` }] }));
	const rightStyle = useAnimatedStyle(() => ({ transform: [{ translateX: `${right.value * 100}%` }] }));
	const contentStyle = useAnimatedStyle(() => ({ opacity: content.value, transform: [{ scale: 0.96 + content.value * 0.04 }] }));
	const enter = () => {
		startGame();
		// Reanimated shared values are intentionally mutable animation handles.
		// eslint-disable-next-line react-hooks/immutability
		content.value = withTiming(0, { duration: 260 });
		left.value = withDelay(100, withTiming(1, { duration: 850, easing: Easing.inOut(Easing.cubic) }));
		right.value = withDelay(100, withTiming(1, { duration: 850, easing: Easing.inOut(Easing.cubic) }));
		setTimeout(() => router.replace('/(_tabs)/lair?tab=nexus'), 760);
	};
	return (
		<View style={styles.root}>
			<View style={styles.emberTop} />
			<Animated.View entering={FadeIn.duration(800)} style={[styles.center, contentStyle]}>
				<Text style={styles.eyebrow}>AN INTENTIONAL WORLD</Text>
				<Image source={require('@/assets/images/dragon-stages/dragon.png')} resizeMode="contain" style={styles.dragon} />
				<Text style={styles.title}>Dragon Focus</Text>
				<Text style={styles.subtitle}>Turn focus into fire. Build a world worth protecting.</Text>
				<View style={styles.action}>
					<ActionButton label="Enter Dragon Focus" onPress={enter} />
				</View>
			</Animated.View>
			<Animated.View pointerEvents="none" style={[styles.door, styles.leftDoor, leftStyle]}>
				<View style={styles.doorLine} />
			</Animated.View>
			<Animated.View pointerEvents="none" style={[styles.door, styles.rightDoor, rightStyle]}>
				<View style={styles.doorLine} />
			</Animated.View>
		</View>
	);
}
