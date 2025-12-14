
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { readDB, saveActivePlan, getActivePlan } from '../src/lib/server/db';
import { parsePeriodCSV, parseWorkloadCSV, convertCSVToWorkLogs } from '../src/lib/csvUtils';
import { calculateWorkingDays, fetchHolidays } from '../src/lib/holidays';
import { Member } from '../src/types';

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: npx tsx scripts/import.ts <periods|workload> <file_path>');
        process.exit(1);
    }

    const [type, filePath] = args;
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
        console.error(`File not found: ${absolutePath}`);
        process.exit(1);
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
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

    if (type === 'periods') {
        try {
            console.log('Fetching holidays...');
            let holidays = {};
            try {
                holidays = await fetchHolidays();
            } catch (e) {
                console.warn('Failed to fetch holidays, continuing without holiday data.', e);
            }

            console.log('Parsing periods...');
            const rawPeriods = parsePeriodCSV(content);
            const newPeriods = rawPeriods.map(p => ({
                ...p,
                id: uuidv4(),
                workingDays: calculateWorkingDays(p.startDate, p.endDate, holidays, plan!.settings)
            }));

            plan.periods = [...plan.periods, ...newPeriods];
            saveActivePlan(db, plan);
            console.log(`Successfully imported ${newPeriods.length} periods.`);
        } catch (e) {
            console.error('Error importing periods:', e);
            process.exit(1);
        }
    } else if (type === 'workload') {
        if (!plan.periods || plan.periods.length === 0) {
            console.error('No periods found in the plan. Please import periods first.');
            process.exit(1);
        }

        try {
            console.log('Parsing workload...');
            const csvRows = parseWorkloadCSV(content);

            const createMemberCallback = (name: string): Member => {
                const newMember: Member = {
                    id: uuidv4(),
                    name,
                    buffer: 5,
                    projectRatio: 50,
                    featureRatio: 50,
                };
                plan!.members.push(newMember);
                return newMember;
            };

            const workLogs = convertCSVToWorkLogs(
                csvRows,
                plan.periods,
                plan.members,
                createMemberCallback
            );

            plan.workLogs = [...plan.workLogs, ...workLogs];
            saveActivePlan(db, plan);
            console.log(`Successfully imported ${workLogs.length} work logs.`);
        } catch (e) {
            console.error('Error importing workload:', e);
            process.exit(1);
        }
    } else {
        console.error('Invalid import type. Use "periods" or "workload".');
        process.exit(1);
    }
}

main().catch(console.error);
