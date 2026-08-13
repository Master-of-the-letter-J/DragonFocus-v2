import AsyncStorage from '@react-native-async-storage/async-storage';

export const APP_STORAGE_KEYS = ['dragonfocus:app', 'dragonfocus:resources', 'dragonfocus:production', 'dragonfocus:goals', 'dragonfocus:surveys', 'dragonfocus:pomodoro', 'dragonfocus:offline', 'dragonfocus:world', 'dragonfocus:stats'] as const;

export const clearAppStorage = () => AsyncStorage.multiRemove([...APP_STORAGE_KEYS]);
