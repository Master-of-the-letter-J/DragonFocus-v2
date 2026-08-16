/** Route-specific presentation for the Options route. */
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { StyleSheet } from 'react-native';

const { colors, space } = dragonTheme;

export const styles = StyleSheet.create({
	meter: { gap: space.sm, borderTopColor: colors.line, borderTopWidth: 1, paddingTop: space.md },
	meterHeader: { flexDirection: 'row', justifyContent: 'space-between' },
	meterValue: { color: colors.gold, fontFamily: appFonts.mono, fontSize: 12 },
	meterButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm },
	toggleRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, borderTopColor: colors.line, borderTopWidth: 1, paddingTop: space.sm },
	toggleLabel: { flex: 1, color: colors.ink, fontFamily: appFonts.medium, fontSize: 13 },
	orderRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: space.sm, borderTopColor: colors.line, borderTopWidth: 1, paddingTop: space.sm },
	orderIndex: { color: colors.gold, fontFamily: appFonts.black, width: 24 },
	orderLabel: { flex: 1, color: colors.ink, fontFamily: appFonts.medium, fontSize: 13 },
	orderCopy: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
	fieldLabel: { color: colors.muted, fontFamily: appFonts.semibold, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
	modeSummary: { color: colors.ink, fontFamily: appFonts.regular, fontSize: 12, lineHeight: 18, backgroundColor: colors.canvas, borderRadius: 10, padding: space.md },
	timerText: { color: colors.gold, fontFamily: appFonts.medium, fontSize: 11, lineHeight: 17 },
	inputRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
	input: { flex: 1, minHeight: 44, borderRadius: 10, borderColor: colors.line, borderWidth: 1, backgroundColor: colors.canvas, color: colors.ink, fontFamily: appFonts.regular, paddingHorizontal: 12 },
});
