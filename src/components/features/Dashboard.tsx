"use client";

import { useActivePlan } from "@/hooks/useActivePlan";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { fetchHolidays, calculateWorkingDays, Holidays } from "@/lib/holidays";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function Dashboard() {
    const { members, periods, workLogs, settings } = useActivePlan();
    const [holidays, setHolidays] = useState<Holidays>({});
    const [includeBuffer, setIncludeBuffer] = useState(true);
    const [selectedMemberId, setSelectedMemberId] = useState<string>("all");
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>("all");

    useEffect(() => {
        fetchHolidays().then(setHolidays);
    }, []);

    // Bar Chart Data
    const barChartData = periods.map((period) => {
        const workingDays = calculateWorkingDays(period.startDate, period.endDate, holidays, settings);

        // Filter logs by period and optionally by member
        const periodLogs = workLogs.filter((l) => {
            const matchesPeriod = l.periodId === period.id;
            const matchesMember = selectedMemberId === "all" || l.memberId === selectedMemberId;
            return matchesPeriod && matchesMember;
        });

        const totalWork = periodLogs.reduce((sum, log) => sum + log.hours, 0);

        // Calculate capacity
        const relevantMembers = selectedMemberId === "all"
            ? members
            : members.filter(m => m.id === selectedMemberId);

        const totalCapacity = relevantMembers.reduce((sum, m) => {
            const dailyCap = settings.defaultDailyHours;
            const gross = dailyCap * workingDays;

            if (includeBuffer) {
                const bufferFactor = 1 - (m.buffer ?? 0) / 100;
                return sum + (gross * bufferFactor);
            }
            return sum + gross;
        }, 0);

        return {
            name: period.name,
            Capacity: Math.round(totalCapacity),
            Work: Math.round(totalWork),
        };
    });

    // Work Type Distribution Pie Chart
    const filteredWorkLogs = workLogs.filter((l) => {
        const matchesPeriod = selectedPeriodId === "all" || l.periodId === selectedPeriodId;
        return matchesPeriod;
    });

    const projectHours = filteredWorkLogs.filter((l) => l.type === "project").reduce((sum, l) => sum + l.hours, 0);
    const featureHours = filteredWorkLogs.filter((l) => l.type === "feature").reduce((sum, l) => sum + l.hours, 0);
    const leaveHours = filteredWorkLogs.filter((l) => l.type === "leave").reduce((sum, l) => sum + l.hours, 0);

    const workTypeData = [
        { name: "Project", value: projectHours },
        { name: "Feature", value: featureHours },
        { name: "Leave", value: leaveHours },
    ].filter((d) => d.value > 0);

    // Capacity Utilization Pie Chart
    const totalAvailableCapacity = periods.reduce((sum, period) => {
        const workingDays = calculateWorkingDays(period.startDate, period.endDate, holidays, settings);
        const periodCapacity = members.reduce((mSum, m) => {
            const dailyCap = settings.defaultDailyHours;
            const gross = dailyCap * workingDays;
            const bufferFactor = 1 - (m.buffer ?? 0) / 100;
            return mSum + (gross * bufferFactor);
        }, 0);
        return sum + periodCapacity;
    }, 0);

    const totalAllocatedHours = workLogs.reduce((sum, l) => sum + l.hours, 0);
    const remainingCapacity = Math.max(0, totalAvailableCapacity - totalAllocatedHours);

    const capacityData = [
        { name: "Allocated", value: totalAllocatedHours },
        { name: "Available", value: remainingCapacity },
    ].filter((d) => d.value > 0);

    const WORK_TYPE_COLORS = ["#0088FE", "#00C49F", "#FFBB28"];
    const CAPACITY_COLORS = ["#8884d8", "#82ca9d"];

    const selectedMemberName = selectedMemberId === "all"
        ? "All Members"
        : members.find(m => m.id === selectedMemberId)?.name || "Unknown";

    const selectedPeriodName = selectedPeriodId === "all"
        ? "All Periods"
        : periods.find(p => p.id === selectedPeriodId)?.name || "Unknown";

    return (
        <div className="space-y-6">
            {/* Bar Chart */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle>Capacity vs Work Hours</CardTitle>
                            <CardDescription>
                                {selectedMemberName} • {includeBuffer ? "With Buffer" : "Without Buffer"}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="buffer-toggle"
                                    checked={includeBuffer}
                                    onCheckedChange={setIncludeBuffer}
                                />
                                <Label htmlFor="buffer-toggle" className="text-sm cursor-pointer">
                                    Include Buffer
                                </Label>
                            </div>
                            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select member" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Members</SelectItem>
                                    {members.map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                            {member.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Capacity" fill="#8884d8" name="Total Capacity" />
                                <Bar dataKey="Work" fill="#ff7300" name="Work Hours" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Pie Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Work Type Distribution */}
                <Card>
                    <CardHeader>
                        <div className="space-y-3">
                            <CardTitle>Work Type Distribution</CardTitle>
                            <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Periods</SelectItem>
                                    {periods.map((period) => (
                                        <SelectItem key={period.id} value={period.id}>
                                            {period.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <CardDescription>{selectedPeriodName}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {workTypeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={workTypeData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) =>
                                                `${name} ${((percent || 0) * 100).toFixed(0)}%`
                                            }
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {workTypeData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={WORK_TYPE_COLORS[index % WORK_TYPE_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    No work data available
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Capacity Utilization */}
                <Card>
                    <CardHeader>
                        <CardTitle>Capacity Utilization</CardTitle>
                        <CardDescription>
                            Total allocated vs available capacity
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {capacityData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={capacityData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) =>
                                                `${name} ${((percent || 0) * 100).toFixed(0)}%`
                                            }
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {capacityData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={CAPACITY_COLORS[index % CAPACITY_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    No capacity data available
                                </div>
                            )}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Total Capacity</p>
                                <p className="text-2xl font-bold">{Math.round(totalAvailableCapacity)}h</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Allocated</p>
                                <p className="text-2xl font-bold">{Math.round(totalAllocatedHours)}h</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
