
import React from 'react';
import type { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onSettingsChange: React.Dispatch<React.SetStateAction<AppSettings>>;
  onRequestNotificationPermission: () => void;
  notificationPermission: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSettingsChange, onRequestNotificationPermission, notificationPermission }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    onSettingsChange(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-slate-700 dark:text-slate-200">Настройки</h2>
      <div className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
        <div>
          <label htmlFor="targetWakeupTime" className="block font-semibold text-slate-600 dark:text-slate-300">Целевое время пробуждения</label>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Дни, когда ребенок просыпается раньше этого времени, будут отмечены красным.</p>
          <input
            type="time"
            id="targetWakeupTime"
            name="targetWakeupTime"
            value={settings.targetWakeupTime}
            onChange={handleChange}
            className="w-full p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">Напоминания</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Получайте уведомления в браузере, чтобы не забыть сделать запись.</p>

            {notificationPermission === 'default' && (
                 <button onClick={onRequestNotificationPermission} className="w-full px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors">
                    Включить напоминания
                 </button>
            )}

            {notificationPermission === 'denied' && (
                <p className="text-red-500 text-center p-2 bg-red-50 dark:bg-red-900/50 rounded-md">Вы заблокировали уведомления. Чтобы включить их, измените настройки вашего браузера для этого сайта.</p>
            )}

            {notificationPermission === 'granted' && (
                <div className="space-y-4">
                     <div>
                        <label htmlFor="morningReminder" className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Утреннее напоминание</label>
                        <input
                            type="time"
                            id="morningReminder"
                            name="morningReminder"
                            value={settings.morningReminder}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="eveningReminder" className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Вечернее напоминание</label>
                        <input
                            type="time"
                            id="eveningReminder"
                            name="eveningReminder"
                            value={settings.eveningReminder}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
