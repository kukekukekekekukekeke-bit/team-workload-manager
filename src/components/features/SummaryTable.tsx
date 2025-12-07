import React from "react";
import { calculateWorkingDays, Holidays } from "@/lib/holidays";
import { Member, Period, WorkLog, WorkType } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface SummaryTableProps {
    members: Member[];
    periods: Period[];
    displayType: "total" | "capacity" | "remaining";
    workType?: WorkType; // optional filter for project/feature
    withBuffer?: boolean; // apply buffer percentage
    getMemberLogs: (memberId: string, periodId: string) => WorkLog[];
    settings: any;
    holidays: Holidays;
}

export function SummaryTable({
    members,
    periods,
    displayType,
    workType,
    withBuffer = false,
    getMemberLogs,
    settings,
    holidays,
}: SummaryTableProps) {
    // helper to calculate capacity per period
    const calculateCapacity = (member: Member, period: Period) => {
        const workingDays = calculateWorkingDays(period.startDate, period.endDate, holidays, settings);
        const gross = workingDays * settings.defaultDailyHours;

        // Calculate leave hours from logs
        const logs = getMemberLogs(member.id, period.id);
        const leaveHours = logs
            .filter((l) => l.type === "leave")
            .reduce((sum, log) => sum + Number(log.hours), 0);

        const net = gross - leaveHours;
        const bufferFactor = withBuffer ? 1 - (member.buffer ?? 0) / 100 : 1;
        let capacity = net * bufferFactor;

        // Apply work type ratio if specified
        if (workType === 'project') {
            capacity = capacity * ((member.projectRatio ?? 0) / 100);
        } else if (workType === 'feature') {
            capacity = capacity * ((member.featureRatio ?? 0) / 100);
        }

        return capacity;
    };

    const getColorClass = (remaining: number, capacity: number) => {
        if (capacity === 0) return "";
        const percentage = (remaining / capacity) * 100;

        if (percentage <= 10) {
            return "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100";
        } else if (percentage <= 30) { // Yellow up to 30%
            return "bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100";
        } else {
            // Green for >30%
            return "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100";
        }
    };

    const renderCell = (member: Member, period: Period) => {
        const logs = getMemberLogs(member.id, period.id).filter((log) => !workType || log.type === workType);

        // For remaining capacity, we need to subtract the work done for the specific type
        // If workType is set, logs are already filtered.
        // If workType is NOT set (Total), we subtract all work (Project + Feature).
        const totalWork = logs
            .filter(l => l.type !== 'leave') // Exclude leave from "work done" as it's already in capacity
            .reduce((sum, log) => sum + Number(log.hours), 0);

        const capacity = calculateCapacity(member, period);
        const remaining = capacity - totalWork;

        let value: number;
        switch (displayType) {
            case "total":
                value = totalWork;
                break;
            case "capacity":
                value = capacity;
                break;
            case "remaining":
                value = remaining;
                break;
            default:
                value = 0;
        }

        const colorClass = displayType === "remaining" ? getColorClass(remaining, capacity) : "";

        return {
            cell: (
                <TableCell key={period.id} className={`text-center ${colorClass}`}>
                    {value.toFixed(1)}
                </TableCell>
            ),
            value
        };
    };

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">Member</TableHead>
                        {periods.map((p) => (
                            <TableHead key={p.id} className="min-w-[100px] text-center">
                                {p.name}
                            </TableHead>
                        ))}
                        <TableHead className="min-w-[100px] text-center font-bold">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {members.length > 0 && (
                        <TableRow className="bg-muted/50 font-bold border-b-2">
                            <TableCell>Total</TableCell>
                            {periods.map((period) => {
                                const total = members.reduce((sum, member) => {
                                    const logs = getMemberLogs(member.id, period.id).filter((log) => !workType || log.type === workType);
                                    const totalWork = logs
                                        .filter(l => l.type !== 'leave')
                                        .reduce((s, log) => s + Number(log.hours), 0);

                                    const capacity = calculateCapacity(member, period);
                                    const remaining = capacity - totalWork;

                                    let value = 0;
                                    switch (displayType) {
                                        case "total":
                                            value = totalWork;
                                            break;
                                        case "capacity":
                                            value = capacity;
                                            break;
                                        case "remaining":
                                            value = remaining;
                                            break;
                                    }
                                    return sum + value;
                                }, 0);
                                return <TableCell key={period.id} className="text-center">{total.toFixed(1)}</TableCell>;
                            })}
                            <TableCell className="text-center">
                                {members.reduce((grandTotal, member) => {
                                    return grandTotal + periods.reduce((memberTotal, period) => {
                                        const logs = getMemberLogs(member.id, period.id).filter((log) => !workType || log.type === workType);
                                        const totalWork = logs
                                            .filter(l => l.type !== 'leave')
                                            .reduce((s, log) => s + Number(log.hours), 0);

                                        const capacity = calculateCapacity(member, period);
                                        const remaining = capacity - totalWork;

                                        let value = 0;
                                        switch (displayType) {
                                            case "total":
                                                value = totalWork;
                                                break;
                                            case "capacity":
                                                value = capacity;
                                                break;
                                            case "remaining":
                                                value = remaining;
                                                break;
                                        }
                                        return memberTotal + value;
                                    }, 0);
                                }, 0).toFixed(1)}
                            </TableCell>
                        </TableRow>
                    )}
                    {members.map((member) => {
                        const cellsData = periods.map((period) => renderCell(member, period));
                        const rowTotal = cellsData.reduce((sum, data) => sum + data.value, 0);
                        const totalCapacity = periods.reduce((sum, period) => sum + calculateCapacity(member, period), 0);
                        const totalColorClass = displayType === "remaining" ? getColorClass(rowTotal, totalCapacity) : "";

                        return (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium">
                                    {member.name}
                                    <div className="flex flex-col gap-0.5">
                                        {withBuffer && (
                                            <div className="text-xs text-muted-foreground">
                                                Buf: {member.buffer}%
                                            </div>
                                        )}
                                        {(workType === 'project' || workType === 'feature') && (
                                            <div className="text-xs text-muted-foreground">
                                                Ratio: {workType === 'project' ? member.projectRatio : member.featureRatio}%
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                {cellsData.map(data => data.cell)}
                                <TableCell className={`text-center font-bold ${totalColorClass}`}>
                                    {rowTotal.toFixed(1)}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
