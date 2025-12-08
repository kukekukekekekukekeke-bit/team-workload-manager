
import { NextRequest, NextResponse } from 'next/server';
import { readDB, saveActivePlan, getActivePlan } from '@/lib/server/db';
import { parsePeriodCSV } from '@/lib/csvUtils';
import { calculateWorkingDays, fetchHolidays } from '@/lib/holidays';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const text = await req.text();
        const db = readDB();
        let plan = getActivePlan(db);

        if (!plan) {
            plan = {
                id: uuidv4(),
                name: 'Default Plan',
                members: [],
                periods: [],
                workLogs: [],
                settings: {
                    defaultDailyHours: 7.5,
                    considerPublicHolidays: true,
                    companyHolidays: [],
                },
            };
        }

        const rawPeriods = parsePeriodCSV(text);

        let holidays = {};
        try {
            holidays = await fetchHolidays();
        } catch (e) {
            console.warn("Failed to fetch holidays", e);
        }

        const newPeriods = rawPeriods.map(p => {
            const days = calculateWorkingDays(p.startDate, p.endDate, holidays, plan!.settings);
            return {
                ...p,
                id: uuidv4(),
                workingDays: days
            };
        });

        plan.periods = [...plan.periods, ...newPeriods];

        saveActivePlan(db, plan);

        return NextResponse.json({ success: true, count: newPeriods.length, periods: newPeriods });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
    }
}
