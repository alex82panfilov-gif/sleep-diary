
import React, { useState } from 'react';
import type { LogEntry } from '../types';

interface CalendarViewProps {
  logs: LogEntry[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ logs }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const logsByDate = new Map(logs.map(log => [log.date, log]));

  const changeMonth = (amount: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
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
        formattedDate = day.toISOString().split('T')[0];
        const log = logsByDate.get(formattedDate);
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const isToday = new Date().toISOString().split('T')[0] === formattedDate;

        let cellClasses = 'h-16 md:h-20 flex items-center justify-center rounded-lg transition-colors text-sm md:text-base ';
        if (!isCurrentMonth) {
          cellClasses += 'text-slate-400 dark:text-slate-600';
        } else {
          cellClasses += 'bg-white dark:bg-slate-800';
        }
        if (isToday) {
            cellClasses += ' ring-2 ring-sky-500';
        }

        let indicator = null;
        if (log) {
            if (log.isRedDay) {
                indicator = <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full"></div>;
                cellClasses += ' font-bold text-red-600 dark:text-red-400';
            } else {
                indicator = <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full"></div>;
            }
        }

        days.push(
          <div className={`relative ${cellClasses}`} key={formattedDate}>
            <span>{day.getDate()}</span>
            {indicator}
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
    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-slate-700 dark:text-slate-200">Календарь</h2>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
       <div className="mt-4 flex items-center justify-end space-x-4 text-sm">
            <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>Раннее пробуждение</span>
            </div>
            <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Нормальное пробуждение</span>
            </div>
        </div>
    </div>
  );
};
