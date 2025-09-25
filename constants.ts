import type { AppSettings } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
    targetWakeupTime: '07:00',
    morningReminder: '08:00',
    eveningReminder: '20:00',
    notificationsEnabled: false,
    medications: [],
    noteTags: ["Хорошее настроение", "Плохое настроение", "Спокойный сон"],
    triggerTags: ["Стресс", "Яркий свет", "Пропустил лекарство", "Новая еда", "Плохая погода"],
    redDayFactors: {
        seizure: true,
        nightWakings: false,
        earlyWakeup: false,
    },
    orangeDayFactors: {
        seizure: false,
        nightWakings: false,
        earlyWakeup: true,
    },
    yellowDayFactors: {
        seizure: false,
        nightWakings: true,
        earlyWakeup: false,
    },
};