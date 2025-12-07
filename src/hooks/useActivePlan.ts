import { useAppStore } from '@/store/useAppStore';
import { useMemo } from 'react';

export function useActivePlan() {
    const store = useAppStore();
    const activePlan = store.plans.find((p) => p.id === store.activePlanId);

    return useMemo(() => {
        if (!activePlan) {
            return {
                members: [],
                periods: [],
                workLogs: [],
                settings: {
                    defaultDailyHours: 7.5,
                    considerPublicHolidays: true,
                    companyHolidays: [],
                },
                ...store, // Expose actions
            };
        }

        return {
            members: activePlan.members,
            periods: activePlan.periods,
            workLogs: activePlan.workLogs,
            settings: activePlan.settings,
            ...store, // Expose actions and other store props
        };
    }, [activePlan, store]);
}
