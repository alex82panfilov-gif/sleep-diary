
import React, { useState, useEffect, useCallback } from 'react';
import { DailyLogForm } from './components/DailyLogForm';
import { CalendarView } from './components/CalendarView';
import { ReportView } from './components/ReportView';
import { SettingsView } from './components/SettingsView';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { LogEntry, AppSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { CalendarIcon, ChartBarIcon, CogIcon, PencilSquareIcon } from './components/Icons';

type View = 'log' | 'calendar' | 'report' | 'settings';

const App: React.FC = () => {
  const [logs, setLogs] = useLocalStorage<LogEntry[]>('sleepLogs', []);
  const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', DEFAULT_SETTINGS);
  const [currentView, setCurrentView] = useState<View>('log');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const renderView = () => {
    switch (currentView) {
      case 'log':
        return <DailyLogForm addOrUpdateLog={addOrUpdateLog} logs={logs} settings={settings} />;
      case 'calendar':
        return <CalendarView logs={logs} settings={settings} />;
      case 'report':
        return <ReportView logs={logs} />;
      case 'settings':
        return (
          <SettingsView 
            settings={settings} 
            onSettingsChange={setSettings} 
            logs={logs}
          />
        );
      default:
        return <DailyLogForm addOrUpdateLog={addOrUpdateLog} logs={logs} settings={settings} />;
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
    </div>
  );
};

interface NavButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    isActive: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, onClick, isActive, ...props }) => {
    const activeClasses = 'text-sky-600 dark:text-sky-400';
    const inactiveClasses = 'text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-300';
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-2 w-full transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
            {...props}
        >
            <div className="w-6 h-6 mb-1">{icon}</div>
            <span className="text-xs font-medium">{label}</span>
        </button>
    );
}

export default App;
