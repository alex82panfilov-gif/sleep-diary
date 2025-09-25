export interface Medication {
  name: string;
  dosage: string;
}

export interface NightWaking {
  wakeTime: string;
  backToSleepTime: string;
}

export interface Seizure {
  startTime: string;
  endTime: string;
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
  trigger?: string;
  isEarlyWakeup: boolean; // Renamed from isRedDay
  hadSeizure: boolean;
  seizures: Seizure[];
}

export interface MedicationTemplate {
    id: string;
    name: string;
    dosage: string;
}

export interface AppSettings {
    targetWakeupTime: string; // 'HH:mm'
    morningReminder: string; // 'HH:mm'
    eveningReminder: string; // 'HH:mm'
    notificationsEnabled: boolean;
    medications: MedicationTemplate[];
    noteTags: string[];
    triggerTags: string[];
    redDayFactors: {
        seizure: boolean;
        nightWakings: boolean;
        earlyWakeup: boolean;
    };
    orangeDayFactors: {
        seizure: boolean;
        nightWakings: boolean;
        earlyWakeup: boolean;
    };
    yellowDayFactors: {
        seizure: boolean;
        nightWakings: boolean;
        earlyWakeup: boolean;
    };
}