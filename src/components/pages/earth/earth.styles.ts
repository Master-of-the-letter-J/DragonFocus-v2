/** Route-specific presentation for the Earth route. */
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { StyleSheet } from 'react-native';

const { colors, radius, space } = dragonTheme;

export const styles = StyleSheet.create({
	populationCard: { backgroundColor: '#111922', borderColor: '#253E4B' },
	populationRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
	metricLabel: { color: colors.muted, fontFamily: appFonts.medium, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
	population: { color: colors.blue, fontFamily: appFonts.black, fontSize: 28 },
	deathColumn: { alignItems: 'flex-end' },
	deaths: { color: colors.muted, fontFamily: appFonts.bold, fontSize: 18 },
	earthStage: { height: 310, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
	orbitOuter: { position: 'absolute', width: 285, height: 285, borderRadius: 150, borderWidth: 1, borderColor: '#263746', transform: [{ rotate: '-12deg' }] },
	orbitInner: { position: 'absolute', left: 26, top: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
	earthGlow: { width: 230, height: 230, borderRadius: 130, backgroundColor: '#142A3A', shadowColor: colors.blue, shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
	earthImage: { width: '100%', height: '100%' },
	earthGlyph: { color: colors.blue, fontFamily: appFonts.black, fontSize: 150, textAlign: 'center', lineHeight: 220 },
	clickFeedback: { position: 'absolute', top: 30, color: colors.gold, fontFamily: appFonts.bold, fontSize: 14 },
	tapHint: { color: colors.muted, fontFamily: appFonts.medium, fontSize: 11, marginTop: 13 },
	surveyRow: { flexDirection: 'row', gap: space.sm },
	heartCard: { alignItems: 'center', paddingVertical: 28 },
	heartGlyph: { color: colors.crimsonBright, fontSize: 72, textShadowColor: colors.crimson, textShadowRadius: 18 },
	heartValue: { color: colors.ink, fontFamily: appFonts.black, fontSize: 34 },
	boostGrid: { width: '100%', gap: space.sm, paddingTop: space.md },
	boost: { backgroundColor: colors.canvasRaised, borderRadius: radius.medium, padding: space.md, gap: 3 },
	boostName: { color: colors.ink, fontFamily: appFonts.semibold, fontSize: 13 },
	timer: { color: colors.ink, fontFamily: appFonts.mono, fontSize: 52, textAlign: 'center', letterSpacing: 2, paddingVertical: 24 },
	timerActions: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, flexWrap: 'wrap' },
	adjustments: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: space.sm },
	statsRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.lg },
	hoardValue: { color: colors.ink, fontFamily: appFonts.bold, fontSize: 18 },
});
