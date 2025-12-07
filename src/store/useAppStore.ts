import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Member, Period, WorkLog } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const useAppStore = create<AppState>()(
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
