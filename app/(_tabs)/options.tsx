import { DragonAppScreen } from '@/components/app-shell/DragonAppScreen';
import { GeneralSettings } from '@/components/pages/options/GeneralSettings';
import { OPTIONS_TABS, type OptionsTab } from '@/components/pages/options/options-tabs';
import { SettingsTutorial } from '@/components/pages/options/SettingsTutorial';
import { SurveySettings } from '@/components/pages/options/SurveySettings';
import { TabStrip } from '@/components/ui/DragonUI';
import { useState } from 'react';

export default function OptionsRoute() {
	const [tab, setTab] = useState<OptionsTab>('general');
	return (
		<DragonAppScreen title="Settings" panel="world">
			<TabStrip tabs={OPTIONS_TABS} value={tab} onChange={setTab} />
			{tab === 'general' ? <GeneralSettings /> : tab === 'surveys' ? <SurveySettings /> : <SettingsTutorial />}
		</DragonAppScreen>
	);
}
