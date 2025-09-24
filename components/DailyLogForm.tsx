import React, { useState, useEffect } from 'react';
import type { LogEntry, NightWaking } from '../types';

interface DailyLogFormProps {
    addOrUpdateLog: (log: LogEntry) => void;
    logs: LogEntry[];
    targetWakeupTime: string;
}

const todayISO = new Date().toISOString().split('T')[0];

export const DailyLogForm: React.FC<DailyLogFormProps> = ({ addOrUpdateLog, logs, targetWakeupTime }) => {
    const [date, setDate] = useState(todayISO);
    const [bedtime, setBedtime] = useState('21:00');
    const [wakeupTime, setWakeupTime] = useState('07:00');
    const [morningMedName, setMorningMedName] = useState('');
    const [morningMedDosage, setMorningMedDosage] = useState('');
    const [eveningMedName, setEveningMedName] = useState('');
    const [eveningMedDosage, setEveningMedDosage] = useState('');
    const [notes, setNotes] = useState('');
    const [message, setMessage] = useState('');
    const [wokeUpAtNight, setWokeUpAtNight] = useState(false);
    const [nightWakings, setNightWakings] = useState<NightWaking[]>([]);

    useEffect(() => {
        const todaysLog = logs.find(log => log.date === date);
        if (todaysLog) {
            setBedtime(todaysLog.bedtime);
            setWakeupTime(todaysLog.wakeupTime);
            setMorningMedName(todaysLog.morningMeds.name);
            setMorningMedDosage(todaysLog.morningMeds.dosage);
            setEveningMedName(todaysLog.eveningMeds.name);
            setEveningMedDosage(todaysLog.eveningMeds.dosage);
            setWokeUpAtNight(todaysLog.wokeUpAtNight || false);
            setNightWakings(todaysLog.nightWakings || []);
            setNotes(todaysLog.notes || '');
        } else {
            // Reset form for a new date
            setBedtime('21:00');
            setWakeupTime('07:00');
            setMorningMedName('');
            setMorningMedDosage('');
            setEveningMedName('');
            setEveningMedDosage('');
            setWokeUpAtNight(false);
            setNightWakings([]);
            setNotes('');
        }
    }, [date, logs]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const isRedDay = wakeupTime < targetWakeupTime;
        const newLog: LogEntry = {
            id: date,
            date,
            bedtime,
            wakeupTime,
            morningMeds: { name: morningMedName, dosage: morningMedDosage },
            eveningMeds: { name: eveningMedName, dosage: eveningMedDosage },
            wokeUpAtNight,
            nightWakings: wokeUpAtNight ? nightWakings : [],
            notes,
            isRedDay,
        };
        addOrUpdateLog(newLog);
        setMessage('Данные сохранены!');
        setTimeout(() => setMessage(''), 3000);
    };

    const handleWokeUpToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setWokeUpAtNight(isChecked);
        if (!isChecked) {
            setNightWakings([]);
        } else if (nightWakings.length === 0) {
            // Default to one waking when checking the box
            setNightWakings([{ wakeTime: '', backToSleepTime: '' }]);
        }
    };
    
    const handleNumberOfWakingsChange = (num: number) => {
        const newSize = Math.max(0, num);
        const currentSize = nightWakings.length;
        
        if (newSize > currentSize) {
            const newItems = Array(newSize - currentSize).fill({ wakeTime: '', backToSleepTime: '' });
            setNightWakings([...nightWakings, ...newItems]);
        } else if (newSize < currentSize) {
            setNightWakings(nightWakings.slice(0, newSize));
        }
    };

    const handleWakingTimeChange = (index: number, field: keyof NightWaking, value: string) => {
        const updatedWakings = [...nightWakings];
        updatedWakings[index] = { ...updatedWakings[index], [field]: value };
        setNightWakings(updatedWakings);
    };


    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-slate-700 dark:text-slate-200">
                Запись за день
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <div className="flex flex-col">
                    <label htmlFor="date" className="mb-1 font-semibold text-slate-600 dark:text-slate-300">Дата</label>
                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                        <label htmlFor="bedtime" className="mb-1 font-semibold text-slate-600 dark:text-slate-300">Лег спать</label>
                        <input type="time" id="bedtime" value={bedtime} onChange={e => setBedtime(e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="wakeupTime" className="mb-1 font-semibold text-slate-600 dark:text-slate-300">Проснулся</label>
                        <input type="time" id="wakeupTime" value={wakeupTime} onChange={e => setWakeupTime(e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                    </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="wokeUpAtNight"
                            checked={wokeUpAtNight}
                            onChange={handleWokeUpToggle}
                            className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                        />
                        <label htmlFor="wokeUpAtNight" className="ml-3 font-semibold text-slate-600 dark:text-slate-300">Просыпался ночью?</label>
                    </div>

                    {wokeUpAtNight && (
                        <fieldset className="mt-4 border p-4 rounded-md border-slate-300 dark:border-slate-600">
                            <legend className="px-2 font-semibold text-slate-600 dark:text-slate-300">Детали ночных пробуждений</legend>
                             <div className="flex flex-col">
                                <label htmlFor="numberOfWakings" className="mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">Сколько раз просыпался?</label>
                                <input 
                                    type="number"
                                    id="numberOfWakings"
                                    value={nightWakings.length}
                                    onChange={(e) => handleNumberOfWakingsChange(parseInt(e.target.value, 10))}
                                    min="0"
                                    className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-full md:w-32"
                                />
                            </div>
                            
                            {nightWakings.map((waking, index) => (
                                <div key={index} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <p className="font-semibold text-slate-600 dark:text-slate-300 mb-2">Пробуждение #{index + 1}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col">
                                            <label htmlFor={`wakeTime-${index}`} className="text-sm mb-1 text-slate-500 dark:text-slate-400">Проснулся в</label>
                                            <input 
                                                type="time"
                                                id={`wakeTime-${index}`}
                                                value={waking.wakeTime}
                                                onChange={(e) => handleWakingTimeChange(index, 'wakeTime', e.target.value)}
                                                className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor={`backToSleepTime-${index}`} className="text-sm mb-1 text-slate-500 dark:text-slate-400">Уснул в</label>
                                            <input 
                                                type="time"
                                                id={`backToSleepTime-${index}`}
                                                value={waking.backToSleepTime}
                                                onChange={(e) => handleWakingTimeChange(index, 'backToSleepTime', e.target.value)}
                                                className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </fieldset>
                    )}
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <fieldset className="border p-4 rounded-md border-slate-300 dark:border-slate-600">
                        <legend className="px-2 font-semibold text-slate-600 dark:text-slate-300">Утренние лекарства</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                             <input type="text" placeholder="Название" value={morningMedName} onChange={e => setMorningMedName(e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                             <input type="text" placeholder="Дозировка" value={morningMedDosage} onChange={e => setMorningMedDosage(e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                        </div>
                    </fieldset>

                     <fieldset className="border p-4 rounded-md border-slate-300 dark:border-slate-600">
                        <legend className="px-2 font-semibold text-slate-600 dark:text-slate-300">Вечерние лекарства</legend>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                             <input type="text" placeholder="Название" value={eveningMedName} onChange={e => setEveningMedName(e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                             <input type="text" placeholder="Дозировка" value={eveningMedDosage} onChange={e => setEveningMedDosage(e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                         </div>
                    </fieldset>
                </div>
                
                <div className="flex flex-col">
                    <label htmlFor="notes" className="mb-1 font-semibold text-slate-600 dark:text-slate-300">Заметки</label>
                    <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" placeholder="Особенности сна, пробуждения, настроения..."></textarea>
                </div>

                <div className="flex items-center justify-between">
                    <button type="submit" className="px-6 py-2 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors">
                        Сохранить
                    </button>
                    {message && <p className="text-green-600 dark:text-green-400 animate-pulse">{message}</p>}
                </div>
            </form>
        </div>
    );
};