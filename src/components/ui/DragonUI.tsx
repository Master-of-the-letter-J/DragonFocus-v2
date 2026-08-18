import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { milestoneLabel } from '@/data/world-data/milestones';
import { PAGE_UNLOCK_NOTICE_BY_ID } from '@/data/world-data/page-unlocks';
import { useAppStore } from '@/store/useAppStore';
import { useEffect } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown, LinearTransition, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const { colors, radius, space } = dragonTheme;

export function PageIntro({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
	return (
		<Animated.View entering={FadeInDown.duration(360)} style={styles.intro}>
			{eyebrow ?
				<Text style={styles.eyebrow}>{eyebrow}</Text>
			:	null}
			<Text style={styles.title}>{title}</Text>
			{description ?
				<Text style={styles.description}>{description}</Text>
			:	null}
		</Animated.View>
	);
}

export function Card({ children, style, accent }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; accent?: 'crimson' | 'gold' | 'violet' | 'blue' | 'green' }>) {
	return (
		<Animated.View layout={LinearTransition.springify()} style={[styles.card, accent ? { borderColor: colors[accent] } : null, style]}>
			{children}
		</Animated.View>
	);
}

export function SectionTitle({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
	return (
		<View style={styles.sectionHeader}>
			<View style={styles.sectionCopy}>
				<Text style={styles.sectionTitle}>{title}</Text>
				{detail ?
					<Text style={styles.sectionDetail}>{detail}</Text>
				:	null}
			</View>
			{action}
		</View>
	);
}

export function ActionButton({ label, tone = 'primary', compact = false, disabled, onPress, onDisabledPress, ...props }: PressableProps & { label: string; tone?: 'primary' | 'secondary' | 'danger' | 'quiet'; compact?: boolean; onDisabledPress?: () => void }) {
	const scale = useSharedValue(1);
	const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
	return (
		<Animated.View style={[animatedStyle, disabled && styles.disabled]}>
			<Pressable
				accessibilityRole="button"
				accessibilityState={{ ...props.accessibilityState, disabled: Boolean(disabled) }}
				disabled={Boolean(disabled && !onDisabledPress)}
				onPress={disabled ? onDisabledPress : onPress}
				onPressIn={() => {
					// Reanimated shared values are intentionally mutable animation handles.
					// eslint-disable-next-line react-hooks/immutability
					scale.value = withSpring(0.96, { damping: 18, stiffness: 320 });
				}}
				onPressOut={() => {
					// eslint-disable-next-line react-hooks/immutability
					scale.value = withSpring(1, { damping: 18, stiffness: 320 });
				}}
				style={[styles.button, styles[`button_${tone}`], compact && styles.buttonCompact]}
				{...props}>
				<Text style={[styles.buttonText, tone === 'quiet' && styles.buttonQuietText]}>{label}</Text>
			</Pressable>
		</Animated.View>
	);
}

export function Chip({ label, selected = false, onPress, disabled = false }: { label: string; selected?: boolean; onPress?: () => void; disabled?: boolean }) {
	return (
		<Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.chip, selected && styles.chipSelected, disabled && styles.disabled]}>
			<Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
		</Pressable>
	);
}


export function TabStrip<T extends string>({ tabs, value, onChange, milestone = Number.POSITIVE_INFINITY }: { tabs: readonly { id: T; label: string; unlockMilestone?: number; noticeId?: string; childNoticeIds?: readonly string[] }[]; value: T; onChange: (tab: T) => void; milestone?: number }) {
	const noticesInitialized = useAppStore(state => state.pageUnlockNoticesInitialized);
	const seenNoticeIds = useAppStore(state => state.seenPageUnlockNoticeIds);
	const dismissNotice = useAppStore(state => state.dismissPageUnlockNotice);
	const currentTab = tabs.find(tab => tab.id === value);
	const currentUnlocked = milestone >= (currentTab?.unlockMilestone ?? 0);
	const currentNoticeId = currentTab?.noticeId;
	useEffect(() => {
		if (noticesInitialized && currentUnlocked && currentNoticeId && !seenNoticeIds.includes(currentNoticeId)) dismissNotice(currentNoticeId);
	}, [currentNoticeId, currentUnlocked, dismissNotice, noticesInitialized, seenNoticeIds]);
	return (
		<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabStrip}>
			{tabs.map(tab => {
				const locked = milestone < (tab.unlockMilestone ?? 0);
				const noticeIds = [tab.noticeId, ...(tab.childNoticeIds ?? [])].filter((id): id is string => Boolean(id));
				const warning = noticesInitialized && !locked && noticeIds.some(id => milestone >= (PAGE_UNLOCK_NOTICE_BY_ID[id]?.milestone ?? Number.POSITIVE_INFINITY) && !seenNoticeIds.includes(id));
				return <Chip key={tab.id} label={locked ? `🔒 ${tab.label} · Milestone ${milestoneLabel(tab.unlockMilestone ?? 0)}` : warning ? `⚠️ ${tab.label}` : tab.label} disabled={locked} selected={tab.id === value} onPress={() => {
					if (tab.noticeId) dismissNotice(tab.noticeId);
					onChange(tab.id);
				}} />;
			})}
		</ScrollView>
	);
}

