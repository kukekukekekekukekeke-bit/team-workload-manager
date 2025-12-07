import { useState, useEffect } from "react";
import { useActivePlan } from "@/hooks/useActivePlan";
import { Member, Period, WorkLog, WorkType } from "@/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { v4 as uuidv4 } from "uuid";
import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchHolidays, calculateWorkingDays, Holidays } from "@/lib/holidays";
import { SummaryTable } from "./SummaryTable";

export function WorkloadGrid() {
    const { members, periods, addWorkLog, updateWorkLog, deleteWorkLog, getMemberLogs, settings } = useActivePlan();
    const [editingCell, setEditingCell] = useState<{
        memberId: string;
        periodId: string;
    } | null>(null);
    const [selectedWorkType, setSelectedWorkType] = useState<WorkType>("project");
    const [holidays, setHolidays] = useState<Holidays>({});

    // View Controls
    const [viewMode, setViewMode] = useState<"total" | "capacity" | "remaining">("total");
    const [filterWorkType, setFilterWorkType] = useState<"all" | "project" | "feature">("all");
    const [showBuffer, setShowBuffer] = useState(false);

    useEffect(() => {
        const loadHolidays = async () => {
            const data = await fetchHolidays();
            setHolidays(data);
        };
        loadHolidays();
    }, []);

    return (
        <div className="space-y-6">
            {/* Control Toolbar */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/20 rounded-lg border">
                <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">View Mode</Label>
                    <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                        <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder="Select View" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="total">Total Work</SelectItem>
                            <SelectItem value="capacity">Capacity</SelectItem>
                            <SelectItem value="remaining">Remaining Capacity</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Filter Work</Label>
                    <Select value={filterWorkType} onValueChange={(v: any) => setFilterWorkType(v)}>
                        <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder="Filter Work" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Work</SelectItem>
                            <SelectItem value="project">Project Only</SelectItem>
                            <SelectItem value="feature">Feature Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Options</Label>
                    <div className="flex items-center space-x-2 h-10">
                        <Switch
                            id="buffer-mode"
                            checked={showBuffer}
                            onCheckedChange={setShowBuffer}
                        />
                        <Label htmlFor="buffer-mode" className="cursor-pointer font-normal">Apply Buffer</Label>
                    </div>
                </div>
            </div>

            {/* Summary Table */}
            <div className="rounded-md border bg-card">
                <div className="p-4 border-b">
                    <h3 className="font-semibold text-lg">
                        {viewMode === "total" && "Total Workload"}
                        {viewMode === "capacity" && "Team Capacity"}
                        {viewMode === "remaining" && "Remaining Capacity"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {viewMode === "total" && "Total hours logged per member."}
                        {viewMode === "capacity" && "Theoretical capacity based on working days."}
                        {viewMode === "remaining" && "Capacity minus logged work."}
                        {showBuffer && " (Buffer Applied)"}
                    </p>
                </div>
                <div className="p-4">
                    <SummaryTable
                        members={members}
                        periods={periods}
                        displayType={viewMode}
                        workType={filterWorkType === "all" ? undefined : filterWorkType}
                        withBuffer={showBuffer}
                        getMemberLogs={getMemberLogs}
                        settings={settings}
                        holidays={holidays}
                    />
                </div>
            </div>

            {/* Detailed Workload Grid */}
            <div className="space-y-2">
                <div className="px-1">
                    <h3 className="font-semibold text-lg">Detailed Workload</h3>
                    <p className="text-sm text-muted-foreground">Click on any cell to manage specific tasks and hours.</p>
                </div>
                <div className="rounded-md border overflow-hidden">
                    <WorkloadTable
                        members={members}
                        periods={periods}
                        getMemberLogs={getMemberLogs}
                        onCellClick={(memberId, periodId) => setEditingCell({ memberId, periodId })}
                        holidays={holidays}
                        settings={settings}
                        filterWorkType={filterWorkType === "all" ? undefined : filterWorkType}
                    />
                </div>
            </div>

            {/* Edit Dialog */}
            {editingCell && (
                <WorkLogEditor
                    isOpen={!!editingCell}
                    onClose={() => setEditingCell(null)}
                    memberId={editingCell.memberId}
                    periodId={editingCell.periodId}
                    memberName={members.find((m) => m.id === editingCell.memberId)?.name || ""}
                    periodName={periods.find((p) => p.id === editingCell.periodId)?.name || ""}
                    workLogs={getMemberLogs(editingCell.memberId, editingCell.periodId)}
                    onAddLog={addWorkLog}
                    onUpdateLog={updateWorkLog}
                    onDeleteLog={deleteWorkLog}
                    workType={selectedWorkType}
                    setWorkType={setSelectedWorkType}
                    holidays={holidays}
                    settings={settings}
                />
            )}
        </div>
    );
}

interface WorkloadTableProps {
    members: Member[];
    periods: Period[];
    getMemberLogs: (memberId: string, periodId: string) => WorkLog[];
    settings: any;
    holidays: Holidays;
    onCellClick: (memberId: string, periodId: string) => void;
    filterWorkType?: WorkType;
}

function WorkloadTable({
    members,
    periods,
    getMemberLogs,
    settings,
    holidays,
    onCellClick,
    filterWorkType,
}: WorkloadTableProps) {
    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">Member</TableHead>
                        {periods.map((period) => (
                            <TableHead key={period.id} className="min-w-[100px] text-center">
                                {period.name}
                                <div className="text-xs font-normal text-muted-foreground">
                                    {period.startDate}
                                </div>
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {members.length > 0 && (
                        <TableRow className="bg-muted/50 font-bold border-b-2">
                            <TableCell>Total</TableCell>
                            {periods.map((period) => {
                                const total = members.reduce((sum, member) => {
                                    const logs = getMemberLogs(member.id, period.id);
                                    const filteredLogs = filterWorkType
                                        ? logs.filter((l) => l.type === filterWorkType)
                                        : logs;
                                    return sum + filteredLogs.reduce((s, l) => s + l.hours, 0);
                                }, 0);
                                return (
                                    <TableCell key={period.id} className="text-center">
                                        {total > 0 ? `${total}h` : "-"}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    )}
                    {members.map((member) => (
                        <TableRow key={member.id}>
                            <TableCell className="font-medium">
                                {member.name}
                            </TableCell>
                            {periods.map((period) => {
                                const logs = getMemberLogs(member.id, period.id);
                                const filteredLogs = filterWorkType
                                    ? logs.filter((l) => l.type === filterWorkType)
                                    : logs;
                                const totalHours = filteredLogs.reduce((sum, log) => sum + log.hours, 0);

                                // For capacity check, we usually look at total vs capacity, 
                                // but if filtered, we might want to show just that.
                                // Keeping it simple: just show hours.

                                return (
                                    <TableCell
                                        key={period.id}
                                        className="cursor-pointer text-center transition-colors hover:bg-muted/50"
                                        onClick={() => onCellClick(member.id, period.id)}
                                    >
                                        {totalHours > 0 ? `${totalHours}h` : "-"}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                    {members.length === 0 && (
                        <TableRow>
                            <TableCell
                                colSpan={periods.length + 1}
                                className="text-center text-muted-foreground"
                            >
                                Add members to see the grid.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

function WorkLogEditor({
    isOpen,
    onClose,
    memberId,
    periodId,
    memberName,
    periodName,
    workLogs,
    onAddLog,
    onUpdateLog,
    onDeleteLog,
    workType,
    setWorkType,
    holidays,
    settings,
}: {
    isOpen: boolean;
    onClose: () => void;
    memberId: string;
    periodId: string;
    memberName: string;
    periodName: string;
    workLogs: WorkLog[];
    onAddLog: (log: WorkLog) => void;
    onUpdateLog: (logId: string, updates: Partial<WorkLog>) => void;
    onDeleteLog: (logId: string) => void;
    workType: WorkType;
    setWorkType: (type: WorkType) => void;
    holidays: Holidays;
    settings: any;
}) {
    const [newLog, setNewLog] = useState<{
        type: WorkType;
        taskName: string;
        hours: string;
    }>({
        type: workType,
        taskName: "",
        hours: "",
    });

    const member = { id: memberId, name: memberName, buffer: 0 }; // Placeholder for buffer access if needed, but we might need to pass member object
    // Actually we can't get member buffer here easily without passing it. 
    // But for now let's just focus on editing.

    const handleAdd = () => {
        if (!newLog.taskName || !newLog.hours) return;

        onAddLog({
            id: uuidv4(),
            memberId,
            periodId,
            type: newLog.type,
            taskName: newLog.taskName,
            hours: Number(newLog.hours),
        });

        setNewLog({
            type: workType,
            taskName: "",
            hours: "",
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        Edit Work Logs - {memberName} ({periodName})
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">Add New Entry</h3>
                        <div className="flex gap-2">
                            <Select
                                value={newLog.type}
                                onValueChange={(v) => {
                                    const wt = v as WorkType;
                                    setNewLog({
                                        ...newLog,
                                        type: wt,
                                        taskName: wt === 'leave' ? 'leave' : newLog.taskName
                                    });
                                }}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="project">Project</SelectItem>
                                    <SelectItem value="feature">Feature</SelectItem>
                                    <SelectItem value="leave">Leave</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                placeholder="Task Name"
                                value={newLog.taskName}
                                onChange={(e) =>
                                    setNewLog({ ...newLog, taskName: e.target.value })
                                }
                                className="flex-1"
                            />
                            <Input
                                type="number"
                                placeholder="Hours"
                                value={newLog.hours}
                                onChange={(e) => setNewLog({ ...newLog, hours: e.target.value })}
                                className="w-[100px]"
                            />
                            <Button onClick={handleAdd}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Task</TableHead>
                                    <TableHead className="text-right">Hours</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="text-center text-muted-foreground"
                                        >
                                            No logs for this period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    workLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="capitalize">{log.type}</TableCell>
                                            <TableCell>{log.taskName}</TableCell>
                                            <TableCell className="text-right">{log.hours}h</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onDeleteLog(log.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={onClose}>Done</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
