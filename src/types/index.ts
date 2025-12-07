export type WorkType = 'project' | 'feature' | 'leave';

export interface Member {
    id: string;
    name: string;
    // capacity is now calculated dynamically
    buffer: number; // Buffer percentage (0-100)
    projectRatio: number; // Target percentage for project work (e.g., 50)
    featureRatio: number; // Target percentage for feature work (e.g., 50)
}

export interface Period {
    id: string;
    name: string; // e.g., "11/16 Week"
    startDate: string; // ISO Date string
    endDate: string; // ISO Date string
    workingDays: number; // Number of working days in this period
}

export interface WorkLog {
    id: string;
    memberId: string;
    periodId: string;
    type: WorkType;
    taskName: string; // Description of the task
    hours: number;
}

export interface Plan {
    id: string;
    name: string;
    members: Member[];
    periods: Period[];
    workLogs: WorkLog[];
    settings: Settings;
}

export interface AppState {
    // Multi-plan support
    plans: Plan[];
    activePlanId: string;

    // Plan Actions
    addPlan: (name: string) => void;
    updatePlanName: (id: string, name: string) => void;
    switchPlan: (id: string) => void;
    deletePlan: (id: string) => void;

    // Data Actions (operate on active plan)
    addMember: (member: Member) => void;
    updateMember: (id: string, updates: Partial<Member>) => void;
    deleteMember: (id: string) => void;

    addPeriod: (period: Period) => void;
    updatePeriod: (id: string, updates: Partial<Period>) => void;
    deletePeriod: (id: string) => void;

    addWorkLog: (log: WorkLog) => void;
    updateWorkLog: (id: string, updates: Partial<WorkLog>) => void;
    deleteWorkLog: (id: string) => void;

    // Helpers
    getMemberLogs: (memberId: string, periodId: string) => WorkLog[];
    getMemberTotalHours: (memberId: string, periodId: string) => number;

    // Settings (operate on active plan)
    updateSettings: (settings: Partial<Settings>) => void;
}

export interface Settings {
    defaultDailyHours: number;
    considerPublicHolidays: boolean;
    companyHolidays: string[]; // List of ISO date strings
}
