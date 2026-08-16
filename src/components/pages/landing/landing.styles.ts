/** Route-specific presentation for the landing route. */
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { StyleSheet } from 'react-native';

const { colors } = dragonTheme;

export const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: colors.canvas, overflow: 'hidden' },
	center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, zIndex: 2 },
	emberTop: { position: 'absolute', top: -180, alignSelf: 'center', width: 430, height: 430, borderRadius: 220, backgroundColor: '#32151E' },
	eyebrow: { color: colors.gold, fontFamily: appFonts.semibold, fontSize: 10, letterSpacing: 2.4 },
	dragon: { width: '100%', maxWidth: 390, height: 290 },
	title: { color: colors.ink, fontFamily: appFonts.black, fontSize: 42, letterSpacing: -1.8 },
	subtitle: { color: colors.muted, fontFamily: appFonts.regular, fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 320, marginTop: 8 },
	action: { width: '100%', maxWidth: 320, marginTop: 28 },
	door: { position: 'absolute', top: 0, bottom: 0, width: '50%', backgroundColor: '#130D15', borderColor: '#3E2838', zIndex: 1 },
	leftDoor: { left: 0, borderRightWidth: 2 },
	rightDoor: { right: 0, borderLeftWidth: 2 },
	doorLine: { position: 'absolute', top: '10%', bottom: '10%', width: 1, backgroundColor: '#70434A', right: 24 },
});
