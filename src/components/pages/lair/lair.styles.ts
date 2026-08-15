import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { StyleSheet } from 'react-native';

const { colors, radius, space } = dragonTheme;

export const styles = StyleSheet.create({
	metricLabel: { color: colors.muted, fontFamily: appFonts.medium, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
	energyHero: { alignItems: 'center' },
	energy: { color: colors.gold, fontFamily: appFonts.black, fontSize: 36 },
	dragonStage: { minHeight: 310, alignItems: 'center', justifyContent: 'center' },
	dragonHalo: { position: 'absolute', width: 230, height: 230, borderRadius: 120, backgroundColor: colors.crimsonSoft, opacity: 0.65 },
	dragonWrap: { width: '100%', height: 220 },
	dragon: { width: '100%', height: '100%' },
	dragonName: { color: colors.ink, fontFamily: appFonts.black, fontSize: 23 },
	dragonMeta: { color: colors.muted, fontFamily: appFonts.medium, fontSize: 11, textTransform: 'capitalize' },
	itemList: { gap: space.sm },
	itemCard: { padding: space.md },
	itemRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
	itemIcon: { width: 48, height: 48, borderRadius: radius.medium, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
	itemIconText: { color: colors.gold, fontSize: 22 },
	itemCopy: { flex: 1, gap: 2 },
	itemLevel: { color: colors.crimsonBright, fontFamily: appFonts.bold, fontSize: 9, letterSpacing: 1 },
	itemName: { color: colors.ink, fontFamily: appFonts.semibold, fontSize: 14, textTransform: 'capitalize' },
	cost: { color: colors.gold, fontFamily: appFonts.medium, fontSize: 11 },
	itemActions: { gap: 6, alignItems: 'stretch' },
	heartNumber: { color: colors.crimsonBright, fontFamily: appFonts.black, fontSize: 30, textAlign: 'center' },
	ability: { minHeight: 52, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: space.sm },
	prestigeNumber: { color: colors.gold, fontFamily: appFonts.black, fontSize: 31 },
	monument: { flexDirection: 'row', gap: space.md, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: space.md },
});

