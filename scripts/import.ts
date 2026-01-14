
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { readDB, saveActivePlan, getActivePlan, saveStagingData } from '../src/lib/server/db';
import { parsePeriodCSV, parseWorkloadCSV, convertCSVToWorkLogs } from '../src/lib/csvUtils';
import { calculateWorkingDays, fetchHolidays } from '../src/lib/holidays';
import { Member } from '../src/types';

async function main() {
    const rawArgs = process.argv.slice(2);
    let planName: string | undefined = undefined;
    let type = "";
    let filePath = "";

    // Argument Parsing
    for (let i = 0; i < rawArgs.length; i++) {
        if (rawArgs[i] === '--plan') {
            if (i + 1 < rawArgs.length) {
                planName = rawArgs[i + 1];
                i++; // Skip next arg
            } else {
                console.error('Error: --plan argument requires a value');
                process.exit(1);
            }
        } else if (!type) {
            type = rawArgs[i];
        } else if (!filePath) {
            filePath = rawArgs[i];
        }
    }

    if (!type || !filePath) {
        console.error('Usage: npx tsx scripts/import.ts <periods|workload> <file_path> [--plan "Plan Name"]');
        process.exit(1);
    }

    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
        console.error(`File not found: ${absolutePath}`);
        process.exit(1);
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const db = readDB();

    // Prepare staging data structure
    // Valid staging data must consist of arrays of periods, members, and workLogs
    const stagingData: {
        periods: any[],
        members: any[],
        workLogs: any[]
    } = {
        periods: [],
        members: [],
        workLogs: []
    };

    // If importing workload, we might need period info to calculate things, 
    // but for staging we just want to parse the data. 
    // However, convertCSVToWorkLogs needs existing periods/members TO MATCH against them.
    // If we are staging, maybe we don't have them yet? 
    // BUT the requirement is to use existing Period info if available?
    // Actually, `convertCSVToWorkLogs` takes `periods` as input to find period IDs by date.
    // If we are importing workload, we assume periods exist either in DB or locally?
    // Let's use the DB's Active Plan or Default Plan logic JUST for context (like Settings),
    // but we will NOT save to it.

    // We try to find a relevant plan to pull context (settings, existing periods for lookup)
    let contextPlan = getActivePlan(db);
    if (planName) {
        contextPlan = db.plans.find((p: any) => p.name === planName) || contextPlan;
    }

    // Default context if absolutely nothing exists
    const mockSettings = contextPlan?.settings || {
        defaultDailyHours: 7.5,
        considerPublicHolidays: true,
        companyHolidays: [],
    };
    const contextPeriods = contextPlan?.periods || [];
    const contextMembers = contextPlan?.members || [];

    if (type === 'periods') {
        try {
            console.log('Fetching holidays...');
            let holidays = {};
            try {
                holidays = await fetchHolidays();
            } catch (e) {
                // console.warn('Failed to fetch holidays...', e);
            }

            console.log('Parsing periods...');
            const rawPeriods = parsePeriodCSV(content);
            const newPeriods = rawPeriods.map(p => ({
                ...p,
                id: uuidv4(),
                workingDays: calculateWorkingDays(p.startDate, p.endDate, holidays, mockSettings)
            }));

            stagingData.periods = newPeriods;

            // Should we preserve existing staging data? 
            // The requirement says "run twice... last one wins".
            // So we overwrite the *new* part but what if one command imports periods and next imports workload?
            // "Last execution to take precedence" - if I run periods then workload, I want both?
            // "2回連続で実行した際は最後に実行したものを優先" -> usually applies to same type of data or conflicting data.
            // If I run import periods, then import workload, I probably want both to be staged. 
            // But strict interpretation: "Last execution" might mean "The Result of the Last Command".
            // BUT `saveStagingData` implementation overwrites the whole object for the plan.
            // So we must read *existing* staging data if we want to support cumulative different types?
            // User: "2回連続で実行した際...２回分マージされて画面に表示されてしまう" -> This implies they ran the SAME command (or added more data) and got duplicates.
            // If I overwrite 'periods' but keep 'workload', that's probably best.
            // Implementation detail: Let's allow merging 'periods' and 'workload' if they are different commands, 
            // but if I run 'periods' again it replaces 'periods'.
            // Actually, `saveStagingData` currently overwrites `byPlan[planName]`. 
            // So running `periods` then `workload` would DELETE `periods` from staging if we are not careful.
            // Let's modify `import.ts` to READ existing staging first.

            let existingStaging = db.staging?.global;
            if (planName && db.staging?.byPlan) {
                existingStaging = db.staging.byPlan[planName];
            }
            if (existingStaging) {
                // We keep the OTHER type's data
                stagingData.members = existingStaging.members || [];
                stagingData.workLogs = existingStaging.workLogs || [];
            }

            saveStagingData(db, stagingData, planName);
            console.log(`Successfully STAGED ${newPeriods.length} periods for ${planName || 'Global'}.`);
        } catch (e) {
            console.error('Error importing periods:', e);
            process.exit(1);
        }
    } else if (type === 'workload') {
        // Validation: Need periods to parse workload (for date mapping)
        if (contextPeriods.length === 0 && (!stagingData.periods || stagingData.periods.length === 0)) {
            // Check if we have periods in staging?
            const stagedPeriods = (planName && db.staging?.byPlan?.[planName]?.periods) || db.staging?.global?.periods;
            if (!stagedPeriods || stagedPeriods.length === 0) {
                console.error('No periods found in DB or Staging. Please import periods first.');
                process.exit(1);
            }
            // Use staged periods for context if available
            contextPeriods.push(...stagedPeriods);
        }

        try {
            console.log('Parsing workload...');
            const csvRows = parseWorkloadCSV(content);

            // Access to members to avoid duplicates or create new ones
            const existingMemberMap = new Map(contextMembers.map((m: Member) => [m.name, m]));
            // Also check staged members
            let existingStaging = db.staging?.global;
            if (planName && db.staging?.byPlan) {
                existingStaging = db.staging.byPlan[planName];
            }
            if (existingStaging && existingStaging.members) {
                existingStaging.members.forEach((m: Member) => existingMemberMap.set(m.name, m));
            }

            // We need to capture ALL referenced members to ensure the client can map IDs correctly
            const referencedMembers = new Map<string, Member>();

            const createMemberCallback = (name: string): Member => {
                let member: Member;
                if (existingMemberMap.has(name)) {
                    member = existingMemberMap.get(name)!;
                } else {
                    member = {
                        id: uuidv4(),
                        name,
                        buffer: 5,
                        projectRatio: 50,
                        featureRatio: 50,
                    };
                    existingMemberMap.set(name, member);
                }
                referencedMembers.set(member.id, member);
                return member;
            };

            const workLogs = convertCSVToWorkLogs(
                csvRows,
                contextPeriods, // Use context (DB + Staged) periods
                [...contextMembers], // Pass simple array, but callback handles lookup
                createMemberCallback
            );

            // Preserve existing staging (e.g. periods)
            // But we ALSO need to include the periods used in this import for ID mapping!
            // contextPeriods contains the periods used.
            // If we combine them properly:

            // First, start with existing staged periods if any
            let finalPeriods: any[] = [];
            if (existingStaging && existingStaging.periods) {
                finalPeriods = [...existingStaging.periods];
            }
            // Add contextPeriods if they are not already in finalPeriods (by ID)
            const finalPeriodIds = new Set(finalPeriods.map((p: any) => p.id));
            contextPeriods.forEach((p: any) => {
                if (!finalPeriodIds.has(p.id)) {
                    finalPeriods.push(p);
                    finalPeriodIds.add(p.id);
                }
            });
            stagingData.periods = finalPeriods;


            // For members, we include all referenced members plus any that were already staged 
            // (though technically we only need referenced ones for these logs, but keeping previous staged members is safe)
            const finalMembers = new Map<string, Member>();

            // Add existing staged members first
            if (existingStaging && existingStaging.members) {
                existingStaging.members.forEach((m: Member) => finalMembers.set(m.id, m));
            }

            // Add referenced members (overwrites if same ID, which is fine)
            referencedMembers.forEach(m => finalMembers.set(m.id, m));

            stagingData.members = Array.from(finalMembers.values());
            stagingData.workLogs = workLogs;

            saveStagingData(db, stagingData, planName);
            console.log(`Successfully STAGED ${workLogs.length} work logs and ${stagingData.members.length} referenced members for ${planName || 'Global'}.`);
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
