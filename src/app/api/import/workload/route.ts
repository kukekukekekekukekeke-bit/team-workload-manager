
import { NextRequest, NextResponse } from 'next/server';
import { readDB, saveActivePlan, getActivePlan } from '@/lib/server/db';
import { parseWorkloadCSV, convertCSVToWorkLogs } from '@/lib/csvUtils';
import { v4 as uuidv4 } from 'uuid';
import { Member } from '@/types';

export async function POST(req: NextRequest) {
    try {
        const text = await req.text();
        const db = readDB();
        let plan = getActivePlan(db);

        if (!plan) {
            return NextResponse.json({ error: 'No active plan found. Please import periods first.' }, { status: 400 });
        }

        if (!plan.periods || plan.periods.length === 0) {
            return NextResponse.json({ error: 'No periods found. Please import periods first.' }, { status: 400 });
        }

        const csvRows = parseWorkloadCSV(text);

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

        return NextResponse.json({ success: true, count: workLogs.length });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
    }
}
