import React from 'react';
import type { LogEntry } from '../types';

interface LogDetailModalProps {
  log: LogEntry;
  onClose: () => void;
}

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

export const LogDetailModal: React.FC<LogDetailModalProps> = ({ log, onClose }) => {
  const sleepDuration = calculateSleepDuration(log.bedtime, log.wakeupTime);
  
  const formatDate = (dateString: string) => {
    // Split the date string to handle it without timezone conversion
    const [year, month, day] = dateString.split('-').map(Number);
    // Create date in local timezone
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                Запись за {formatDate(log.date)}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl" aria-label="Закрыть">&times;</button>
        </div>

        <div className="space-y-4 text-slate-700 dark:text-slate-300">
            <InfoSection title="Сон">
                <InfoItem label="Лег спать" value={log.bedtime} />
                <InfoItem label="Проснулся" value={log.wakeupTime} />
                <InfoItem label="Длительность сна" value={sleepDuration} />
                {log.isEarlyWakeup && <p className="text-sm text-orange-500 dark:text-orange-400 col-span-2 mt-1">Раннее пробуждение</p>}
            </InfoSection>

            {log.wokeUpAtNight && log.nightWakings.length > 0 && (
                 <InfoSection title="Ночные пробуждения">
                    <p className="col-span-2 mb-2">{log.nightWakings.length} раз(а)</p>
                    {log.nightWakings.map((w, i) => (
                        <React.Fragment key={i}>
                            <InfoItem label={`Проснулся #${i + 1}`} value={w.wakeTime} />
                            <InfoItem label={`Уснул #${i + 1}`} value={w.backToSleepTime} />
                        </React.Fragment>
                    ))}
                </InfoSection>
            )}

            {log.hadSeizure && log.seizures.length > 0 && (
                 <InfoSection title="Приступы">
                    <p className="col-span-2 mb-2 text-red-500 dark:text-red-400 font-bold">{log.seizures.length} раз(а)</p>
                     {log.seizures.map((s, i) => (
                        <React.Fragment key={i}>
                            <InfoItem label={`Начало #${i + 1}`} value={s.startTime} />
                            <InfoItem label={`Конец #${i + 1}`} value={s.endTime} />
                        </React.Fragment>
                    ))}
                </InfoSection>
            )}

            <InfoSection title="Лекарства">
                <InfoItem label="Утренние" value={`${log.morningMeds.name || '-'} (${log.morningMeds.dosage || '-'})`} />
                <InfoItem label="Вечерние" value={`${log.eveningMeds.name || '-'} (${log.eveningMeds.dosage || '-'})`} />
            </InfoSection>

            {log.notes && (
                <div>
                    <h4 className="font-semibold mb-1 text-slate-600 dark:text-slate-300">Заметки</h4>
                    <p className="p-3 bg-slate-100 dark:bg-slate-700 rounded-md text-sm whitespace-pre-wrap">{log.notes}</p>
                </div>
            )}
            
            {log.trigger && (
                <div>
                    <h4 className="font-semibold mb-1 text-slate-600 dark:text-slate-300">Триггер</h4>
                    <p className="p-3 bg-slate-100 dark:bg-slate-700 rounded-md text-sm whitespace-pre-wrap">{log.trigger}</p>
                </div>
            )}
        </div>
      </div>
       <style>{`
        @keyframes scale-in {
            0% { transform: scale(0.95); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
            animation: scale-in 0.2s ease-out forwards;
        }
       `}</style>
    </div>
  );
};

const InfoSection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-slate-100">{title}</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {children}
        </dl>
    </div>
);

const InfoItem: React.FC<{label: string, value: string}> = ({ label, value }) => (
    <>
        <dt className="font-medium text-slate-500 dark:text-slate-400">{label}</dt>
        <dd className="font-semibold">{value || '-'}</dd>
    </>
);