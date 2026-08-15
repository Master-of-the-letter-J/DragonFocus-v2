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
});

