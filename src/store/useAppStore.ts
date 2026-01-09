import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Member, Period, WorkLog, Plan } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AppStore extends AppState {
    addPlan: (name: string) => void;
    updatePlanName: (id: string, name: string) => void;
    switchPlan: (id: string) => void;
    deletePlan: (id: string) => void;
    addMember: (member: Member) => void;
    updateMember: (id: string, updates: Partial<Member>) => void;
    deleteMember: (id: string) => void;
    addPeriod: (period: Period) => void;
    updatePeriod: (id: string, updates: Partial<Period>) => void;
    deletePeriod: (id: string) => void;
    addWorkLog: (log: WorkLog) => void;
    updateWorkLog: (id: string, updates: Partial<WorkLog>) => void;
    deleteWorkLog: (id: string) => void;
    updateSettings: (settings: Partial<AppState['plans'][0]['settings']>) => void;
    getMemberLogs: (memberId: string, periodId: string) => WorkLog[];
    getMemberTotalHours: (memberId: string, periodId: string) => number;
    importState: (state: AppState) => void;
    mergeImportedData: (data: Partial<Plan>) => void;
}

export const useAppStore = create<AppStore>()(
    persist(
        (set, get) => ({
            plans: [],
            activePlanId: '',

            // Plan Actions
            addPlan: (name) => {
                const newPlan = {
                    id: uuidv4(),
                    name,
                    members: [],
                    periods: [],
                    workLogs: [],
                    settings: {
                        defaultDailyHours: 7.5,
                        considerPublicHolidays: true,
                        companyHolidays: [],
                    },
                };
                set((state) => ({
                    plans: [...state.plans, newPlan],
                    activePlanId: newPlan.id,
                }));
            },
            updatePlanName: (id, name) =>
                set((state) => ({
                    plans: state.plans.map((p) =>
                        p.id === id ? { ...p, name } : p
                    ),
                })),
            switchPlan: (id) => set({ activePlanId: id }),
            deletePlan: (id) =>
                set((state) => {
                    const newPlans = state.plans.filter((p) => p.id !== id);
                    // If active plan is deleted, switch to the first available plan or empty
                    let newActiveId = state.activePlanId;
                    if (id === state.activePlanId) {
                        newActiveId = newPlans.length > 0 ? newPlans[0].id : '';
                    }
                    return { plans: newPlans, activePlanId: newActiveId };
                }),

            // Data Actions (operate on active plan)
            addMember: (member) =>
                set((state) => ({
                    plans: state.plans.map((p) =>
                        p.id === state.activePlanId
                            ? { ...p, members: [...p.members, member] }
                            : p
                    ),
                })),
            updateMember: (id, updates) =>
                set((state) => ({
                    plans: state.plans.map((p) =>
                        p.id === state.activePlanId
                            ? {
                                ...p,
                                members: p.members.map((m) =>
                                    m.id === id ? { ...m, ...updates } : m
                                ),
                            }
                            : p
                    ),
                })),
            deleteMember: (id) =>
                set((state) => ({
                    plans: state.plans.map((p) =>
                        p.id === state.activePlanId
                            ? { ...p, members: p.members.filter((m) => m.id !== id) }
                            : p
                    ),
                })),

            addPeriod: (period) =>
                set((state) => ({
                    plans: state.plans.map((p) =>
                        p.id === state.activePlanId
                            ? { ...p, periods: [...p.periods, period] }
                            : p
                    ),
                })),
            updatePeriod: (id, updates) =>
                set((state) => ({
                    plans: state.plans.map((p) =>
                        p.id === state.activePlanId
                            ? {
                                ...p,
                                periods: p.periods.map((period) =>
                                    period.id === id ? { ...period, ...updates } : period
                                ),
                            }
                            : p
                    ),
                })),
            deletePeriod: (id) =>
                set((state) => ({
                    plans: state.plans.map((p) =>
                        p.id === state.activePlanId
                            ? { ...p, periods: p.periods.filter((period) => period.id !== id) }
                            : p
                    ),
                })),

            addWorkLog: (log) =>
                set((state) => ({
                    plans: state.plans.map((p) =>
                        p.id === state.activePlanId
                            ? { ...p, workLogs: [...p.workLogs, log] }
                            : p
                    ),
                })),
            updateWorkLog: (id, updates) =>
                set((state) => ({
                    plans: state.plans.map((p) =>
                        p.id === state.activePlanId
                            ? {
                                ...p,
                                workLogs: p.workLogs.map((l) =>
                                    l.id === id ? { ...l, ...updates } : l
                                ),
                            }
                            : p
                    ),
                })),
            deleteWorkLog: (id) =>
                set((state) => ({
                    plans: state.plans.map((p) =>
                        p.id === state.activePlanId
                            ? { ...p, workLogs: p.workLogs.filter((l) => l.id !== id) }
                            : p
                    ),
                })),

            updateSettings: (newSettings) =>
                set((state) => ({
                    plans: state.plans.map((p) =>
                        p.id === state.activePlanId
                            ? { ...p, settings: { ...p.settings, ...newSettings } }
                            : p
                    ),
                })),

            getMemberLogs: (memberId, periodId) => {
                const state = get();
                const activePlan = state.plans.find((p) => p.id === state.activePlanId);
                if (!activePlan) return [];
                return activePlan.workLogs.filter(
                    (l) => l.memberId === memberId && l.periodId === periodId
                );
            },
            getMemberTotalHours: (memberId, periodId) => {
                const logs = get().getMemberLogs(memberId, periodId);
                return logs.reduce((sum, log) => sum + log.hours, 0);
            },
            importState: (newState) => set(newState),
            mergeImportedData: (data) =>
                set((state) => ({
                    plans: state.plans.map((p) => {
                        if (p.id !== state.activePlanId) return p;

                        // Helper to merge arrays preventing duplicates by ID (if IDs match)
                        // Note: If IDs are new UUIDs every time, this won't dedup by content, 
                        // but it prevents re-adding the exact same object if it was already there.
                        const mergeMembers = (current: Member[], incoming: Member[] | undefined) => {
                            if (!incoming) return current;
                            const existingNames = new Set(current.map(m => m.name));
                            const uniqueIncoming = incoming.filter(m => !existingNames.has(m.name));
                            return [...current, ...uniqueIncoming];
                        };

                        const mergePeriods = (current: Period[], incoming: Period[] | undefined) => {
                            if (!incoming) return current;
                            // We probably want to keep existing IDs for same-named periods?
                            // But since period IDs are used in logs, swapping IDs is tricky if logs refer to new IDs.
                            // Actually, the CLI maps logs to *existing* periods if found.
                            // If the CLI created NEW period objects for existing periods, that's bad.
                            // But import.ts uses `contextPlan` to find existing periods.
                            // So the incoming periods from CLI *might* be duplicates?
                            // The CLI `stagingData` creates new UUIDs for periods ONLY IF type='periods'.
                            // If type='workload', import.ts DOES NOT include periods in stagingData usually, unless forced?
                            // Wait, import.ts: `stagingData.periods = existingStaging.periods || []`
                            // If import workload relied on DB periods, it doesn't add them to stagingData.periods?
                            // Correct: `stagingData` ONLY has periods if we ran `import periods`.

                            // So if we merge PERIODS, we should check names.
                            const existingPeriodNames = new Map(current.map(p => [p.name, p.id]));
                            const uniqueIncoming = incoming.filter(p => !existingPeriodNames.has(p.name));
                            return [...current, ...uniqueIncoming];
                        };

                        const mergeWorkLogs = (current: WorkLog[], incoming: WorkLog[] | undefined, members: Member[], periods: Period[]) => {
                            if (!incoming) return current;
                            // CLI generates new UUIDs, so we must dedup by content.
                            // Key: MemberName + PeriodName + TaskName + Type + Hours?
                            // Wait, MemberID/PeriodID in incoming might refer to:
                            // 1. Existing IDs (if CLI found them)
                            // 2. New IDs (if CLI created new Members/Periods)

                            // Problem: If CLI created "Member A" (id: New1) but we already have "Member A" (id: Old1),
                            // the incoming logs use New1. If we just merge members by name, we keep Old1.
                            // Then logs pointing to New1 will be orphaned or invalid.

                            // We need to RE-MAP incoming logs to use the FINAL member/period IDs.

                            const memberMap = new Map<string, string>(); // Name -> Final ID
                            members.forEach(m => memberMap.set(m.name, m.id));

                            const periodMap = new Map<string, string>(); // Name -> Final ID
                            periods.forEach(p => periodMap.set(p.name, p.id));

                            // Helper to resolve ID. 
                            // We must find the NAME of the member referenced by incoming ID, then look up Final ID.
                            // But incoming data might not include the Member object if it was already in DB? 
                            // CLI import sends `stagingData.members` which includes NEW members.
                            // What if CLI used an existing member? It doesn't put it in `stagingData.members`.
                            // So we can't look up name from `incoming` logs easily if we don't have the source map.

                            // CLI import.ts:
                            // `existingMemberMap` is used.
                            // If member exists, it uses existing ID.
                            // If member is new, it creates new ID and adds to `stagingData.members`.
                            // So incoming logs *should* already use the correct IDs for EXISTING members/periods.
                            // For NEW members/periods, they use the IDs from `stagingData.members/periods`.
                            // Since we merge `stagingData.members` first (deduplicating by name), 
                            // if we skipped a "New Member" because it name-clashed (e.g. race condition), 
                            // we must ensure logs use the OLD member's ID.

                            // BUT wait, if `import.ts` saw the member existed, it used the EXISTING ID.
                            // So the only risk is if `import.ts` thought it was new (generated NewID), 
                            // but Client says "Actually I already have it (OldID)".
                            // In that case, we must remap NewID -> OldID.

                            // Let's build a map from IncomingID -> FinalID.
                            const idMap = new Map<string, string>();

                            // Check Members
                            if (data.members) {
                                data.members.forEach(incM => {
                                    const finalId = memberMap.get(incM.name);
                                    if (finalId && finalId !== incM.id) {
                                        idMap.set(incM.id, finalId);
                                    }
                                });
                            }
                            // Check Periods
                            if (data.periods) {
                                data.periods.forEach(incP => {
                                    const finalId = periodMap.get(incP.name);
                                    if (finalId && finalId !== incP.id) {
                                        idMap.set(incP.id, finalId);
                                    }
                                });
                            }

                            const processedIncoming = incoming.map(log => ({
                                ...log,
                                memberId: idMap.get(log.memberId) || log.memberId,
                                periodId: idMap.get(log.periodId) || log.periodId,
                            }));

                            // Now de-dup logs using exact matches (Member+Period+Task+Type)

                            // Key generation helper
                            const getLogKey = (log: WorkLog) => `${log.memberId}-${log.periodId}-${log.taskName}-${log.type}`;

                            // Create a map of incoming logs by key. Later incoming logs overwrite earlier incoming logs (if duplicates in CSV).
                            const incomingMap = new Map<string, WorkLog>();
                            processedIncoming.forEach(log => {
                                incomingMap.set(getLogKey(log), log);
                            });

                            // Filter current logs: Remove any log that exists in incomingMap (because we want to overwrite it)
                            const preservedCurrent = current.filter(curr => !incomingMap.has(getLogKey(curr)));

                            // Return preserved current logs + all incoming logs (values of map)
                            return [...preservedCurrent, ...Array.from(incomingMap.values())];
                        };

                        const mergedMembers = mergeMembers(p.members, data.members);
                        const mergedPeriods = mergePeriods(p.periods, data.periods);

                        return {
                            ...p,
                            periods: mergedPeriods,
                            members: mergedMembers,
                            workLogs: mergeWorkLogs(p.workLogs, data.workLogs, mergedMembers, mergedPeriods),
                        };
                    }),
                })),
        }),
        {
            name: 'team-workload-storage',
            version: 1,
            migrate: (persistedState: any, version: number) => {
                if (version === 0 || !version) {
                    // Migration from version 0 (no plans) to version 1
                    const defaultPlanId = uuidv4();
                    return {
                        plans: [
                            {
                                id: defaultPlanId,
                                name: 'Default Plan',
                                members: persistedState.members || [],
                                periods: persistedState.periods || [],
                                workLogs: persistedState.workLogs || [],
                                settings: persistedState.settings || {
                                    defaultDailyHours: 7.5,
                                    considerPublicHolidays: true,
                                    companyHolidays: [],
                                },
                            },
                        ],
                        activePlanId: defaultPlanId,
                    };
                }
                return persistedState as AppState;
            },
        }
    )
);
