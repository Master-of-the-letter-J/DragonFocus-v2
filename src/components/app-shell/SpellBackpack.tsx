import { spellTypeIcon } from '@/components/app-shell/spell-icons';
import { ActionButton } from '@/components/ui/DragonUI';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { useProductionSpecialStore } from '@/store/store-production-special/_useProductionSpecialStore';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

const { colors, radius, space } = dragonTheme;

export function SpellBackpack() {
	const { inventory, activate, sell } = useProductionSpecialStore(
		useShallow(state => ({ inventory: state.spells.spellInventory, activate: state.spells.activateSpell, sell: state.spells.sellSpell })),
	);
	const [visible, setVisible] = useState(false);

	return (
		<>
			<Pressable accessibilityRole="button" accessibilityLabel={`Open spell backpack, ${inventory.length} scrolls`} onPress={() => setVisible(true)} style={styles.backpack}>
				<Text style={styles.backpackIcon}>🎒</Text>
				{inventory.length ? <Text style={styles.count}>{inventory.length}</Text> : null}
			</Pressable>
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
							{inventory.length ?
								inventory.map(spell => (
									<View key={spell.id} style={styles.inventoryItem}>
										<Text style={styles.spellIcon}>{spellTypeIcon(spell.spellType)}</Text>
										<View style={styles.inventoryCopy}>
											<Text style={styles.spellName}>{spell.name}</Text>
											<Text style={styles.muted}>
												{formatTime(spell.durationSeconds)} · sell for {2 ** spell.size} shards
											</Text>
										</View>
										<ActionButton compact label="Use" onPress={() => activate(spell.id)} />
										<ActionButton compact tone="quiet" label="Sell" onPress={() => sell(spell.id)} />
									</View>
								))
							:	<Text style={styles.empty}>No spell scrolls yet. Open a Snackbox in the Black Market.</Text>}
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
	backpack: { height: 48, minWidth: 52, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: colors.line, backgroundColor: colors.surfaceRaised },
	backpackIcon: { fontSize: 19 },
	count: { position: 'absolute', right: 1, top: 1, color: colors.ink, backgroundColor: colors.crimson, borderRadius: 99, minWidth: 17, paddingHorizontal: 3, textAlign: 'center', fontSize: 9, fontFamily: appFonts.bold },
	scrim: { flex: 1, backgroundColor: '#050308DD', justifyContent: 'flex-end' },
	sheet: { backgroundColor: colors.canvasRaised, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderColor: colors.line, borderWidth: 1, maxHeight: '78%', padding: space.lg, gap: space.md },
	sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	sheetTitle: { color: colors.ink, fontFamily: appFonts.bold, fontSize: 21 },
	muted: { color: colors.muted, fontFamily: appFonts.regular, fontSize: 11 },
	empty: { color: colors.muted, fontFamily: appFonts.regular, fontSize: 13, textAlign: 'center', paddingVertical: 28 },
	inventory: { gap: space.sm, paddingBottom: 24 },
	inventoryItem: { flexDirection: 'row', gap: space.sm, alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.medium, padding: space.md },
	inventoryCopy: { flex: 1, gap: 2 },
	spellIcon: { color: colors.gold, fontSize: 20, width: 24, textAlign: 'center' },
	spellName: { color: colors.ink, fontFamily: appFonts.semibold, fontSize: 12 },
});
