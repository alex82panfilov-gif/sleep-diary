
import React, { useEffect, useRef } from 'react';
import { BellAlertIcon } from './Icons';

interface AlarmModalProps {
  isOpen: boolean;
  message: string;
  onDismiss: () => void;
  onSnooze: () => void;
}

const ALARM_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg';

export const AlarmModal: React.FC<AlarmModalProps> = ({ isOpen, message, onDismiss, onSnooze }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(ALARM_SOUND_URL);
      audioRef.current.loop = true;
    }

    if (isOpen) {
      audioRef.current.play().catch(error => {
        console.error("Audio playback failed:", error);
      });
    } else {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }

    return () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 md:p-8 w-11/12 max-w-md text-center transform transition-all animate-scale-in">
        <BellAlertIcon className="w-16 h-16 text-sky-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">{message}</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">Пожалуйста, подтвердите прием лекарства.</p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button
            onClick={onSnooze}
            className="w-full md:w-auto px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800 transition-colors"
          >
            Отложить (5 мин)
          </button>
          <button
            onClick={onDismiss}
            className="w-full md:w-auto px-6 py-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-slate-800 transition-colors"
          >
            Принял(а)
          </button>
        </div>
      </div>
       <style>{`
        @keyframes scale-in {
            0% { transform: scale(0.9); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
            animation: scale-in 0.3s ease-out forwards;
        }
       `}</style>
    </div>
  );
};
