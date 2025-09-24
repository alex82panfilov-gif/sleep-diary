
import React, { useState, useEffect, useCallback } from 'react';
import { DailyLogForm } from './components/DailyLogForm';
import { CalendarView } from './components/CalendarView';
import { ReportView } from './components/ReportView';
import { SettingsView } from './components/SettingsView';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { LogEntry, AppSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { BellIcon, CalendarIcon, ChartBarIcon, CogIcon, PencilSquareIcon } from './components/Icons';
import { AlarmModal } from './components/AlarmModal';

type View = 'log' | 'calendar' | 'report' | 'settings';

const App: React.FC = () => {
  const [logs, setLogs] = useLocalStorage<LogEntry[]>('sleepLogs', []);
  const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', DEFAULT_SETTINGS);
  const [currentView, setCurrentView] = useState<View>('log');
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [isClient, setIsClient] = useState(false);

  // New state for alarm
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [alarmMessage, setAlarmMessage] = useState('');
  const [activeReminderTime, setActiveReminderTime] = useState('');
  const [snoozeUntil, setSnoozeUntil] = useState<number | null>(null);
  const [dismissedReminders, setDismissedReminders] = useLocalStorage<Record<string, string>>('dismissedReminders', {});

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !settings.notificationsEnabled || Notification.permission !== 'granted') {
      return;
    }

    const checkReminders = () => {
      const now = new Date();
      if (snoozeUntil && now.getTime() < snoozeUntil) {
        return; // Still snoozing
      }

      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const todayISO = now.toISOString().split('T')[0];

      const triggerAlarm = (message: string, reminderTime: string) => {
        if (dismissedReminders[reminderTime] === todayISO || isAlarmActive) return;

        setAlarmMessage(message);
        setActiveReminderTime(reminderTime);
        setIsAlarmActive(true);
        setSnoozeUntil(null); // Clear snooze when alarm triggers
        // FIX: The 'renotify' property is deprecated and causes a TypeScript error. Modern browsers handle re-notification with the same tag by default.
        new Notification('Напоминание о лекарствах', { body: message, tag: `med-reminder-${reminderTime}` });
      };

      if (currentTime === settings.morningReminder) {
        triggerAlarm('Пора принять утренние лекарства!', settings.morningReminder);
      }
      if (currentTime === settings.eveningReminder) {
        triggerAlarm('Пора принять вечерние лекарства!', settings.eveningReminder);
      }
    };

    const intervalId = setInterval(checkReminders, 30000); // Check every 30 seconds
    return () => clearInterval(intervalId);
    
  }, [settings, isClient, snoozeUntil, dismissedReminders, isAlarmActive, setDismissedReminders]);


  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      alert('Этот браузер не поддерживает уведомления.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      setSettings(s => ({ ...s, notificationsEnabled: true }));
    } else {
      setSettings(s => ({ ...s, notificationsEnabled: false }));
    }
  }, [setSettings]);

  const addOrUpdateLog = (newLog: LogEntry) => {
    setLogs(prevLogs => {
      const existingIndex = prevLogs.findIndex(log => log.date === newLog.date);
      if (existingIndex > -1) {
        const updatedLogs = [...prevLogs];
        updatedLogs[existingIndex] = newLog;
        return updatedLogs;
      }
      return [...prevLogs, newLog].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  };

  const handleSnooze = () => {
    setIsAlarmActive(false);
    setSnoozeUntil(Date.now() + 5 * 60 * 1000); // 5 minutes from now
  };

  const handleDismiss = () => {
    setIsAlarmActive(false);
    setSnoozeUntil(null);
    const todayISO = new Date().toISOString().split('T')[0];
    setDismissedReminders(prev => ({
      ...prev,
      [activeReminderTime]: todayISO,
    }));
  };

  const renderView = () => {
    switch (currentView) {
      case 'log':
        return <DailyLogForm addOrUpdateLog={addOrUpdateLog} logs={logs} targetWakeupTime={settings.targetWakeupTime} />;
      case 'calendar':
        return <CalendarView logs={logs} />;
      case 'report':
        return <ReportView logs={logs} />;
      case 'settings':
        return (
          <SettingsView 
            settings={settings} 
            onSettingsChange={setSettings} 
            onRequestNotificationPermission={requestNotificationPermission}
            notificationPermission={notificationPermission}
          />
        );
      default:
        return <DailyLogForm addOrUpdateLog={addOrUpdateLog} logs={logs} targetWakeupTime={settings.targetWakeupTime} />;
    }
  };

  if (!isClient) {
    return null; // Don't render server-side to avoid hydration mismatch with localStorage
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans">
      <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-sky-600 dark:text-sky-400">Дневник Сна</h1>
          {settings.notificationsEnabled && notificationPermission === 'granted' ? (
            <BellIcon className="w-6 h-6 text-green-500"/>
          ) : (
             <button onClick={requestNotificationPermission} className="flex items-center gap-1 text-sm text-slate-500 hover:text-sky-500">
               <BellIcon className="w-5 h-5 text-red-500"/>
               Вкл. напом.
             </button>
          )}
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6">
        {renderView()}
      </main>

      <footer className="bg-white dark:bg-slate-800 shadow-t-md sticky bottom-0 z-10 border-t border-slate-200 dark:border-slate-700">
        <nav className="container mx-auto flex justify-around">
          <NavButton icon={<PencilSquareIcon />} label="Запись" onClick={() => setCurrentView('log')} isActive={currentView === 'log'} />
          <NavButton icon={<CalendarIcon />} label="Календарь" onClick={() => setCurrentView('calendar')} isActive={currentView === 'calendar'} />
          <NavButton icon={<ChartBarIcon />} label="Отчет" onClick={() => setCurrentView('report')} isActive={currentView === 'report'} />
          <NavButton icon={<CogIcon />} label="Настройки" onClick={() => setCurrentView('settings')} isActive={currentView === 'settings'} />
        </nav>
      </footer>
      
      <AlarmModal 
        isOpen={isAlarmActive}
        message={alarmMessage}
        onSnooze={handleSnooze}
        onDismiss={handleDismiss}
      />
    </div>
  );
};

interface NavButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    isActive: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, onClick, isActive }) => {
    const activeClasses = 'text-sky-600 dark:text-sky-400';
    const inactiveClasses = 'text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-300';
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-2 w-full transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
        >
            <div className="w-6 h-6 mb-1">{icon}</div>
            <span className="text-xs font-medium">{label}</span>
        </button>
    );
}

export default App;