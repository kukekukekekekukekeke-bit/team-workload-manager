import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/server/db';

export async function POST(req: NextRequest) {
    try {
        const { target, planName } = await req.json();
        const db = readDB();

        if (db.staging) {
            if (target === 'global') {
                db.staging.global = {};
            } else if (target === 'plan' && planName) {
                if (db.staging.byPlan && db.staging.byPlan[planName]) {
                    delete db.staging.byPlan[planName];
                }
            } else if (target === 'all') {
                db.staging.global = {};
                db.staging.byPlan = {};
            }
        }

        writeDB(db);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ success: false, error: 'Failed to clear staging' }, { status: 500 });
    }
}