export function Stat({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'crimson' | 'gold' | 'green' | 'blue' }) {
	return (
		<View style={styles.stat}>
			<Text style={styles.statLabel}>{label}</Text>
			<Text numberOfLines={1} adjustsFontSizeToFit style={[styles.statValue, tone !== 'default' && { color: colors[tone] }]}>
				{value}
			</Text>
		</View>
	);
}

export function ProgressBar({ value, max = 100, color = colors.crimsonBright, label }: { value: number; max?: number; color?: string; label?: string }) {
	const width = `${Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))}%` as `${number}%`;
	return (
		<View style={styles.progressGroup}>
			{label ?
				<Text style={styles.progressLabel}>{label}</Text>
			:	null}
			<View style={styles.progressTrack}>
				<Animated.View layout={LinearTransition} style={[styles.progressFill, { width, backgroundColor: color }]} />
			</View>
		</View>
	);
}

export function EmptyState({ icon = '◇', title, description }: { icon?: string; title: string; description: string }) {
	return (
		<View style={styles.empty}>
			<Text style={styles.emptyIcon}>{icon}</Text>
			<Text style={styles.emptyTitle}>{title}</Text>
			<Text style={styles.emptyDescription}>{description}</Text>
		</View>
	);
}

export const uiStyles = StyleSheet.create({
	body: { color: colors.ink, fontFamily: appFonts.regular, fontSize: 14, lineHeight: 21 },
	muted: { color: colors.muted, fontFamily: appFonts.regular, fontSize: 12, lineHeight: 18 },
	row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
	wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});

const styles = StyleSheet.create({
	intro: { gap: 5, paddingTop: 4 },
	eyebrow: { color: colors.gold, fontFamily: appFonts.semibold, fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase' },
	title: { color: colors.ink, fontFamily: appFonts.black, fontSize: 30, letterSpacing: -1 },
	description: { color: colors.muted, fontFamily: appFonts.regular, fontSize: 13, lineHeight: 20, maxWidth: 620 },
	card: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.large, padding: space.lg, gap: space.md },
	sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.md },
	sectionCopy: { flex: 1, gap: 3 },
	sectionTitle: { color: colors.ink, fontFamily: appFonts.bold, fontSize: 17, lineHeight: 23 },
	sectionDetail: { color: colors.muted, fontFamily: appFonts.regular, fontSize: 12, lineHeight: 18 },
	button: { minHeight: 46, borderRadius: radius.medium, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 12, borderWidth: 1 },
	buttonCompact: { minHeight: 36, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.small },
	button_primary: { backgroundColor: colors.crimson, borderColor: colors.crimsonBright },
	button_secondary: { backgroundColor: colors.goldSoft, borderColor: '#74552C' },
	button_danger: { backgroundColor: '#461C25', borderColor: colors.danger },
	button_quiet: { backgroundColor: colors.surfaceRaised, borderColor: colors.line },
	buttonText: { color: '#FFF9F0', fontFamily: appFonts.semibold, fontSize: 13 },
	buttonQuietText: { color: colors.ink },
	disabled: { opacity: 0.42 },
	chip: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
	chipSelected: { backgroundColor: colors.crimsonSoft, borderColor: colors.crimsonBright },
	chipText: { color: colors.muted, fontFamily: appFonts.medium, fontSize: 12 },
	chipTextSelected: { color: '#FFD8D4', fontFamily: appFonts.semibold },
	tabStrip: { gap: space.sm, paddingVertical: 2 },
	stat: { minWidth: 92, flex: 1, gap: 2 },
	statLabel: { color: colors.muted, fontFamily: appFonts.medium, fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase' },
	statValue: { color: colors.ink, fontFamily: appFonts.bold, fontSize: 15 },
	progressGroup: { gap: 6 },
	progressLabel: { color: colors.muted, fontFamily: appFonts.medium, fontSize: 11 },
	progressTrack: { backgroundColor: '#0C0910', borderRadius: radius.pill, height: 9, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
	progressFill: { height: '100%', borderRadius: radius.pill },
	empty: { alignItems: 'center', gap: 7, paddingHorizontal: 22, paddingVertical: 30 },
	emptyIcon: { color: colors.gold, fontSize: 30 },
	emptyTitle: { color: colors.ink, fontFamily: appFonts.bold, fontSize: 16 },
	emptyDescription: { color: colors.muted, fontFamily: appFonts.regular, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
