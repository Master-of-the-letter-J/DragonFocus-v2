import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { milestoneLabel } from '@/data/world-data/milestones';
import { getUnlockedNews, type NewsItem } from '@/data/news-data';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const { colors, radius, space } = dragonTheme;

const chooseNews = (items: readonly NewsItem[], currentId?: string) => {
	if (items.length === 0) return undefined;
	const choices = items.length > 1 ? items.filter(item => item.id !== currentId) : items;
	return choices[Math.floor(Math.random() * choices.length)] ?? items[0];
};

export function NewsBar({ milestone }: { milestone: number }) {
	const unlockedItems = useMemo(() => getUnlockedNews(milestone), [milestone]);
	return <RotatingNewsBar key={milestone} items={unlockedItems} milestone={milestone} />;
}

function RotatingNewsBar({ items, milestone }: { items: readonly NewsItem[]; milestone: number }) {
	const [itemId, setItemId] = useState<string | undefined>(() => chooseNews(items)?.id);
	const chooseNext = useCallback(() => {
		setItemId(currentId => chooseNews(items, currentId)?.id);
	}, [items]);

	useEffect(() => {
		if (items.length < 2) return;
		const rotation = setInterval(chooseNext, 20_000);
		return () => clearInterval(rotation);
	}, [chooseNext, items.length]);

	const item = items.find(candidate => candidate.id === itemId) ?? items[0];
	if (!item) return null;

	return (
		<View style={styles.bar}>
			<View style={[styles.badge, item.kind === 'tip' ? styles.tipBadge : styles.newsBadge]}>
				<Text style={styles.badgeMark}>{item.kind === 'tip' ? '✦' : '◈'}</Text>
				<Text style={styles.badgeText}>{item.kind === 'tip' ? 'TIP' : 'NEWS'}</Text>
			</View>
			<View style={styles.copy}>
				<Text numberOfLines={2} style={styles.text}>{item.text}</Text>
				<Text style={styles.progress}>Unlocked through {milestoneLabel(milestone)}</Text>
			</View>
			<Pressable accessibilityRole="button" accessibilityLabel="Show another news item" onPress={chooseNext} style={styles.nextButton}>
				<Text style={styles.next}>↻</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	bar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm, backgroundColor: colors.canvasRaised, borderBottomWidth: 1, borderBottomColor: colors.line },
	badge: { minWidth: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: space.xs, paddingVertical: 5, borderRadius: radius.pill },
	newsBadge: { backgroundColor: colors.goldSoft },
	tipBadge: { backgroundColor: colors.crimsonSoft },
	badgeMark: { color: colors.gold, fontSize: 11 },
	badgeText: { color: colors.ink, fontFamily: appFonts.bold, fontSize: 9, letterSpacing: 0.7 },
	copy: { flex: 1, gap: 1 },
	text: { color: colors.ink, fontFamily: appFonts.medium, fontSize: 11, lineHeight: 16 },
	progress: { color: colors.muted, fontFamily: appFonts.regular, fontSize: 9 },
	nextButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.surface },
	next: { color: colors.gold, fontSize: 20 },
});
