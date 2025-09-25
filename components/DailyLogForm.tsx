import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { LogEntry, NightWaking, Seizure, AppSettings } from '../types';
import { ClipboardIcon } from './Icons';

interface DailyLogFormProps {
    addOrUpdateLog: (log: LogEntry) => void;
    logs: LogEntry[];
    settings: AppSettings;
}

const todayISO = new Date().toISOString().split('T')[0];

const calculateSleepDuration = (bedtime: string, wakeupTime: string): string => {
    if (!bedtime || !wakeupTime) return '0 ч 0 мин';
    
    const bed = new Date(`2000-01-01T${bedtime}`);
    let wake = new Date(`2000-01-01T${wakeupTime}`);

    if (wake <= bed) { // Woke up on the next day
        wake.setDate(wake.getDate() + 1);
    }

    const diffMs = wake.getTime() - bed.getTime();
    if (diffMs < 0) return '0 ч 0 мин';

    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours} ч ${minutes} мин`;
}

export const DailyLogForm: React.FC<DailyLogFormProps> = ({ addOrUpdateLog, logs, settings }) => {
    const [date, setDate] = useState(todayISO);
    const [bedtime, setBedtime] = useState('21:00');
    const [wakeupTime, setWakeupTime] = useState('07:00');
    const [morningMedName, setMorningMedName] = useState('');
    const [morningMedDosage, setMorningMedDosage] = useState('');
    const [eveningMedName, setEveningMedName] = useState('');
    const [eveningMedDosage, setEveningMedDosage] = useState('');
    const [notes, setNotes] = useState('');
    const [trigger, setTrigger] = useState('');
    const [message, setMessage] = useState('');
    const [wokeUpAtNight, setWokeUpAtNight] = useState(false);
    const [nightWakings, setNightWakings] = useState<NightWaking[]>([]);
    const [noSeizures, setNoSeizures] = useState(true);
    const [seizures, setSeizures] = useState<Seizure[]>([]);

    const notesRef = useRef<HTMLTextAreaElement>(null);
    const triggerRef = useRef<HTMLTextAreaElement>(null);

    const sleepDuration = useMemo(() => calculateSleepDuration(bedtime, wakeupTime), [bedtime, wakeupTime]);
    
    const populateForm = (log: LogEntry | null) => {
        if (log) {
            setBedtime(log.bedtime);
            setWakeupTime(log.wakeupTime);
            setMorningMedName(log.morningMeds.name);
            setMorningMedDosage(log.morningMeds.dosage);
            setEveningMedName(log.eveningMeds.name);
            setEveningMedDosage(log.eveningMeds.dosage);
            setWokeUpAtNight(log.wokeUpAtNight || false);
            setNightWakings(log.nightWakings || []);
            setNotes(log.notes || '');
            setTrigger(log.trigger || '');
            setNoSeizures(!log.hadSeizure);
            setSeizures(log.seizures || []);
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
            setTrigger('');
            setNoSeizures(true);
            setSeizures([]);
        }
    }

    useEffect(() => {
        const todaysLog = logs.find(log => log.date === date);
        populateForm(todaysLog ?? null);
    }, [date, logs]);
    
    const copyFromYesterday = () => {
        const currentDate = new Date(date);
        currentDate.setDate(currentDate.getDate() - 1);
        const yesterdayISO = currentDate.toISOString().split('T')[0];
        const yesterdaysLog = logs.find(log => log.date === yesterdayISO);
        if (yesterdaysLog) {
            populateForm(yesterdaysLog);
            setMessage('Данные за вчера скопированы.');
        } else {
            setMessage('Запись за вчерашний день не найдена.');
        }
        setTimeout(() => setMessage(''), 3000);
    }
    
    const handleMedicationSelect = (
        medId: string, 
        type: 'morning' | 'evening'
    ) => {
        const selectedMed = settings.medications.find(m => m.id === medId);
        if (selectedMed) {
            if (type === 'morning') {
                setMorningMedName(selectedMed.name);
                setMorningMedDosage(selectedMed.dosage);
            } else {
                setEveningMedName(selectedMed.name);
                setEveningMedDosage(selectedMed.dosage);
            }
        }
    };
    
    const appendTag = (tag: string, field: 'notes' | 'trigger') => {
        const tagText = `#${tag} `;
        if (field === 'notes') {
            if (!notes.includes(tagText)) setNotes(prev => prev + tagText);
            notesRef.current?.focus();
        } else {
            if (!trigger.includes(tagText)) setTrigger(prev => prev + tagText);
            triggerRef.current?.focus();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const isEarlyWakeup = wakeupTime < settings.targetWakeupTime;
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
            trigger,
            isEarlyWakeup,
            hadSeizure: !noSeizures,
            seizures: !noSeizures ? seizures : [],
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
            setNightWakings([{ wakeTime: '', backToSleepTime: '' }]);
        }
    };
    
    const handleNumberOfWakingsChange = (num: number) => {
        const newSize = Math.max(0, num);
        setNightWakings(current => {
            if (newSize > current.length) {
                return [...current, ...Array(newSize - current.length).fill({ wakeTime: '', backToSleepTime: '' })];
            }
            return current.slice(0, newSize);
        });
    };

    const handleWakingTimeChange = (index: number, field: keyof NightWaking, value: string) => {
        const updatedWakings = [...nightWakings];
        updatedWakings[index] = { ...updatedWakings[index], [field]: value };
        setNightWakings(updatedWakings);
    };

    const handleSeizureToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setNoSeizures(isChecked);
        if (!isChecked && seizures.length === 0) {
            setSeizures([{ startTime: '', endTime: '' }]);
        } else if (isChecked) {
            setSeizures([]);
        }
    };
    
    const handleNumberOfSeizuresChange = (num: number) => {
        const newSize = Math.max(0, num);
         setSeizures(current => {
            if (newSize > current.length) {
                return [...current, ...Array(newSize - current.length).fill({ startTime: '', endTime: '' })];
            }
            return current.slice(0, newSize);
        });
    };

    const handleSeizureTimeChange = (index: number, field: keyof Seizure, value: string) => {
        const updatedSeizures = [...seizures];
        updatedSeizures[index] = { ...updatedSeizures[index], [field]: value };
        setSeizures(updatedSeizures);
    };
    
    const renderTagButtons = (tags: string[], field: 'notes' | 'trigger') => (
        <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(tag => (
                <button
                    key={tag}
                    type="button"
                    onClick={() => appendTag(tag, field)}
                    className="px-2 py-1 text-xs bg-sky-100 dark:bg-sky-800 text-sky-700 dark:text-sky-200 rounded-full hover:bg-sky-200 dark:hover:bg-sky-700 transition-colors"
                >
                    + {tag}
                </button>
            ))}
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                    Запись за день
                </h2>
                <button
                    onClick={copyFromYesterday}
                    className="flex items-center gap-2 text-sm px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-sm"
                    title="Заполнить форму данными из предыдущей записи"
                >
                    <ClipboardIcon className="w-4 h-4" />
                    <span>Копировать вчерашний день</span>
                </button>
            </div>
           
            <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <div className="flex flex-col">
                    <label htmlFor="date" className="mb-1 font-semibold text-slate-600 dark:text-slate-300">Дата</label>
                    <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                </div>

                <div>
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
                    <div className="mt-2 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                        Длительность сна: <span className="text-sky-600 dark:text-sky-400 font-bold">{sleepDuration}</span>
                    </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
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
                         <fieldset className="border p-4 rounded-md border-slate-300 dark:border-slate-600">
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
                                            <input type="time" id={`wakeTime-${index}`} value={waking.wakeTime} onChange={(e) => handleWakingTimeChange(index, 'wakeTime', e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor={`backToSleepTime-${index}`} className="text-sm mb-1 text-slate-500 dark:text-slate-400">Уснул в</label>
                                            <input type="time" id={`backToSleepTime-${index}`} value={waking.backToSleepTime} onChange={(e) => handleWakingTimeChange(index, 'backToSleepTime', e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </fieldset>
                    )}

                    <div className="flex items-center pt-4">
                        <input
                            type="checkbox"
                            id="noSeizures"
                            checked={noSeizures}
                            onChange={handleSeizureToggle}
                            className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                        />
                        <label htmlFor="noSeizures" className="ml-3 font-semibold text-slate-600 dark:text-slate-300">Приступов не было</label>
                    </div>

                     {!noSeizures && (
                        <fieldset className="border p-4 rounded-md border-slate-300 dark:border-slate-600">
                            <legend className="px-2 font-semibold text-slate-600 dark:text-slate-300">Детали приступов</legend>
                             <div className="flex flex-col">
                                <label htmlFor="numberOfSeizures" className="mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">Количество приступов</label>
                                <input 
                                    type="number"
                                    id="numberOfSeizures"
                                    value={seizures.length}
                                    onChange={(e) => handleNumberOfSeizuresChange(parseInt(e.target.value, 10))}
                                    min="0"
                                    className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 w-full md:w-32"
                                />
                            </div>
                            
                            {seizures.map((seizure, index) => (
                                <div key={index} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <p className="font-semibold text-slate-600 dark:text-slate-300 mb-2">Приступ #{index + 1}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col">
                                            <label htmlFor={`startTime-${index}`} className="text-sm mb-1 text-slate-500 dark:text-slate-400">Начало</label>
                                            <input type="time" id={`startTime-${index}`} value={seizure.startTime} onChange={(e) => handleSeizureTimeChange(index, 'startTime', e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor={`endTime-${index}`} className="text-sm mb-1 text-slate-500 dark:text-slate-400">Окончание</label>
                                            <input type="time" id={`endTime-${index}`} value={seizure.endTime} onChange={(e) => handleSeizureTimeChange(index, 'endTime', e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
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
                             <select 
                                onChange={(e) => handleMedicationSelect(e.target.value, 'morning')}
                                className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                             >
                                 <option value="">Выберите лекарство</option>
                                 {settings.medications.map(med => <option key={med.id} value={med.id}>{med.name}</option>)}
                             </select>
                             <input type="text" placeholder="Или введите название" value={morningMedName} onChange={e => setMorningMedName(e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                             <input type="text" placeholder="Дозировка" value={morningMedDosage} onChange={e => setMorningMedDosage(e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 md:col-span-2" />
                        </div>
                    </fieldset>
                     <fieldset className="border p-4 rounded-md border-slate-300 dark:border-slate-600">
                        <legend className="px-2 font-semibold text-slate-600 dark:text-slate-300">Вечерние лекарства</legend>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                             <select 
                                onChange={(e) => handleMedicationSelect(e.target.value, 'evening')}
                                className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                             >
                                 <option value="">Выберите лекарство</option>
                                 {settings.medications.map(med => <option key={med.id} value={med.id}>{med.name}</option>)}
                             </select>
                             <input type="text" placeholder="Или введите название" value={eveningMedName} onChange={e => setEveningMedName(e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                             <input type="text" placeholder="Дозировка" value={eveningMedDosage} onChange={e => setEveningMedDosage(e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 md:col-span-2" />
                         </div>
                    </fieldset>
                </div>
                
                <div className="flex flex-col">
                    <label htmlFor="notes" className="mb-1 font-semibold text-slate-600 dark:text-slate-300">Заметки</label>
                    <textarea ref={notesRef} id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" placeholder="Особенности сна, пробуждения, настроения..."></textarea>
                    {settings.noteTags.length > 0 && renderTagButtons(settings.noteTags, 'notes')}
                </div>

                <div className="flex flex-col">
                    <label htmlFor="trigger" className="mb-1 font-semibold text-slate-600 dark:text-slate-300">Триггер</label>
                    <textarea ref={triggerRef} id="trigger" value={trigger} onChange={e => setTrigger(e.target.value)} rows={2} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" placeholder="Возможные триггеры приступов или плохого сна..."></textarea>
                    {settings.triggerTags.length > 0 && renderTagButtons(settings.triggerTags, 'trigger')}
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