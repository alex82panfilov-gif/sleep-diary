export interface Medication {
  name: string;
  dosage: string;
}

export interface NightWaking {
  wakeTime: string;
  backToSleepTime: string;
}

export interface LogEntry {
  id: string; // 'YYYY-MM-DD'
  date: string; // 'YYYY-MM-DD'
  bedtime: string; // 'HH:mm'
  wakeupTime: string; // 'HH:mm'
  morningMeds: Medication;
  eveningMeds: Medication;
  wokeUpAtNight: boolean;
  nightWakings: NightWaking[];
  notes?: string;
  isRedDay: boolean;
}

export interface AppSettings {
    targetWakeupTime: string; // 'HH:mm'
    morningReminder: string; // 'HH:mm'
    eveningReminder: string; // 'HH:mm'
    notificationsEnabled: boolean;
}
