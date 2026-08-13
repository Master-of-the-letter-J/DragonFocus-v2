import { ActionButton } from '@/components/ui/DragonUI';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { useAppStore } from '@/store/useAppStore';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { router } from 'expo-router';

const { colors } = dragonTheme;
export default function LandingScreen() {
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
		setTimeout(() => router.replace('/(_tabs)/earth'), 760);
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

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: colors.canvas, overflow: 'hidden' },
	center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, zIndex: 2 },
	emberTop: { position: 'absolute', top: -180, alignSelf: 'center', width: 430, height: 430, borderRadius: 220, backgroundColor: '#32151E' },
	eyebrow: { color: colors.gold, fontFamily: appFonts.semibold, fontSize: 10, letterSpacing: 2.4 },
	dragon: { width: '100%', maxWidth: 390, height: 290 },
	title: { color: colors.ink, fontFamily: appFonts.black, fontSize: 42, letterSpacing: -1.8 },
	subtitle: { color: colors.muted, fontFamily: appFonts.regular, fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 320, marginTop: 8 },
	action: { width: '100%', maxWidth: 320, marginTop: 28 },
	door: { position: 'absolute', top: 0, bottom: 0, width: '50%', backgroundColor: '#130D15', borderColor: '#3E2838', zIndex: 1 },
	leftDoor: { left: 0, borderRightWidth: 2 },
	rightDoor: { right: 0, borderLeftWidth: 2 },
	doorLine: { position: 'absolute', top: '10%', bottom: '10%', width: 1, backgroundColor: '#70434A', right: 24 },
});
