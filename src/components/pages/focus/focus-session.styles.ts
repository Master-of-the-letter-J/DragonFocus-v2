import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { StyleSheet } from 'react-native';

const { colors, space } = dragonTheme;

export const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.canvas },
	header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, borderBottomColor: colors.line, borderBottomWidth: 1 },
	headerCopy: { flex: 1, alignItems: 'center' },
	headerSpacer: { width: 52 },
	eyebrow: { color: colors.gold, fontFamily: appFonts.semibold, fontSize: 9, letterSpacing: 1.8 },
	title: { color: colors.ink, fontFamily: appFonts.bold, fontSize: 16 },
	session: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', gap: space.lg, padding: space.xl },
	glow: { position: 'absolute', width: 310, height: 310, borderRadius: 160, backgroundColor: colors.crimsonSoft },
	heart: { alignItems: 'center' },
	heartGlyph: { color: colors.crimsonBright, fontSize: 76, textShadowColor: colors.crimson, textShadowRadius: 22 },
	heartText: { color: colors.ink, fontFamily: appFonts.black, fontSize: 18 },
	timer: { color: colors.ink, fontFamily: appFonts.mono, fontSize: 58, letterSpacing: 3 },
	hiddenMessage: { height: 72, textAlignVertical: 'center', color: colors.muted, fontFamily: appFonts.medium, fontSize: 14, letterSpacing: 1 },
	detail: { color: colors.muted, fontFamily: appFonts.regular, fontSize: 13, lineHeight: 20, textAlign: 'center' },
	heartBar: { width: '100%' },
	controls: { width: '100%', backgroundColor: '#121018E8' },
	actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
	adjustments: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
});

