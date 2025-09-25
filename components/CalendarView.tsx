import React, { useState } from 'react';
import type { LogEntry, AppSettings } from '../types';
import { LogDetailModal } from './LogDetailModal';

interface CalendarViewProps {
  logs: LogEntry[];
  settings: AppSettings;
}

// Helper to format a date as 'YYYY-MM-DD' in the local timezone, avoiding UTC conversion issues.
const toISODateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const CalendarView: React.FC<CalendarViewProps> = ({ logs, settings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  
  const logsByDate = new Map<string, LogEntry>(logs.map(log => [log.date, log]));

  const changeMonth = (amount: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  const getDayColorClasses = (log: LogEntry | undefined): string => {
    if (!log) {
        return 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700';
    }

    const { redDayFactors, orangeDayFactors, yellowDayFactors } = settings;
    
    const checkFactors = (factors: typeof redDayFactors) => 
        (factors.seizure && log.hadSeizure) ||
        (factors.nightWakings && log.wokeUpAtNight) ||
        (factors.earlyWakeup && log.isEarlyWakeup);

    if (checkFactors(redDayFactors)) {
        return 'bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-200 font-semibold cursor-pointer hover:bg-red-300 dark:hover:bg-red-800/80';
    }
    if (checkFactors(orangeDayFactors)) {
        return 'bg-orange-200 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200 font-semibold cursor-pointer hover:bg-orange-300 dark:hover:bg-orange-800/80';
    }
    if (checkFactors(yellowDayFactors)) {
        return 'bg-yellow-200 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-200 font-semibold cursor-pointer hover:bg-yellow-300 dark:hover:bg-yellow-800/80';
    }

    return 'bg-green-100 dark:bg-green-900/50 text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-green-200 dark:hover:bg-green-800/70';
  };

  const renderHeader = () => {
    const dateFormat = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' });
    return (
      <div className="flex justify-between items-center mb-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-t-lg">
        <button onClick={() => changeMonth(-1)} className="px-4 py-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">&lt;</button>
        <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{dateFormat.format(currentDate)}</span>
        <button onClick={() => changeMonth(1)} className="px-4 py-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">&gt;</button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const dateFormat = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });
    for (let i = 1; i <= 7; i++) { // Monday to Sunday
      const day = new Date(2023, 0, 1 + i);
      days.push(
        <div className="text-center font-semibold text-sm text-slate-500 dark:text-slate-400" key={i}>
          {dateFormat.format(day)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 gap-1 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    const dayOfWeek = startDate.getDay();
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Start week on Monday
    startDate.setDate(startDate.getDate() - offset);
    
    const rows = [];
    let days = [];
    let day = new Date(startDate);
    let formattedDate = '';

    while (day <= monthEnd || days.length % 7 !== 0) {
      for (let i = 0; i < 7; i++) {
        // FIX: Use the helper to prevent timezone-related date shifts.
        formattedDate = toISODateString(day);
        const log = logsByDate.get(formattedDate);
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const isToday = toISODateString(new Date()) === formattedDate;

        let cellClasses = 'h-16 md:h-20 flex items-center justify-center rounded-lg transition-colors text-sm md:text-base ';
        if (!isCurrentMonth) {
          cellClasses += 'text-slate-400 dark:text-slate-600';
        } else {
           cellClasses += getDayColorClasses(log);
        }
        if (isToday) {
            cellClasses += ' ring-2 ring-sky-500';
        }

        days.push(
          <div 
            className={`${cellClasses}`} 
            key={formattedDate}
            onClick={() => log && setSelectedLog(log)}
            role={log ? 'button' : 'cell'}
            tabIndex={log ? 0 : -1}
            aria-label={log ? `Посмотреть запись за ${formattedDate}` : ''}
          >
            <span>{day.getDate()}</span>
          </div>
        );
        day.setDate(day.getDate() + 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <>
      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-slate-700 dark:text-slate-200">Календарь</h2>
        {renderHeader()}
        {renderDays()}
        {renderCells()}
        <div className="mt-4 flex flex-wrap items-center justify-center md:justify-end gap-x-4 gap-y-2 text-sm">
              <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2 bg-red-200 dark:bg-red-900/60 border border-slate-300 dark:border-slate-600"></div>
                  <span>Красный день</span>
              </div>
              <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2 bg-orange-200 dark:bg-orange-900/60 border border-slate-300 dark:border-slate-600"></div>
                  <span>Оранжевый день</span>
              </div>
              <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2 bg-yellow-200 dark:bg-yellow-900/60 border border-slate-300 dark:border-slate-600"></div>
                  <span>Желтый день</span>
              </div>
               <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2 bg-green-100 dark:bg-green-900/50 border border-slate-300 dark:border-slate-600"></div>
                  <span>Нормальный день</span>
              </div>
          </div>
      </div>
      {selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </>
  );
};