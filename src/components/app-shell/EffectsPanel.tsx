import { ActionButton } from '@/components/ui/DragonUI';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { useSpellsStore } from '@/store/store-production-special/createSpellsSlice';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const { colors, radius, space } = dragonTheme;

export function EffectsPanel() {
	const active = useSpellsStore(state => state.activeSpells);
	const inventory = useSpellsStore(state => state.spellInventory);
	const activate = useSpellsStore(state => state.activateSpell);
	const sell = useSpellsStore(state => state.sellSpell);
	const [visible, setVisible] = useState(false);
	if (!active.length && !inventory.length) return null;
	return (
		<>
			<View style={styles.panel}>
				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.effects}>
					{active.length ?
						active.map(spell => (
							<View key={spell.id} style={styles.effect}>
								<Text style={styles.effectName}>{spell.name}</Text>
								<Text style={styles.time}>{formatTime(spell.remainingSeconds)}</Text>
							</View>
						))
					:	<Text style={styles.muted}>No active effects</Text>}
				</ScrollView>
				<Pressable accessibilityRole="button" accessibilityLabel="Open spell backpack" onPress={() => setVisible(true)} style={styles.backpack}>
					<Text style={styles.backpackIcon}>▣</Text>
					<Text style={styles.count}>{inventory.length}</Text>
				</Pressable>
			</View>
			<Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
				<Pressable style={styles.scrim} onPress={() => setVisible(false)}>
					<Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
						<View style={styles.sheetHeader}>
							<View>
								<Text style={styles.sheetTitle}>Spell backpack</Text>
								<Text style={styles.muted}>{inventory.length} scrolls ready</Text>
							</View>
							<ActionButton compact tone="quiet" label="Close" onPress={() => setVisible(false)} />
						</View>
						<ScrollView contentContainerStyle={styles.inventory}>
							{inventory.map(spell => (
								<View key={spell.id} style={styles.inventoryItem}>
									<View style={styles.inventoryCopy}>
										<Text style={styles.effectName}>{spell.name}</Text>
										<Text style={styles.muted}>
											{formatTime(spell.durationSeconds)} · sell for {2 ** spell.size} shards
										</Text>
									</View>
									<ActionButton compact label="Use" onPress={() => activate(spell.id)} />
									<ActionButton compact tone="quiet" label="Sell" onPress={() => sell(spell.id)} />
								</View>
							))}
						</ScrollView>
					</Pressable>
				</Pressable>
			</Modal>
		</>
	);
}

const formatTime = (seconds: number) =>
	`${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
		.toString()
		.padStart(2, '0')}`;

const styles = StyleSheet.create({
	panel: { flexDirection: 'row', minHeight: 48, alignItems: 'center', backgroundColor: '#241728', borderBottomColor: colors.line, borderBottomWidth: 1 },
	effects: { paddingHorizontal: space.md, gap: space.sm, alignItems: 'center' },
	effect: { backgroundColor: colors.crimsonSoft, borderColor: colors.lineStrong, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', gap: 8 },
	effectName: { color: colors.ink, fontFamily: appFonts.semibold, fontSize: 12 },
	time: { color: colors.gold, fontFamily: appFonts.mono, fontSize: 11 },
	muted: { color: colors.muted, fontFamily: appFonts.regular, fontSize: 11 },
	backpack: { minWidth: 52, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center', borderLeftColor: colors.line, borderLeftWidth: 1 },
	backpackIcon: { color: colors.gold, fontSize: 18 },
	count: { position: 'absolute', right: 7, top: 4, color: colors.ink, backgroundColor: colors.crimson, borderRadius: 99, minWidth: 17, textAlign: 'center', fontSize: 9, fontFamily: appFonts.bold },
	scrim: { flex: 1, backgroundColor: '#050308DD', justifyContent: 'flex-end' },
	sheet: { backgroundColor: colors.canvasRaised, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderColor: colors.line, borderWidth: 1, maxHeight: '78%', padding: space.lg, gap: space.md },
	sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	sheetTitle: { color: colors.ink, fontFamily: appFonts.bold, fontSize: 21 },
	inventory: { gap: space.sm, paddingBottom: 24 },
	inventoryItem: { flexDirection: 'row', gap: space.sm, alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.medium, padding: space.md },
	inventoryCopy: { flex: 1, gap: 2 },
});
