"use client";

import { useActivePlan } from "@/hooks/useActivePlan";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { generateWorkloadSummaryCSV, generateLeavesSummaryCSV, downloadCSV } from "@/lib/csvUtils";

export function CSVExport() {
    const { members, periods, workLogs } = useActivePlan();

    const handleExportWorkload = () => {
        if (members.length === 0 || periods.length === 0) {
            alert("メンバーまたはPeriodが設定されていません");
            return;
        }

        const csv = generateWorkloadSummaryCSV(members, periods, workLogs);
        const filename = `workload_summary_${new Date().toISOString().split('T')[0]}.csv`;
        downloadCSV(csv, filename);
    };

    const handleExportLeaves = () => {
        if (members.length === 0 || periods.length === 0) {
            alert("メンバーまたはPeriodが設定されていません");
            return;
        }

        const csv = generateLeavesSummaryCSV(members, periods, workLogs);
        const filename = `leaves_summary_${new Date().toISOString().split('T')[0]}.csv`;
        downloadCSV(csv, filename);
    };

    return (
        <div className="flex gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={handleExportWorkload}
                disabled={members.length === 0 || periods.length === 0}
            >
                <Download className="h-4 w-4 mr-2" />
                作業エクスポート
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={handleExportLeaves}
                disabled={members.length === 0 || periods.length === 0}
            >
                <Download className="h-4 w-4 mr-2" />
                休暇エクスポート
            </Button>
        </div>
    );
}
