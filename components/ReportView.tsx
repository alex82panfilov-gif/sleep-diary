import React, { useState, useMemo } from 'react';
import type { LogEntry } from '../types';
import { generateAnalysis } from '../services/geminiService';

interface ReportViewProps {
    logs: LogEntry[];
}

export const ReportView: React.FC<ReportViewProps> = ({ logs }) => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    const [startDate, setStartDate] = useState(weekAgo.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const logDate = new Date(log.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return logDate >= start && logDate <= end;
        });
    }, [logs, startDate, endDate]);

    const redDaysCount = useMemo(() => {
        return filteredLogs.filter(log => log.isRedDay).length;
    }, [filteredLogs]);

    const handleAnalysis = async () => {
        setIsLoading(true);
        setError('');
        setAiAnalysis('');
        try {
            const analysis = await generateAnalysis(filteredLogs);
            setAiAnalysis(analysis);
        } catch (err) {
            console.error(err);
            setError('Не удалось получить анализ. Проверьте API ключ и повторите попытку.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const downloadCSV = () => {
        if (filteredLogs.length === 0) return;
        
        const headers = "date,bedtime,wakeupTime,isRedDay,wokeUpAtNight,nightWakings,morningMedName,morningMedDosage,eveningMedName,eveningMedDosage,notes";
        const rows = filteredLogs.map(log => 
            [
                log.date,
                log.bedtime,
                log.wakeupTime,
                log.isRedDay,
                log.wokeUpAtNight,
                `"${JSON.stringify(log.nightWakings || []).replace(/"/g, '""')}"`,
                `"${log.morningMeds.name.replace(/"/g, '""')}"`,
                `"${log.morningMeds.dosage.replace(/"/g, '""')}"`,
                `"${log.eveningMeds.name.replace(/"/g, '""')}"`,
                `"${log.eveningMeds.dosage.replace(/"/g, '""')}"`,
                `"${(log.notes || '').replace(/"/g, '""')}"`
            ].join(',')
        ).join('\n');
        
        const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `sleep_report_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-slate-700 dark:text-slate-200">Отчет и Анализ</h2>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg mb-6">
                <h3 className="text-lg font-semibold mb-3 text-slate-600 dark:text-slate-300">Выберите период</h3>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 w-full" />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 w-full" />
                </div>
                <div className="text-center p-4 bg-sky-50 dark:bg-sky-900/50 rounded-md">
                    <p className="text-slate-600 dark:text-slate-300">За выбранный период (<span className="font-bold">{filteredLogs.length}</span> дней):</p>
                    <p className="text-3xl font-bold text-red-500 mt-1">{redDaysCount}</p>
                    <p className="text-slate-500 dark:text-slate-400">дней с ранним пробуждением</p>
                </div>
                 <div className="mt-4 flex justify-end">
                    <button onClick={downloadCSV} disabled={filteredLogs.length === 0} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors">
                        Скачать CSV
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-3 text-slate-600 dark:text-slate-300">Анализ с помощью Gemini AI</h3>
                <button onClick={handleAnalysis} disabled={isLoading || filteredLogs.length === 0} className="w-full px-6 py-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors">
                    {isLoading ? 'Анализирую...' : 'Получить анализ'}
                </button>
                {isLoading && (
                    <div className="mt-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Это может занять некоторое время...</p>
                    </div>
                )}
                {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
                {aiAnalysis && (
                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-md whitespace-pre-wrap font-mono text-sm">
                        {aiAnalysis}
                    </div>
                )}
            </div>
        </div>
    );
};
