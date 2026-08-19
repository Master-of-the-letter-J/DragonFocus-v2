import { Card, uiStyles } from '@/components/ui/DragonUI';
import { styles } from '@/components/pages/lair/lair.styles';
import { LairPurchaseButton, formatPurchaseCosts, missingPurchaseCosts } from '@/components/pages/lair/LairPurchaseButton';
import type { ClickerDefinition } from '@/types/production.types';
import { formatDecimal } from '@/utils/decimal';
import { useAppStore } from '@/store/useAppStore';
import { useProductionStore } from '@/store/store-production/_useProductionStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

export function ClickerList({ items }: { items: readonly ClickerDefinition[] }) {
	const reverseItemLayout = useAppStore(state => state.reverseItemLayout);
	const store = useProductionStore(
		useShallow(state => ({
			levels: state.levels,
			getCosts: state.getCosts,
			canPurchase: state.canPurchase,
			isItemUnlocked: state.isItemUnlocked,
			purchase: state.purchase,
		})),
	);
	const resources = useWorldStore(state => state.resourceStore.resources);
	const visibleItems = items.filter(item => store.isItemUnlocked(item.id));
	if (!visibleItems.length) return null;
	return (
		<View style={styles.itemList}>
			{visibleItems.map((item, index) => {
				const level = store.levels[item.id] ?? 0;
				const maxed = item.maxLevel !== undefined && level >= item.maxLevel;
				const costs = store.getCosts(item.id, 1);
				const costText = maxed ? 'Maximum level reached' : formatPurchaseCosts(costs) || 'No cost';
				const missing = maxed ? ['Maximum level reached.'] : missingPurchaseCosts(costs, resources);
				return (
					<Animated.View key={item.id} entering={FadeInDown.delay(Math.min(index * 25, 250))}>
						<Card style={styles.itemCard}>
							<View style={[styles.itemRow, reverseItemLayout && styles.itemRowReversed]}>
								<View style={styles.itemIcon}>
									<Text style={styles.itemIconText}>✦</Text>
								</View>
								<View style={styles.itemCopy}>
									<Text style={styles.itemLevel}>LEVEL {formatDecimal(level, 0)} / {item.maxLevel} LEVELS</Text>
									<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={styles.itemName}>{item.name}</Text>
									<Text numberOfLines={3} style={uiStyles.muted}>{item.description}</Text>
									<Text numberOfLines={2} style={styles.cost}>{costText || 'No cost'}</Text>
								</View>
								<View style={styles.itemActions}>
									{maxed ? <Text style={styles.maxedText}>MAXXED</Text> : <LairPurchaseButton compact label={item.maxLevel === 1 ? 'Unlock' : 'Buy 1'} disabled={!store.canPurchase(item.id) || missing.length > 0} missing={missing} onPress={() => store.purchase(item.id, 1)} />}
								</View>
							</View>
						</Card>
					</Animated.View>
				);
			})}
		</View>
	);
}
