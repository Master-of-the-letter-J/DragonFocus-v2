import { EffectsPanel } from '@/components/app-shell/EffectsPanel';
import { NewsBar } from '@/components/app-shell/NewsBar';
import { SecondaryPanel, type PanelMode } from '@/components/app-shell/SecondaryPanel';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { milestoneForEnergy } from '@/data/world-data/milestones';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import { useAppStore } from '@/store/useAppStore';
import { router } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect, useState } from 'react';

const { colors, radius, space } = dragonTheme;
const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);
const BACKGROUNDS = { nexus: colors.canvas, ember: '#1C0C0D', void: '#090713' } as const;

const menuItems = [
	['Check-in survey', '/check-in-survey'],
	['Check-out survey', '/check-out-survey'],
	['View goals', '/(_tabs)/earth?tab=active'],
	['View account', '/(_tabs)/archives?tab=pact'],
	['Game modes', '/(_tabs)/options?tab=general'],
	['Tutorial', '/tutorial'],
	['Snackbox market', '/(_tabs)/archives?tab=market'],
] as const;

const panelChoices: { id: PanelMode; label: string }[] = [
	{ id: 'world', label: 'World Panel' },
	{ id: 'population', label: 'Population Panel' },
	{ id: 'goals', label: 'Goals Panel' },
	{ id: 'resources', label: 'Production Panel' },
	{ id: 'spells', label: 'Spell Panel' },
];

export function DragonAppScreen({ title, panel, effects = false, children, scrollProps }: PropsWithChildren<{ title: string; panel: PanelMode; effects?: boolean; scrollProps?: ScrollViewProps }>) {
	const totalEnergy = useWorldStore(state => state.resourceStore.totalAllTime.energy);
	const backgroundStyle = useAppStore(state => state.backgroundStyle);
	const brightness = useAppStore(state => state.brightness);
	const weatherEffects = useAppStore(state => state.weatherEffects);
	const showNewsBar = useAppStore(state => state.showNewsBar);
	const spellsUnlocked = milestoneForEnergy(totalEnergy) >= 3;
	const tremor = useSharedValue(0);
	const brightnessPulse = useSharedValue(0);
	useEffect(() => {
		if (weatherEffects.tremors) tremor.value = withRepeat(withSequence(withTiming(-1, { duration: 90 }), withTiming(1, { duration: 90 }), withTiming(0, { duration: 90 })), -1);
		else {
			cancelAnimation(tremor);
			tremor.value = 0;
		}
		return () => cancelAnimation(tremor);
	}, [tremor, weatherEffects.tremors]);
	useEffect(() => {
		if (weatherEffects.brightness) brightnessPulse.value = withRepeat(withSequence(withTiming(0.06, { duration: 1_800 }), withTiming(0, { duration: 1_800 })), -1);
		else {
			cancelAnimation(brightnessPulse);
			brightnessPulse.value = 0;
		}
		return () => cancelAnimation(brightnessPulse);
	}, [brightnessPulse, weatherEffects.brightness]);
	const tremorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tremor.value }] }));
	const brightnessOverlayStyle = useAnimatedStyle(() => ({ opacity: Math.abs(brightness - 1) * 0.22 + brightnessPulse.value }));
	const [menuOpen, setMenuOpen] = useState(false);
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMode, setPanelMode] = useState(panel);
	return (
		<AnimatedSafeAreaView style={[styles.safe, { backgroundColor: BACKGROUNDS[backgroundStyle] }, tremorStyle]}>
			<Animated.View entering={FadeIn.duration(250)} style={styles.header}>
				<Pressable accessibilityRole="button" accessibilityLabel="Open menu" onPress={() => setMenuOpen(true)} style={styles.iconButton}>
					<Text style={styles.icon}>☰</Text>
				</Pressable>
				<View pointerEvents="none" style={styles.headerCenter}>
					<Text numberOfLines={1} style={styles.headerTitle}>{title}</Text>
				</View>
				<View style={styles.headerRight}>
					<Pressable accessibilityRole="button" accessibilityLabel="Configure information panel" onPress={() => setPanelOpen(true)} style={styles.iconButton}>
						<Text style={styles.panelIcon}>⚙</Text>
					</Pressable>
				</View>
			</Animated.View>
			<ScrollView
				{...scrollProps}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
				style={[styles.scroll, scrollProps?.style]}
				contentContainerStyle={[styles.scrollContent, scrollProps?.contentContainerStyle]}>
				<SecondaryPanel mode={panelMode} />
				{showNewsBar ? <NewsBar milestone={milestoneForEnergy(totalEnergy)} /> : null}
				{spellsUnlocked || effects ? <EffectsPanel /> : null}
				<Animated.View entering={FadeInDown.duration(320)} style={[styles.content, styles.contentInner]}>
					{children}
				</Animated.View>
			</ScrollView>
			<MenuModal visible={menuOpen} title="Command menu" onClose={() => setMenuOpen(false)}>
				{menuItems.map(([label, href]) => (
					<Pressable
						key={label}
						style={styles.menuRow}
						onPress={() => {
							setMenuOpen(false);
							router.push(href);
						}}>
						<Text style={styles.menuLabel}>{label}</Text>
						<Text style={styles.chevron}>›</Text>
					</Pressable>
				))}
			</MenuModal>
			<MenuModal visible={panelOpen} title="Information panel" onClose={() => setPanelOpen(false)}>
				{panelChoices.map(choice => (
					<Pressable
						key={choice.id}
						style={[styles.menuRow, choice.id === panelMode && styles.menuRowSelected]}
						onPress={() => {
							setPanelMode(choice.id);
							setPanelOpen(false);
						}}>
						<Text style={styles.menuLabel}>{choice.label}</Text>
						<Text style={styles.chevron}>{choice.id === panelMode ? '●' : '○'}</Text>
					</Pressable>
				))}
			</MenuModal>
			{weatherEffects.rain ? <Text pointerEvents="none" accessibilityElementsHidden style={styles.rain}>· ︙ · ︙ · ︙ · ︙ · ︙ ·{`\n`}︙ · ︙ · ︙ · ︙ · ︙{`\n`}· ︙ · ︙ · ︙ · ︙ ·{`\n`}︙ · ︙ · ︙ · ︙ · ︙</Text> : null}
			{brightness !== 1 || weatherEffects.brightness ? <Animated.View pointerEvents="none" style={[styles.brightnessOverlay, { backgroundColor: brightness > 1 || weatherEffects.brightness ? '#FFF4D7' : '#000' }, brightnessOverlayStyle]} /> : null}
		</AnimatedSafeAreaView>
	);
}

