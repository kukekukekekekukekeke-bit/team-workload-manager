"use client";

import { SettingsManager } from "@/components/features/SettingsManager";
import { PeriodManager } from "@/components/features/PeriodManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                    Manage global settings and periods.
                </p>
            </div>

            <Tabs defaultValue="periods" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="periods">Periods</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="periods" className="space-y-4">
                    <PeriodManager />
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <SettingsManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}
