import React, { useState, useMemo } from 'react';
import type { LogEntry } from '../types';
import * as XLSX from 'xlsx';
import { Chart } from './Chart';

interface ReportViewProps {
    logs: LogEntry[];
}

const parseSleepDuration = (durationStr: string): number => {
    if (!durationStr) return 0;
    const parts = durationStr.match(/(\d+)\s*ч\s*(\d+)\s*мин/);
    if (parts) {
        const hours = parseInt(parts[1], 10);
        const minutes = parseInt(parts[2], 10);
        return hours + minutes / 60;
    }
    return 0;
};

const formatSleepDuration = (hoursDecimal: number): string => {
    const hours = Math.floor(hoursDecimal);
    const minutes = Math.round((hoursDecimal - hours) * 60);
    return `${hours} ч ${minutes} мин`;
}

const calculateSleepDurationForLog = (bedtime: string, wakeupTime: string): string => {
    if (!bedtime || !wakeupTime) return '0:00';
    const bed = new Date(`2000-01-01T${bedtime}`);
    let wake = new Date(`2000-01-01T${wakeupTime}`);
    if (wake <= bed) wake.setDate(wake.getDate() + 1);
    const diffMs = wake.getTime() - bed.getTime();
    if (diffMs < 0) return '0:00';
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours} ч ${minutes} мин`;
};

const calculateTotalDosage = (log: LogEntry): string => {
    const dosages = [log.morningMeds.dosage, log.eveningMeds.dosage];
    let total = 0;
    const units = new Set<string>();
    dosages.forEach(d => {
        if (!d) return;
        const numbers = d.match(/\d+(\.\d+)?/g) || [];
        const textUnits = d.match(/[a-zA-Zа-яА-Я]+/g) || [];
        total += numbers.map(parseFloat).reduce((a, b) => a + b, 0);
        textUnits.forEach(u => units.add(u));
    });
    return `${total} ${Array.from(units).join(' ')}`.trim();
};

export const ReportView: React.FC<ReportViewProps> = ({ logs }) => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    const [startDate, setStartDate] = useState(weekAgo.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const logDate = new Date(log.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59);
            return logDate >= start && logDate <= end;
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [logs, startDate, endDate]);
    
    const chartData = useMemo(() => {
        const labels = filteredLogs.map(log => new Date(log.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }));
        const sleepDurations = filteredLogs.map(log => parseSleepDuration(calculateSleepDurationForLog(log.bedtime, log.wakeupTime)));
        const seizureCounts = filteredLogs.map(log => log.seizures?.length ?? 0);
        const wakingCounts = filteredLogs.map(log => log.nightWakings?.length ?? 0);
        return { labels, sleepDurations, seizureCounts, wakingCounts };
    }, [filteredLogs]);

    const statistics = useMemo(() => {
        if (filteredLogs.length === 0) {
            return { avgSleep: '0 ч 0 мин', totalSeizures: 0, mostFrequentTrigger: '-', seizureDayOfWeek: '-' };
        }
        
        const totalSleepHours = chartData.sleepDurations.reduce((sum, hours) => sum + hours, 0);
        const avgSleep = formatSleepDuration(totalSleepHours / filteredLogs.length);

        const totalSeizures = filteredLogs.reduce((sum, log) => sum + (log.seizures?.length ?? 0), 0);
        
        const tagCounts: { [key: string]: number } = {};
        filteredLogs.forEach(log => {
            const tags = log.trigger?.match(/#(\w+)/g) ?? [];
            tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });
        const mostFrequentTrigger = Object.keys(tagCounts).length > 0 ? Object.entries(tagCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0] : '-';

        const dayOfWeekCounts: { [key: number]: number } = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0};
        const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        filteredLogs.forEach(log => {
            if (log.seizures && log.seizures.length > 0) {
                const day = new Date(log.date).getUTCDay();
                dayOfWeekCounts[day] += log.seizures.length;
            }
        });
        const maxSeizureDayIndex = Object.keys(dayOfWeekCounts).reduce((a, b) => dayOfWeekCounts[parseInt(a)] > dayOfWeekCounts[parseInt(b)] ? a : b);
        const seizureDayOfWeek = dayOfWeekCounts[parseInt(maxSeizureDayIndex)] > 0 ? days[parseInt(maxSeizureDayIndex)] : '-';

        return { avgSleep, totalSeizures, mostFrequentTrigger, seizureDayOfWeek };
    }, [filteredLogs, chartData.sleepDurations]);
    
    const downloadXLSX = () => {
        if (filteredLogs.length === 0) return;
        const xlsxLib = (window as any).XLSX;
        if (!xlsxLib || !xlsxLib.utils) {
            alert("Ошибка при экспорте файла. Не удалось загрузить библиотеку отчетов.");
            return;
        }
        const dataForSheet = filteredLogs.map(log => ({
            'Дата': log.date,
            'Длительность сна': calculateSleepDurationForLog(log.bedtime, log.wakeupTime),
            'Кол-во ночных пробуждений': log.nightWakings?.length ?? 0,
            'Дозировка (суммарно за день)': calculateTotalDosage(log),
            'Приступ (был/не был)': log.hadSeizure ? 'Был' : 'Не был',
        }));
        const worksheet = xlsxLib.utils.json_to_sheet(dataForSheet);
        const workbook = xlsxLib.utils.book_new();
        xlsxLib.utils.book_append_sheet(workbook, worksheet, 'Отчет');
        const cols = Object.keys(dataForSheet[0]);
        worksheet['!cols'] = cols.map(col => ({
             wch: Math.max(col.length, ...dataForSheet.map(row => String((row as any)[col] ?? '').length))
        }));
        xlsxLib.writeFile(workbook, `sleep_report_${startDate}_to_${endDate}.xlsx`);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200">Отчет</h2>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-3 text-slate-600 dark:text-slate-300">Выберите период</h3>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 w-full" />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 w-full" />
                </div>
                 <div className="mt-4 flex justify-end">
                    <button onClick={downloadXLSX} disabled={filteredLogs.length === 0} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors">
                        Скачать XLSX
                    </button>
                </div>
            </div>

            {filteredLogs.length > 0 ? (
                <>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold mb-4 text-slate-600 dark:text-slate-300">Сводная статистика</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">{statistics.avgSleep}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Средний сон</div>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            <div className="text-2xl font-bold text-red-500">{statistics.totalSeizures}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Всего приступов</div>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            <div className="text-xl font-bold text-orange-500 truncate">{statistics.mostFrequentTrigger}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Частый триггер</div>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            <div className="text-2xl font-bold text-purple-500">{statistics.seizureDayOfWeek}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">"Опасный" день</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold mb-4 text-slate-600 dark:text-slate-300">График длительности сна</h3>
                    <Chart
                        type='bar'
                        data={{
                            labels: chartData.labels,
                            datasets: [{
                                label: 'Длительность сна (часы)',
                                data: chartData.sleepDurations,
                                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                                borderColor: 'rgba(59, 130, 246, 1)',
                                borderWidth: 1,
                            }]
                        }}
                    />
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold mb-4 text-slate-600 dark:text-slate-300">График приступов и ночных пробуждений</h3>
                     <Chart
                        type='line'
                        data={{
                            labels: chartData.labels,
                            datasets: [
                                {
                                    label: 'Кол-во приступов',
                                    data: chartData.seizureCounts,
                                    borderColor: 'rgba(239, 68, 68, 1)',
                                    backgroundColor: 'rgba(239, 68, 68, 0.5)',
                                    yAxisID: 'y',
                                    tension: 0.1,
                                },
                                {
                                    label: 'Кол-во пробуждений',
                                    data: chartData.wakingCounts,
                                    borderColor: 'rgba(249, 115, 22, 1)',
                                    backgroundColor: 'rgba(249, 115, 22, 0.5)',
                                    yAxisID: 'y',
                                    tension: 0.1,
                                }
                            ]
                        }}
                        options={{
                             scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                        }}
                    />
                </div>
                </>
            ) : (
                 <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
                    <p className="text-slate-500 dark:text-slate-400">Нет данных для отображения за выбранный период. Пожалуйста, выберите другие даты или добавьте записи.</p>
                </div>
            )}
        </div>
    );
};