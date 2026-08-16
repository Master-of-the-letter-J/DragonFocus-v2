/** Route-specific presentation for the Tutorial route. */
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { StyleSheet } from 'react-native';

const { colors, space } = dragonTheme;

export const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.canvas },
	header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.md, borderBottomColor: colors.line, borderBottomWidth: 1 },
	headerTitle: { color: colors.ink, fontFamily: appFonts.bold, fontSize: 16 },
	content: { width: '100%', maxWidth: 800, alignSelf: 'center', padding: space.lg, paddingBottom: 60, gap: space.lg },
	rule: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', borderTopColor: colors.line, borderTopWidth: 1, paddingTop: space.md },
	number: { color: colors.gold, fontFamily: appFonts.black, fontSize: 16, width: 22 },
	oddsGroup: { gap: space.sm, borderTopColor: colors.line, borderTopWidth: 1, paddingTop: space.md },
	oddsTitle: { color: colors.gold, fontFamily: appFonts.semibold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
	oddsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
	oddsRow: { width: '47%', flexGrow: 1, minWidth: 130, flexDirection: 'row', justifyContent: 'space-between', gap: space.sm, backgroundColor: colors.canvasRaised, borderRadius: 10, paddingHorizontal: space.md, paddingVertical: space.sm },
	oddsName: { color: colors.ink, fontFamily: appFonts.medium, fontSize: 11 },
	oddsValue: { color: colors.gold, fontFamily: appFonts.mono, fontSize: 11 },
});
