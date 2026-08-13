import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

export default function ProgressBar({ progress, outerStyle, innerStyle }: { progress: number; outerStyle?: StyleProp<ViewStyle>; innerStyle?: StyleProp<ViewStyle> }) {
	const width = `${Math.max(0, Math.min(100, progress))}%` as `${number}%`;
	return (
		<View style={[styles.outer, outerStyle]}>
			<View style={[styles.inner, { width }, innerStyle]} />
		</View>
	);
}

const styles = StyleSheet.create({ outer: { height: 10, borderRadius: 6, overflow: 'hidden', backgroundColor: '#ede9fe' }, inner: { height: '100%', backgroundColor: '#6d28d9' } });
