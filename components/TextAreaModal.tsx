import React, { useState, useEffect, useRef } from 'react';

interface TextAreaModalProps {
  isOpen: boolean;
  title: string;
  initialValue: string;
  onSave: (newValue: string) => void;
  onClose: () => void;
}

export const TextAreaModal: React.FC<TextAreaModalProps> = ({
  isOpen,
  title,
  initialValue,
  onSave,
  onClose,
}) => {
  const [text, setText] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setText(initialValue);
      // Autofocus textarea when modal opens
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave(text);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col p-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <button
          onClick={onClose}
          className="text-white text-3xl leading-none"
          aria-label="Закрыть"
        >
          &times;
        </button>
      </div>
      <div className="flex-grow flex flex-col bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-full flex-grow p-4 bg-transparent text-slate-800 dark:text-slate-200 resize-none border-0 focus:ring-0 text-lg"
          placeholder="Введите текст..."
        />
      </div>
      <div className="flex-shrink-0 mt-4">
        <button
          onClick={handleSave}
          className="w-full px-6 py-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-slate-900 transition-colors"
        >
          Готово
        </button>
      </div>
       <style>{`
        @keyframes fade-in {
            0% { opacity: 0; }
            100% { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.2s ease-out forwards;
        }
       `}</style>
    </div>
  );
};