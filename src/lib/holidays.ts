import { addDays, isWeekend, format, parseISO, startOfDay } from 'date-fns';
import { Settings } from '@/types';

const HOLIDAY_API_URL = 'https://holidays-jp.github.io/api/v1/date.json';

export interface Holidays {
    [date: string]: string;
}

export async function fetchHolidays(): Promise<Holidays> {
    try {
        const response = await fetch(HOLIDAY_API_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch holidays');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching holidays:', error);
        return {};
    }
}

export function calculateWorkingDays(
    startDate: string,
    endDate: string,
    holidays: Holidays,
    settings: Settings
): number {
    let count = 0;
    let current = startOfDay(parseISO(startDate));
    const end = startOfDay(parseISO(endDate));

    while (current <= end) {
        const dateString = format(current, 'yyyy-MM-dd');
        const isPublicHoliday = settings.considerPublicHolidays && holidays[dateString];
        const isCompanyHoliday = settings.companyHolidays?.includes(dateString) ?? false;

        if (!isWeekend(current) && !isPublicHoliday && !isCompanyHoliday) {
            count++;
        }
        current = addDays(current, 1);
    }

    return count;
}
