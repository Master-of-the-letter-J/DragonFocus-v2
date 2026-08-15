import { EffectsPanel } from '@/components/app-shell/EffectsPanel';
import { SecondaryPanel, type PanelMode } from '@/components/app-shell/SecondaryPanel';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import { formatDecimal } from '@/utils/decimal';
import { router } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, type ScrollViewProps } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useState } from 'react';

const { colors, radius, space } = dragonTheme;

const menuItems = [
	['Check-in survey', '/check-in-survey'],
	['Check-out survey', '/check-out-survey'],
	['View goals', '/(_tabs)/earth?tab=active'],
	['View account', '/(_tabs)/archives?tab=pact'],
	['Game modes', '/(_tabs)/options?tab=general'],
	['Tutorial', '/tutorial'],
	['Black market', '/(_tabs)/archives?tab=market'],
] as const;

const panelChoices: { id: PanelMode; label: string }[] = [
	{ id: 'dragon', label: 'Dragon' },
	{ id: 'goals', label: 'Goals' },
	{ id: 'resources', label: 'Resources' },
	{ id: 'prestige', label: 'Prestige' },
	{ id: 'spells', label: 'Spells' },
	{ id: 'population', label: 'Population' },
];

export function DragonAppScreen({ title, panel, effects = false, children, scrollProps }: PropsWithChildren<{ title: string; panel: PanelMode; effects?: boolean; scrollProps?: ScrollViewProps }>) {
	const shards = useWorldStore(state => state.resourceStore.resources.shards);
	const [menuOpen, setMenuOpen] = useState(false);
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelMode, setPanelMode] = useState(panel);
	return (
		<SafeAreaView style={styles.safe}>
			<Animated.View entering={FadeIn.duration(250)} style={styles.header}>
				<Pressable accessibilityRole="button" accessibilityLabel="Open menu" onPress={() => setMenuOpen(true)} style={styles.iconButton}>
					<Text style={styles.icon}>☰</Text>
				</Pressable>
				<Text numberOfLines={1} style={styles.headerTitle}>
					{title}
				</Text>
				<View style={styles.headerRight}>
					<View style={styles.shards}>
						<Text style={styles.shardMark}>◆</Text>
						<Text style={styles.shardValue}>{formatDecimal(shards)}</Text>
					</View>
					<Pressable accessibilityRole="button" accessibilityLabel="Change information panel" onPress={() => setPanelOpen(true)} style={styles.iconButton}>
						<Text style={styles.panelIcon}>◫</Text>
					</Pressable>
				</View>
			</Animated.View>
			<SecondaryPanel mode={panelMode} onPress={() => setPanelOpen(true)} />
			{effects ?
				<EffectsPanel />
			:	null}
			<ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} {...scrollProps} contentContainerStyle={[styles.content, scrollProps?.contentContainerStyle]}>
				<Animated.View entering={FadeInDown.duration(320)} style={styles.contentInner}>
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
		</SafeAreaView>
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
	header: { height: 58, backgroundColor: colors.canvasRaised, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, borderBottomWidth: 1, borderBottomColor: colors.line, gap: space.sm },
	iconButton: { height: 42, minWidth: 42, borderRadius: radius.medium, justifyContent: 'center', alignItems: 'center' },
	icon: { color: colors.ink, fontSize: 22 },
	panelIcon: { color: colors.gold, fontSize: 20 },
	headerTitle: { flex: 1, textAlign: 'center', color: colors.ink, fontFamily: appFonts.bold, fontSize: 17 },
	headerRight: { flexDirection: 'row', alignItems: 'center' },
	shards: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.goldSoft, paddingHorizontal: 9, paddingVertical: 6, borderRadius: radius.pill },
	shardMark: { color: colors.gold, fontSize: 11 },
	shardValue: { color: '#FFE3A2', fontFamily: appFonts.semibold, fontSize: 11, maxWidth: 54 },
	content: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: 120 },
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
});
