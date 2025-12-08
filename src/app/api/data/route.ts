
import { NextRequest, NextResponse } from 'next/server';
import { readDB } from '@/lib/server/db';

export async function GET(req: NextRequest) {
    const db = readDB();
    return NextResponse.json(db);
}
