"use client";

import { useState, useEffect } from "react";
import { useActivePlan } from "@/hooks/useActivePlan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { fetchHolidays, Holidays } from "@/lib/holidays";

export function SettingsManager() {
    const { settings, updateSettings } = useActivePlan();
    const [dailyHours, setDailyHours] = useState(settings.defaultDailyHours);
    const [newHoliday, setNewHoliday] = useState("");
    const [publicHolidays, setPublicHolidays] = useState<string[]>([]);

    // Sync daily hours when settings change
    useEffect(() => {
        setDailyHours(settings.defaultDailyHours);
    }, [settings.defaultDailyHours]);

    // Load public holidays once on mount
    useEffect(() => {
        fetchHolidays().then((data: Holidays) => {
            const dates = Object.keys(data);
            setPublicHolidays(dates.sort());
        });
    }, []);

    const handleSave = () => {
        updateSettings({ defaultDailyHours: Number(dailyHours) });
    };

    const addCompanyHoliday = () => {
        if (!newHoliday) return;
        const holidays = settings.companyHolidays || [];
        if (holidays.includes(newHoliday)) return;
        updateSettings({ companyHolidays: [...holidays, newHoliday].sort() });
        setNewHoliday("");
    };

    const removeCompanyHoliday = (date: string) => {
        const holidays = settings.companyHolidays || [];
        updateSettings({ companyHolidays: holidays.filter((d) => d !== date) });
    };

    return (
        <div className="space-y-6">
            {/* Global Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Global Settings</CardTitle>
                    <CardDescription>Configure default values for the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="daily-hours">Standard Daily Hours</Label>
                        <Input
                            type="number"
                            id="daily-hours"
                            value={dailyHours}
                            onChange={(e) => setDailyHours(Number(e.target.value))}
                            step="0.5"
                        />
                        <p className="text-sm text-muted-foreground">
                            Used to calculate standard capacity for periods.
                        </p>
                    </div>
                    <Button onClick={handleSave}>Save Standard Hours</Button>
                </CardContent>
            </Card>

            {/* Holiday Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Holiday Settings</CardTitle>
                    <CardDescription>Manage public and company-specific holidays.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Public Holiday Toggle */}
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="public-holidays" className="flex flex-col space-y-1">
                            <span>Consider Public Holidays</span>
                            <span className="font-normal text-sm text-muted-foreground">
                                If enabled, Japanese public holidays will be subtracted from working days.
                            </span>
                        </Label>
                        <Switch
                            id="public-holidays"
                            checked={settings.considerPublicHolidays}
                            onCheckedChange={(checked) => updateSettings({ considerPublicHolidays: checked })}
                        />
                    </div>

                    {/* Show public holidays when enabled */}
                    {settings.considerPublicHolidays && (
                        <div className="mt-2 space-y-2">
                            <p className="text-sm font-medium">Public Holidays:</p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground max-h-40 overflow-y-auto">
                                {publicHolidays.map((date) => (
                                    <li key={date}>{date}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Company Holidays */}
                    <div className="flex flex-col space-y-1">
                        <Label>Company Holidays</Label>
                        <span className="font-normal text-sm text-muted-foreground">
                            Add specific dates that are holidays for your company.
                        </span>
                    </div>
                    <div className="flex gap-2 max-w-sm">
                        <Input
                            type="date"
                            value={newHoliday}
                            onChange={(e) => setNewHoliday(e.target.value)}
                        />
                        <Button onClick={addCompanyHoliday} size="icon">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {(settings.companyHolidays?.length ?? 0) === 0 && (
                            <p className="text-sm text-muted-foreground">No company holidays added.</p>
                        )}
                        {(settings.companyHolidays || []).map((date) => (
                            <div key={date} className="flex items-center justify-between rounded-md border p-2 max-w-sm">
                                <span>{date}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => removeCompanyHoliday(date)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
