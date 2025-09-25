import React, { useState, useRef } from 'react';
import type { AppSettings, MedicationTemplate, LogEntry } from '../types';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, TrashIcon } from './Icons';

interface SettingsViewProps {
  settings: AppSettings;
  onSettingsChange: React.Dispatch<React.SetStateAction<AppSettings>>;
  logs: LogEntry[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSettingsChange, logs }) => {
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newNoteTag, setNewNoteTag] = useState('');
  const [newTriggerTag, setNewTriggerTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    onSettingsChange(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFactorChange = (factorGroup: 'redDayFactors' | 'orangeDayFactors' | 'yellowDayFactors') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    onSettingsChange(prev => ({
        ...prev,
        [factorGroup]: {
            ...prev[factorGroup],
            [name]: checked,
        },
    }));
  };

  const addMedication = () => {
    if (newMedName.trim() && newMedDosage.trim()) {
        const newMed: MedicationTemplate = {
            id: Date.now().toString(),
            name: newMedName.trim(),
            dosage: newMedDosage.trim()
        };
        onSettingsChange(prev => ({...prev, medications: [...prev.medications, newMed]}));
        setNewMedName('');
        setNewMedDosage('');
    }
  };
  
  const deleteMedication = (id: string) => {
      onSettingsChange(prev => ({...prev, medications: prev.medications.filter(med => med.id !== id)}));
  };
  
  const addTag = (type: 'note' | 'trigger') => {
      if (type === 'note' && newNoteTag.trim()) {
          onSettingsChange(prev => ({...prev, noteTags: [...prev.noteTags, newNoteTag.trim()]}));
          setNewNoteTag('');
      } else if (type === 'trigger' && newTriggerTag.trim()) {
          onSettingsChange(prev => ({...prev, triggerTags: [...prev.triggerTags, newTriggerTag.trim()]}));
          setNewTriggerTag('');
      }
  };

  const deleteTag = (tagToDelete: string, type: 'note' | 'trigger') => {
      if (type === 'note') {
          onSettingsChange(prev => ({...prev, noteTags: prev.noteTags.filter(tag => tag !== tagToDelete)}));
      } else {
          onSettingsChange(prev => ({...prev, triggerTags: prev.triggerTags.filter(tag => tag !== tagToDelete)}));
      }
  };

  const exportData = () => {
    try {
        const allData = {
            sleepLogs: logs,
            appSettings: settings,
            // Add any other localStorage keys you use
        };
        const dataStr = JSON.stringify(allData, null, 2);
        const blob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `sleep_diary_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to export data:", error);
        alert("Произошла ошибка при экспорте данных.");
    }
  };
  
  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Вы уверены? Импорт данных заменит все текущие записи и настройки. Это действие необратимо.")) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("File content is not text");
            const data = JSON.parse(text);

            if (data.sleepLogs && Array.isArray(data.sleepLogs)) {
                localStorage.setItem('sleepLogs', JSON.stringify(data.sleepLogs));
            }
            if (data.appSettings && typeof data.appSettings === 'object') {
                localStorage.setItem('appSettings', JSON.stringify(data.appSettings));
            }
            // Import other keys if needed

            alert("Данные успешно импортированы! Страница будет перезагружена.");
            window.location.reload();

        } catch (error) {
            console.error("Failed to import data:", error);
            alert("Ошибка при импорте данных. Пожалуйста, убедитесь, что вы выбрали правильный файл резервной копии.");
        }
    };
    reader.readAsText(file);
    // Reset file input value to allow importing the same file again
    event.target.value = '';
  };


  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-slate-700 dark:text-slate-200">Настройки</h2>
      <div className="space-y-8 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
        
        {/* Data Management */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">Управление данными</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Сохраните все данные в файл или восстановите их из резервной копии.</p>
            <div className="flex flex-col md:flex-row gap-4">
                <button onClick={exportData} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors">
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Экспорт данных
                </button>
                 <button onClick={handleImportClick} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                    <ArrowUpTrayIcon className="w-5 h-5" />
                    Импорт данных
                </button>
                <input type="file" accept=".json" ref={fileInputRef} onChange={importData} className="hidden" />
            </div>
        </div>

        <div>
          <label htmlFor="targetWakeupTime" className="block font-semibold text-slate-600 dark:text-slate-300">Целевое время пробуждения</label>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Используется для определения "раннего пробуждения".</p>
          <input
            type="time"
            id="targetWakeupTime"
            name="targetWakeupTime"
            value={settings.targetWakeupTime}
            onChange={handleChange}
            className="w-full p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        {/* Medication Templates */}
         <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">Мои лекарства</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Добавьте шаблоны для быстрого выбора на странице записи.</p>
            <div className="space-y-2 mb-4">
                {settings.medications.map(med => (
                    <div key={med.id} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                        <span><span className="font-bold">{med.name}</span> ({med.dosage})</span>
                        <button onClick={() => deleteMedication(med.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                ))}
            </div>
            <div className="flex flex-col md:flex-row gap-2">
                 <input type="text" placeholder="Название" value={newMedName} onChange={e => setNewMedName(e.target.value)} className="flex-1 p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                 <input type="text" placeholder="Дозировка" value={newMedDosage} onChange={e => setNewMedDosage(e.target.value)} className="flex-1 p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                 <button onClick={addMedication} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">Добавить</button>
            </div>
        </div>

        {/* Tag Management */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">Управление тегами</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                    <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-2">Теги для "Заметок"</h4>
                     <div className="space-y-2 mb-3">
                        {settings.noteTags.map(tag => (
                             <div key={tag} className="flex items-center justify-between p-1.5 text-sm bg-slate-100 dark:bg-slate-700 rounded-md">
                                <span>{tag}</span>
                                <button onClick={() => deleteTag(tag, 'note')} className="text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        ))}
                    </div>
                     <div className="flex gap-2">
                         <input type="text" value={newNoteTag} onChange={e => setNewNoteTag(e.target.value)} className="w-full p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                         <button onClick={() => addTag('note')} className="px-3 bg-slate-200 dark:bg-slate-600 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">+</button>
                     </div>
                </div>
                 <div>
                    <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-2">Теги для "Триггеров"</h4>
                     <div className="space-y-2 mb-3">
                        {settings.triggerTags.map(tag => (
                             <div key={tag} className="flex items-center justify-between p-1.5 text-sm bg-slate-100 dark:bg-slate-700 rounded-md">
                                <span>{tag}</span>
                                <button onClick={() => deleteTag(tag, 'trigger')} className="text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                         <input type="text" value={newTriggerTag} onChange={e => setNewTriggerTag(e.target.value)} className="w-full p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                         <button onClick={() => addTag('trigger')} className="px-3 bg-slate-200 dark:bg-slate-600 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">+</button>
                    </div>
                </div>
             </div>
        </div>
        
        {/* Day Color Settings */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">Настройка 'Красного дня'</h3>
            <div className="space-y-3 mt-4">
              <div className="flex items-center"><input type="checkbox" id="red_seizure" name="seizure" checked={settings.redDayFactors.seizure} onChange={handleFactorChange('redDayFactors')} className="h-4 w-4 rounded" /><label htmlFor="red_seizure" className="ml-3">Приступ</label></div>
              <div className="flex items-center"><input type="checkbox" id="red_earlyWakeup" name="earlyWakeup" checked={settings.redDayFactors.earlyWakeup} onChange={handleFactorChange('redDayFactors')} className="h-4 w-4 rounded" /><label htmlFor="red_earlyWakeup" className="ml-3">Раннее пробуждение</label></div>
              <div className="flex items-center"><input type="checkbox" id="red_nightWakings" name="nightWakings" checked={settings.redDayFactors.nightWakings} onChange={handleFactorChange('redDayFactors')} className="h-4 w-4 rounded" /><label htmlFor="red_nightWakings" className="ml-3">Ночные пробуждения</label></div>
            </div>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">Настройка 'Оранжевого дня'</h3>
            <div className="space-y-3 mt-4">
              <div className="flex items-center"><input type="checkbox" id="orange_seizure" name="seizure" checked={settings.orangeDayFactors.seizure} onChange={handleFactorChange('orangeDayFactors')} className="h-4 w-4 rounded" /><label htmlFor="orange_seizure" className="ml-3">Приступ</label></div>
              <div className="flex items-center"><input type="checkbox" id="orange_earlyWakeup" name="earlyWakeup" checked={settings.orangeDayFactors.earlyWakeup} onChange={handleFactorChange('orangeDayFactors')} className="h-4 w-4 rounded" /><label htmlFor="orange_earlyWakeup" className="ml-3">Раннее пробуждение</label></div>
              <div className="flex items-center"><input type="checkbox" id="orange_nightWakings" name="nightWakings" checked={settings.orangeDayFactors.nightWakings} onChange={handleFactorChange('orangeDayFactors')} className="h-4 w-4 rounded" /><label htmlFor="orange_nightWakings" className="ml-3">Ночные пробуждения</label></div>
            </div>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">Настройка 'Желтого дня'</h3>
            <div className="space-y-3 mt-4">
              <div className="flex items-center"><input type="checkbox" id="yellow_seizure" name="seizure" checked={settings.yellowDayFactors.seizure} onChange={handleFactorChange('yellowDayFactors')} className="h-4 w-4 rounded" /><label htmlFor="yellow_seizure" className="ml-3">Приступ</label></div>
              <div className="flex items-center"><input type="checkbox" id="yellow_earlyWakeup" name="earlyWakeup" checked={settings.yellowDayFactors.earlyWakeup} onChange={handleFactorChange('yellowDayFactors')} className="h-4 w-4 rounded" /><label htmlFor="yellow_earlyWakeup" className="ml-3">Раннее пробуждение</label></div>
              <div className="flex items-center"><input type="checkbox" id="yellow_nightWakings" name="nightWakings" checked={settings.yellowDayFactors.nightWakings} onChange={handleFactorChange('yellowDayFactors')} className="h-4 w-4 rounded" /><label htmlFor="yellow_nightWakings" className="ml-3">Ночные пробуждения</label></div>
            </div>
        </div>
      </div>
    </div>
  );
};
