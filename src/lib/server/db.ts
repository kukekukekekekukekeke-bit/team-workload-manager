
import fs from 'fs';
import path from 'path';
import { AppState, Period, WorkLog, Member } from '@/types';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

interface DBMS {
    plans: Array<{
        id: string;
        name: string;
        members: Member[];
        periods: Period[];
        workLogs: WorkLog[];
        settings: any;
    }>;
    activePlanId: string;
    staging?: {
        global?: {
            periods?: Period[];
            members?: Member[];
            workLogs?: WorkLog[];
        };
        byPlan?: Record<string, { // Key is Plan Name
            periods?: Period[];
            members?: Member[];
            workLogs?: WorkLog[];
        }>;
    };
}

const DEFAULT_DB: DBMS = {
    plans: [],
    activePlanId: '',
};

function ensureDB() {
    if (!fs.existsSync(path.dirname(DB_PATH))) {
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
    }
}

export function readDB(): DBMS {
    ensureDB();
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return DEFAULT_DB;
    }
}

export function writeDB(data: DBMS) {
    ensureDB();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function getActivePlan(db: DBMS) {
    if (!db.activePlanId && db.plans.length > 0) {
        db.activePlanId = db.plans[0].id;
    }
    return db.plans.find(p => p.id === db.activePlanId);
}

export function saveActivePlan(db: DBMS, plan: any) {
    if (!db.activePlanId) {
        db.activePlanId = plan.id;
        db.plans.push(plan);
    } else {
        const index = db.plans.findIndex(p => p.id === db.activePlanId);
        if (index !== -1) {
            db.plans[index] = plan;
        } else {
            db.plans.push(plan);
            db.activePlanId = plan.id;
        }
    }
    writeDB(db);
}

export function saveStagingData(db: DBMS, data: any, planName?: string) {
    if (!db.staging) {
        db.staging = { global: {}, byPlan: {} };
    }

    if (planName) {
        if (!db.staging.byPlan) db.staging.byPlan = {};
        // Overwrite existing staging data for this plan to prevent duplicates/ accumulation
        db.staging.byPlan[planName] = data;
    } else {
        // Overwrite existing global staging data
        db.staging.global = data;
    }
    writeDB(db);
}