function MenuModal({ visible, title, onClose, children }: PropsWithChildren<{ visible: boolean; title: string; onClose: () => void }>) {
	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<Pressable style={styles.scrim} onPress={onClose}>
				<Pressable style={styles.drawer} onPress={event => event.stopPropagation()}>
					<View style={styles.drawerHeader}>
						<Text style={styles.drawerTitle}>{title}</Text>
						<Pressable onPress={onClose}>
							<Text style={styles.close}>×</Text>
						</Pressable>
					</View>
					{children}
				</Pressable>
			</Pressable>
		</Modal>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.canvas },
	header: { minHeight: 58, backgroundColor: colors.canvasRaised, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.md, borderBottomWidth: 1, borderBottomColor: colors.line },
	iconButton: { height: 42, minWidth: 42, borderRadius: radius.medium, justifyContent: 'center', alignItems: 'center' },
	icon: { color: colors.ink, fontSize: 22 },
	panelIcon: { color: colors.gold, fontSize: 28 },
	headerCenter: { position: 'absolute', top: 0, right: 64, bottom: 0, left: 64, alignItems: 'center', justifyContent: 'center' },
	headerTitle: { color: colors.ink, fontFamily: appFonts.bold, fontSize: 17, textAlign: 'center' },
	headerRight: { flexDirection: 'row', alignItems: 'center', zIndex: 1 },
	scroll: { flex: 1 },
	scrollContent: { paddingBottom: 120 },
	content: { paddingHorizontal: space.lg, paddingTop: space.lg },
	contentInner: { width: '100%', maxWidth: 820, alignSelf: 'center', gap: space.lg },
	scrim: { flex: 1, backgroundColor: '#050308D9', justifyContent: 'flex-end' },
	drawer: { backgroundColor: colors.canvasRaised, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: colors.line, padding: space.lg, paddingBottom: 34, gap: 5 },
	drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: space.md },
	drawerTitle: { color: colors.ink, fontFamily: appFonts.bold, fontSize: 21 },
	close: { color: colors.muted, fontSize: 28, paddingHorizontal: 8 },
	menuRow: { minHeight: 50, borderRadius: radius.medium, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.md },
	menuRowSelected: { backgroundColor: colors.crimsonSoft },
	menuLabel: { color: colors.ink, fontFamily: appFonts.medium, fontSize: 14 },
	chevron: { color: colors.gold, fontSize: 20 },
	rain: { position: 'absolute', zIndex: 20, top: 52, left: 0, right: 0, bottom: 0, color: '#A8CBFF55', fontSize: 34, lineHeight: 78, letterSpacing: 18, textAlign: 'center' },
	brightnessOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 21 },
});
