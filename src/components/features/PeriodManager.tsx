"use client";

import { useState, useEffect, useRef } from "react";
import { useActivePlan } from "@/hooks/useActivePlan";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Period } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { fetchHolidays, calculateWorkingDays, Holidays } from "@/lib/holidays";
import { format, addDays, parseISO, differenceInDays } from "date-fns";
import { Trash2, Upload, Download, Calendar, Plus, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generatePeriodCSV, parsePeriodCSV, downloadCSV } from "@/lib/csvUtils";
import { useToast } from "@/hooks/use-toast";

export function PeriodManager() {
    const { periods, addPeriod, updatePeriod, deletePeriod, settings } = useActivePlan();
    const [isOpen, setIsOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [periodToDelete, setPeriodToDelete] = useState<string | null>(null);
    const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
    const [holidays, setHolidays] = useState<Holidays>({});
    const [newPeriod, setNewPeriod] = useState<Partial<Period>>({
        name: "",
        startDate: format(new Date(), "yyyy-MM-dd"),
        workingDays: 5,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        const loadHolidays = async () => {
            const data = await fetchHolidays();
            setHolidays(data);
        };
        loadHolidays();
    }, []);

    // Auto-calculate working days when dates change
    useEffect(() => {
        if (newPeriod.startDate && newPeriod.endDate) {
            const days = calculateWorkingDays(
                newPeriod.startDate,
                newPeriod.endDate,
                holidays,
                settings
            );
            setNewPeriod((prev) => ({ ...prev, workingDays: days }));
        }
    }, [newPeriod.startDate, newPeriod.endDate, holidays, settings]);

    const handleOpenDialog = (period?: Period) => {
        if (period) {
            setEditingPeriod(period);
            setNewPeriod({
                name: period.name,
                startDate: period.startDate,
                endDate: period.endDate,
                workingDays: period.workingDays,
            });
        } else {
            setEditingPeriod(null);
            setNewPeriod({
                name: "",
                startDate: format(new Date(), "yyyy-MM-dd"),
                endDate: "",
                workingDays: 5,
            });
        }
        setIsOpen(true);
    };

    const handleSave = () => {
        if (!newPeriod.name || !newPeriod.startDate || !newPeriod.endDate) return;

        if (editingPeriod) {
            updatePeriod(editingPeriod.id, {
                name: newPeriod.name,
                startDate: newPeriod.startDate,
                endDate: newPeriod.endDate,
                workingDays: newPeriod.workingDays || 0,
            });

            toast({
                title: "Period Updated",
                description: `${newPeriod.name} has been updated successfully.`,
            });
        } else {
            const period: Period = {
                id: uuidv4(),
                name: newPeriod.name,
                startDate: newPeriod.startDate,
                endDate: newPeriod.endDate,
                workingDays: newPeriod.workingDays || 0,
            };

            addPeriod(period);

            toast({
                title: "Period Added",
                description: `${period.name} has been added successfully.`,
            });
        }

        setIsOpen(false);
        setEditingPeriod(null);
        setNewPeriod({
            name: "",
            startDate: format(new Date(), "yyyy-MM-dd"),
            endDate: "",
            workingDays: 5,
        });
    };

    const handleExport = () => {
        const csv = generatePeriodCSV(periods);
        downloadCSV(csv, `periods_${format(new Date(), "yyyyMMdd")}.csv`);
        toast({
            title: "Export Successful",
            description: "Periods have been exported to CSV.",
        });
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const parsedPeriods = parsePeriodCSV(text);

            parsedPeriods.forEach((periodData) => {
                const workingDays = calculateWorkingDays(
                    periodData.startDate,
                    periodData.endDate,
                    holidays,
                    settings
                );

                const period: Period = {
                    id: uuidv4(),
                    ...periodData,
                    workingDays,
                };

                addPeriod(period);
            });

            toast({
                title: "Import Successful",
                description: `${parsedPeriods.length} period(s) imported.`,
            });
        } catch (error) {
            toast({
                title: "Import Failed",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "destructive",
            });
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const confirmDelete = (periodId: string) => {
        setPeriodToDelete(periodId);
        setDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (periodToDelete) {
            deletePeriod(periodToDelete);
            toast({
                title: "Period Deleted",
                description: "The period has been removed.",
            });
        }
        setDeleteDialogOpen(false);
        setPeriodToDelete(null);
    };

    const totalWorkingDays = periods.reduce((sum, period) => {
        const days = calculateWorkingDays(period.startDate, period.endDate, holidays, settings);
        return sum + days;
    }, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Periods</h2>
                    <p className="text-muted-foreground">
                        Manage time periods for workload planning
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExport} disabled={periods.length === 0}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleImport}
                        className="hidden"
                    />
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleOpenDialog()}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Period
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>{editingPeriod ? "Edit Period" : "Add New Period"}</DialogTitle>
                                <CardDescription>
                                    {editingPeriod ? "Update the period details" : "Define a time period for workload tracking"}
                                </CardDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Period Name</Label>
                                    <Input
                                        id="name"
                                        value={newPeriod.name}
                                        onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
                                        placeholder="e.g., Week 1, Sprint 5, Q1 2025"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="start">Start Date</Label>
                                        <Input
                                            id="start"
                                            type="date"
                                            value={newPeriod.startDate}
                                            onChange={(e) => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end">End Date</Label>
                                        <Input
                                            id="end"
                                            type="date"
                                            value={newPeriod.endDate || ""}
                                            onChange={(e) => setNewPeriod({ ...newPeriod, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-muted-foreground">Quick Presets</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            type="button"
                                            onClick={() => {
                                                if (!newPeriod.startDate) return;
                                                const start = parseISO(newPeriod.startDate);
                                                const end = addDays(start, 6);
                                                setNewPeriod({ ...newPeriod, endDate: format(end, "yyyy-MM-dd") });
                                            }}
                                        >
                                            1 Week
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            type="button"
                                            onClick={() => {
                                                if (!newPeriod.startDate) return;
                                                const start = parseISO(newPeriod.startDate);
                                                const end = addDays(start, 13);
                                                setNewPeriod({ ...newPeriod, endDate: format(end, "yyyy-MM-dd") });
                                            }}
                                        >
                                            2 Weeks
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            type="button"
                                            onClick={() => {
                                                if (!newPeriod.startDate) return;
                                                const start = parseISO(newPeriod.startDate);
                                                const end = addDays(start, 29);
                                                setNewPeriod({ ...newPeriod, endDate: format(end, "yyyy-MM-dd") });
                                            }}
                                        >
                                            1 Month
                                        </Button>
                                    </div>
                                </div>
                                {newPeriod.startDate && newPeriod.endDate && (
                                    <div className="rounded-lg bg-muted p-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Working Days:</span>
                                            <span className="font-semibold text-lg">{newPeriod.workingDays} days</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={!newPeriod.name || !newPeriod.startDate || !newPeriod.endDate}>
                                    {editingPeriod ? "Save Changes" : "Add Period"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {periods.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Total Periods</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{periods.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Total Working Days</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalWorkingDays} days</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="space-y-3">
                {periods.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="font-semibold text-lg mb-2">No Periods Defined</h3>
                            <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
                                Get started by adding your first period or importing from a CSV file.
                            </p>
                            <Button onClick={() => handleOpenDialog()}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Period
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    periods.map((period) => {
                        const workingDays = calculateWorkingDays(period.startDate, period.endDate, holidays, settings);
                        const totalDays = differenceInDays(parseISO(period.endDate), parseISO(period.startDate)) + 1;

                        return (
                            <Card key={period.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold">{period.name}</h3>
                                                <Badge variant="secondary">
                                                    {totalDays} {totalDays === 1 ? 'day' : 'days'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{format(parseISO(period.startDate), "MMM d, yyyy")}</span>
                                                    <span>→</span>
                                                    <span>{format(parseISO(period.endDate), "MMM d, yyyy")}</span>
                                                </div>
                                            </div>
                                            <div className="mt-2 inline-flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">Working Days:</span>
                                                <span className="font-semibold text-primary">{workingDays} days</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenDialog(period)}
                                                className="text-primary hover:text-primary hover:bg-primary/10"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => confirmDelete(period.id)}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this period. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
