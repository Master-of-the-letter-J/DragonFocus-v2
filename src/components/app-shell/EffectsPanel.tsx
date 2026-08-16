import { spellTypeIcon } from '@/components/app-shell/spell-icons';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { useProductionSpecialStore } from '@/store/store-production-special/_useProductionSpecialStore';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const { colors, radius, space } = dragonTheme;

export function EffectsPanel() {
	const active = useProductionSpecialStore(state => state.spells.activeSpells);
	return (
		<View style={styles.panel}>
			<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.effects}>
				{active.length ?
					active.map(spell => (
						<View key={spell.id} style={styles.effect}>
							<Text style={styles.effectIcon}>{spellTypeIcon(spell.spellType)}</Text>
							<Text style={styles.effectName}>{spell.name}</Text>
							<Text style={styles.time}>{formatTime(spell.remainingSeconds)}</Text>
						</View>
					))
				:	<Text style={styles.muted}>✧ No active spell effects</Text>}
			</ScrollView>
		</View>
	);
}

const formatTime = (seconds: number) =>
	`${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
		.toString()
		.padStart(2, '0')}`;

const styles = StyleSheet.create({
	panel: { minHeight: 48, justifyContent: 'center', backgroundColor: '#241728', borderBottomColor: colors.line, borderBottomWidth: 1 },
	effects: { paddingHorizontal: space.md, gap: space.sm, alignItems: 'center' },
	effect: { backgroundColor: colors.crimsonSoft, borderColor: colors.lineStrong, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', gap: 8 },
	effectIcon: { color: colors.gold, fontSize: 13 },
	effectName: { color: colors.ink, fontFamily: appFonts.semibold, fontSize: 12 },
	time: { color: colors.gold, fontFamily: appFonts.mono, fontSize: 11 },
	muted: { color: colors.muted, fontFamily: appFonts.regular, fontSize: 11 },
});
