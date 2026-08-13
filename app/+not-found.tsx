import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
	return (
		<>
			<Stack.Screen options={{ title: 'Not found' }} />
			<View style={styles.container}>
				<Text style={styles.title}>That screen is unavailable.</Text>
			<Link href="/(_tabs)/earth" style={styles.link}>
					Return to Dragon Focus
				</Link>
			</View>
		</>
	);
}

const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#09070D' }, title: { color: '#F8F3E8', fontSize: 18, fontWeight: '700' }, link: { color: '#E0A84B', fontWeight: '800' } });
