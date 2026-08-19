import { ActionButton, Card, PageIntro, SectionTitle, uiStyles } from '@/components/ui/DragonUI';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

const lessons = [
	{ icon: '✓', title: 'Goals & editing', body: 'Use Habits for repeating behavior and To-Dos for finite work. Give each goal a clear next action, then edit its importance, difficulty, due date, and archetype before completion. Finished goals wait together for Harvest.' },
	{ icon: '⏱', title: 'Pomodoro timers', body: 'A Pomodoro places the Crimson Heart into containment, accelerating production while focus is active. Choose a duration or stopwatch, pin relevant goals, select unlocked boosts, and end the session honestly to record its rewards.' },
	{ icon: '⚡', title: 'Energy', body: 'Energy is the main production currency. Producers create it, amplifiers strengthen it, Goal Multipliers compound it, and the Crimson Heart controls the effective tick rate.' },
	{ icon: '◈', title: 'Dark Energy', body: 'Dark Energy comes primarily from harvesting completed goals. Game mode and Titanomachy multiply Goal Power XP first; additional Dark Energy effects then convert that final XP into Dark Energy.' },
	{ icon: '◉', title: 'Plasma', body: 'Plasma unlocks through Armageddon. It is earned by sacrificing a developed Energy run and powers prestige upgrades and deities.' },
	{ icon: '◌', title: 'Anomalies', body: 'Anomalies arrive with Transcension and buy the deepest upgrades. They represent progress that survives broader resets.' },
	{ icon: '◆', title: 'Milestones', body: 'Milestones track all-time Energy. They unlock pages, sub-tabs, producers, upgrades, game modes, government logs, and Crimson Shard claims.' },
	{ icon: '🔥', title: 'Dragon Fury', body: 'Fury rises or falls with activity and goals. Higher bands can weaken or stop production; reaching Supernova can kill the dragon, so surveys, focus, and defensive systems matter.' },
] as const;

export function SettingsTutorial() {
	return (
		<>
			<PageIntro eyebrow="📖 Field guide" title="Tutorial" description="A compact guide to the systems you will use most often." />
			{lessons.map(lesson => (
				<Card key={lesson.title}>
					<SectionTitle title={`${lesson.icon} ${lesson.title}`} />
					<Text style={uiStyles.body}>{lesson.body}</Text>
				</Card>
			))}
			<Card accent="gold">
				<SectionTitle title="Full field guide" detail="Open the complete chapter-based tutorial for prestige, spells, Snackboxes, and special systems." />
				<View><ActionButton label="Open full tutorial" onPress={() => router.push('/tutorial')} /></View>
			</Card>
		</>
	);
}
