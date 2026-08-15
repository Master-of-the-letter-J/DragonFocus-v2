import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { StyleSheet } from 'react-native';

const { colors, radius, space } = dragonTheme;

export const styles = StyleSheet.create({
	planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
	plan: { minWidth: 110, flex: 1, backgroundColor: colors.canvas, borderColor: colors.line, borderWidth: 1, borderRadius: radius.medium, padding: space.md, gap: space.sm },
	planPeriod: { color: colors.muted, fontFamily: appFonts.semibold, fontSize: 11, textTransform: 'uppercase' },
	planPrice: { color: colors.gold, fontFamily: appFonts.black, fontSize: 22 },
	benefit: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
	check: { color: colors.gold, fontSize: 14 },
	marketGrid: { gap: space.sm },
	disclosure: { color: colors.gold, fontFamily: appFonts.medium, fontSize: 10, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.6 },
	tableCard: { padding: 0, overflow: 'hidden' },
	tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line },
	cell: { width: 116, color: colors.ink, fontFamily: appFonts.regular, fontSize: 11, padding: space.md },
	headerCell: { color: colors.gold, fontFamily: appFonts.bold, backgroundColor: colors.canvasRaised },
	achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
	achievement: { width: '23%', minWidth: 78, flexGrow: 1, minHeight: 135, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.medium, padding: space.sm, gap: 5 },
	achievementUnlocked: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
	achievementIcon: { color: colors.gold, fontSize: 20 },
	achievementTitle: { color: colors.ink, fontFamily: appFonts.semibold, fontSize: 11 },
	metricLabel: { color: colors.muted, fontFamily: appFonts.medium, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
	statLarge: { color: colors.ink, fontFamily: appFonts.black, fontSize: 26 },
});

