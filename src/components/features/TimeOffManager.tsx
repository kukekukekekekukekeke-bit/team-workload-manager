"use client";

import { useActivePlan } from "@/hooks/useActivePlan";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { WorkLog } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { fetchHolidays, calculateWorkingDays, Holidays } from "@/lib/holidays";

export function TimeOffManager() {
    const { members, periods, getMemberLogs, addWorkLog, updateWorkLog, settings } = useActivePlan();
    const [selectedCell, setSelectedCell] = useState<{
        memberId: string;
        periodId: string;
    } | null>(null);
    const [hours, setHours] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [holidays, setHolidays] = useState<Holidays>({});

    useEffect(() => {
        const loadHolidays = async () => {
            const data = await fetchHolidays();
            setHolidays(data);
        };
        loadHolidays();
    }, []);

    const handleCellClick = (memberId: string, periodId: string) => {
        setSelectedCell({ memberId, periodId });
        const logs = getMemberLogs(memberId, periodId).filter((l) => l.type === "leave");
        const totalLeave = logs.reduce((sum, log) => sum + log.hours, 0);
        setHours(totalLeave);
        setIsOpen(true);
    };

    const handleSave = () => {
        if (!selectedCell) return;

        const { memberId, periodId } = selectedCell;
        const logs = getMemberLogs(memberId, periodId).filter((l) => l.type === "leave");

        const existingLog = logs[0];

        if (existingLog) {
            if (hours === 0) {
                updateWorkLog(existingLog.id, { hours: 0 });
            } else {
                updateWorkLog(existingLog.id, { hours });
            }
        } else if (hours > 0) {
            const newLog: WorkLog = {
                id: uuidv4(),
                memberId,
                periodId,
                type: "leave",
                taskName: "Time Off",
                hours,
            };
            addWorkLog(newLog);
        }

        setIsOpen(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Time Off Management</h2>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Member</TableHead>
                            {periods.map((period) => {
                                const workingDays = calculateWorkingDays(
                                    period.startDate,
                                    period.endDate,
                                    holidays,
                                    settings
                                );
                                return (
                                    <TableHead key={period.id} className="text-center">
                                        {period.name}
                                        <div className="text-xs font-normal text-muted-foreground">
                                            {workingDays} days
                                        </div>
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium">{member.name}</TableCell>
                                {periods.map((period) => {
                                    const logs = getMemberLogs(member.id, period.id).filter(
                                        (l) => l.type === "leave"
                                    );
                                    const totalLeave = logs.reduce(
                                        (sum, log) => sum + log.hours,
                                        0
                                    );
                                    return (
                                        <TableCell
                                            key={period.id}
                                            className="text-center cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleCellClick(member.id, period.id)}
                                        >
                                            {totalLeave > 0 ? (
                                                <span className="text-red-500 font-medium">
                                                    {totalLeave}h
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Time Off</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="hours" className="text-right">
                                Hours
                            </Label>
                            <Input
                                id="hours"
                                type="number"
                                value={hours}
                                onChange={(e) => setHours(Number(e.target.value))}
                                className="col-span-3"
                                step="0.5"
                            />
                        </div>
                    </div>
                    <Button onClick={handleSave}>Save</Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
