import { GoogleGenAI } from "@google/genai";
import type { LogEntry } from '../types';

// FIX: Per @google/genai coding guidelines, the API key must be read directly from 
// process.env.API_KEY and its existence is assumed. Redundant checks and intermediate
// constants for the API key have been removed.
const ai = new GoogleGenerativeAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

function formatLogsForPrompt(logs: LogEntry[]): string {
    if (logs.length === 0) {
        return "Нет данных для анализа.";
    }

    const logStrings = logs.map(log => {
        let wakingsString = 'Не просыпался';
        if (log.wokeUpAtNight && log.nightWakings?.length > 0) {
            wakingsString = `${log.nightWakings.length} раз(а): ` + log.nightWakings.map(w => `(проснулся в ${w.wakeTime}, уснул в ${w.backToSleepTime})`).join('; ');
        }

        return `Дата: ${log.date}
- Лег спать: ${log.bedtime}
- Проснулся: ${log.wakeupTime}
- Ночные пробуждения: ${wakingsString}
- Статус дня: ${log.isRedDay ? 'Раннее пробуждение' : 'Нормальное пробуждение'}
- Утренние лекарства: ${log.morningMeds.name} (${log.morningMeds.dosage})
- Вечерние лекарства: ${log.eveningMeds.name} (${log.eveningMeds.dosage})
- Заметки: ${log.notes || 'Нет заметок'}
`;
    });

    return `Вот данные из дневника сна ребенка с эпилепсией за период с ${logs[logs.length - 1].date} по ${logs[0].date}:\n\n${logStrings.join('\n')}`;
}

export async function generateAnalysis(logs: LogEntry[]): Promise<string> {
    if (logs.length === 0) {
        return "Недостаточно данных для анализа. Пожалуйста, выберите период с записями.";
    }
    
    const model = 'gemini-2.5-flash';
    const formattedLogs = formatLogsForPrompt(logs);
    
    const prompt = `
Ты — эмпатичный ассистент, помогающий анализировать дневник сна ребенка с эпилепсией. 
Твоя задача — проанализировать предоставленные данные и дать краткий, структурированный и понятный обзор. 
Не давай медицинских советов и не ставь диагнозов. 
Подчеркни, что эта информация должна быть показана лечащему врачу.

Проанализируй следующие данные:
${formattedLogs}

Твой ответ должен включать:
1.  **Общая сводка**: Сколько всего дней проанализировано, сколько из них были с ранним пробуждением ("красные дни").
2.  **Анализ ночных пробуждений**: Есть ли дни с ночными пробуждениями? Связаны ли они с "красными днями" или другими факторами из заметок?
3.  **Тенденции**: Есть ли заметные закономерности? Например, стали ли "красные дни" или ночные пробуждения чаще или реже?
4.  **Ключевые наблюдения**: Укажи на любые интересные моменты из заметок, если они есть.
5.  **Рекомендация**: Напомни, что результаты анализа следует обсудить с врачом.

Ответ должен быть на русском языке.
`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Ошибка при вызове Gemini API:", error);
        throw new Error("Не удалось получить ответ от AI. Пожалуйста, попробуйте позже.");
    }
}
