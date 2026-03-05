import { MONTHS } from './constants';

export const sanitizeInput = (input: string): string => {
    return input
        .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
        .slice(0, 100); // Limit to 100 characters
};

export const isValidDate = (year: string, month: string, day: string): boolean => {
    if (!year || !month || !day) return false;

    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);

    if (isNaN(y) || isNaN(m) || isNaN(d)) return false;

    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
};

export const getDaysForMonth = (month: string, year: string): string[] => {
    if (!month || !year) return Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    let daysInMonth = MONTHS.find(m => m.val === month)?.days || 31;

    if (monthNum === 2) {
        const isLeapYear = (yearNum % 4 === 0 && yearNum % 100 !== 0) || (yearNum % 400 === 0);
        daysInMonth = isLeapYear ? 29 : 28;
    }

    return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, '0'));
};

export const convertTo24Hour = (hour: string, minute: string, period: 'AM' | 'PM'): string => {
    let h = parseInt(hour, 10);
    const m = minute.padStart(2, '0');

    if (period === 'PM' && h !== 12) {
        h += 12;
    } else if (period === 'AM' && h === 12) {
        h = 0;
    }

    return `${h.toString().padStart(2, '0')}:${m}:00`;
};

export const parseTimeToParts = (timeString: string | undefined): { hour: string; minute: string; period: 'AM' | 'PM' } => {
    if (!timeString) return { hour: '', minute: '', period: 'AM' };

    const [h, m] = timeString.split(':');
    let hour = parseInt(h, 10);
    const period = hour >= 12 ? 'PM' as const : 'AM' as const;

    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;

    return {
        hour: hour.toString().padStart(2, '0'),
        minute: m,
        period
    };
};
