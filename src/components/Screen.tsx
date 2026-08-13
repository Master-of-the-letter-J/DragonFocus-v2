import type { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { AppHeader } from './AppHeader';

export function Screen({ children, contentStyle }: PropsWithChildren<{ contentStyle?: ViewStyle }>) {
	return (
		<SafeAreaView style={styles.safeArea}>
			<AppHeader />
			<ScrollView contentContainerStyle={[styles.content, contentStyle]}>{children}</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#f7f5ff' }, content: { padding: 16, gap: 16, paddingBottom: 36 } });
