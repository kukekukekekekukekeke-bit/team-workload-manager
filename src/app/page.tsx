"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberManager } from "@/components/features/MemberManager";
import { WorkloadGrid } from "@/components/features/WorkloadGrid";
import { Dashboard } from "@/components/features/Dashboard";
import { TimeOffManager } from "@/components/features/TimeOffManager";
import { PeriodManager } from "@/components/features/PeriodManager";
import { SettingsManager } from "@/components/features/SettingsManager";
import { CSVExport } from "@/components/features/CSVExport";
import { CSVImport } from "@/components/features/CSVImport";
import { PlanSidebar } from "@/components/features/PlanSidebar";
import { useMounted } from "@/hooks/use-mounted";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function Home() {
  const mounted = useMounted();
  const [isImportOpen, setIsImportOpen] = useState(false);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <PlanSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Team Workload Manager</h1>
                <p className="text-muted-foreground">
                  Manage team capacity, workload, and periods.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CSVExport />
                <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  CSVインポート
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="workload" className="space-y-4">
            <TabsList>
              <TabsTrigger value="workload">Workload</TabsTrigger>
              <TabsTrigger value="team">Team Members</TabsTrigger>
              <TabsTrigger value="periods">Periods</TabsTrigger>
              <TabsTrigger value="time-off">Time Off</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="workload" className="space-y-4">
              <WorkloadGrid />
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <MemberManager />
            </TabsContent>

            <TabsContent value="periods" className="space-y-4">
              <PeriodManager />
            </TabsContent>

            <TabsContent value="time-off" className="space-y-4">
              <TimeOffManager />
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <Dashboard />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <SettingsManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <CSVImport open={isImportOpen} onOpenChange={setIsImportOpen} />
    </div>
  );
}
