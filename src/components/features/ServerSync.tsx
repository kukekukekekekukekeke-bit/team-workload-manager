
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useActivePlan } from "@/hooks/useActivePlan";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function ServerSync() {
    const mergeImportedData = useAppStore(state => state.mergeImportedData);
    const activePlan = useActivePlan(); // Note: this hook might return helpers, but we need the plan name
    // Actually useAppStore has activePlanId. 
    // We can get the plan object from the store directly if needed, or rely on useActivePlan "name" if it exposes it?
    // Let's assume useAppStore can give us the plan.
    const plans = useAppStore(state => state.plans);
    const activePlanId = useAppStore(state => state.activePlanId);
    const currentPlan = plans.find(p => p.id === activePlanId);

    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingData, setPendingData] = useState<any>(null);

    const handleCheckSync = async () => {
        setStatus("loading");
        try {
            const res = await fetch("/api/data");
            if (!res.ok) throw new Error("Failed to fetch server data");
            const data = await res.json();

            // Check for Staging Data
            const staging = data.staging;
            const availableUpdates = [];

            if (staging) {
                // Check Global
                if (staging.global && (staging.global.periods?.length > 0 || staging.global.workLogs?.length > 0)) {
                    availableUpdates.push({
                        type: 'global',
                        label: 'Global Updates (Unspecified Plan)',
                        data: staging.global
                    });
                }

                // Check Specific Plan
                if (currentPlan && staging.byPlan && staging.byPlan[currentPlan.name]) {
                    const planData = staging.byPlan[currentPlan.name];
                    if (planData.periods?.length > 0 || planData.workLogs?.length > 0) {
                        availableUpdates.push({
                            type: 'plan',
                            planName: currentPlan.name,
                            label: `Updates for "${currentPlan.name}"`,
                            data: planData
                        });
                    }
                }
            }

            if (availableUpdates.length > 0) {
                setPendingData(availableUpdates);
                setDialogOpen(true);
                setStatus("idle"); // Wait for user action
            } else {
                // No pending staging data... maybe sync normal plan stuff?
                // The previous logic synced "plans" from server. 
                // If we moved to staging model, direct plan sync might not be desired unless we want to load other people's plans?
                // For now, let's keep the old behavior as fallback if NO staging data found, OR just say "Up to date".
                // User's request focused on CLI imports.
                setStatus("success");
                setTimeout(() => setStatus("idle"), 2000);
            }

        } catch (e) {
            console.error(e);
            setStatus("error");
            setTimeout(() => setStatus("idle"), 3000);
        }
    };

    const confirmSync = async () => {
        if (!pendingData) return;
        setStatus("loading");
        setDialogOpen(false);

        try {
            for (const update of pendingData) {
                mergeImportedData(update.data);

                // Clear from server
                await fetch('/api/staging/clear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        target: update.type,
                        planName: update.planName
                    })
                });
            }
            setPendingData(null);
            setStatus("success");
            setTimeout(() => setStatus("idle"), 2000);
        } catch (e) {
            console.error("Sync failed", e);
            setStatus("error");
        }
    };

    const clearRemoteData = async () => {
        if (!confirm("Are you sure you want to discard these pending imports?")) return;
        setDialogOpen(false);
        setStatus("loading");
        try {
            // Clear All found pending data
            for (const update of pendingData) {
                await fetch('/api/staging/clear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        target: update.type,
                        planName: update.planName
                    })
                });
            }
            setPendingData(null);
            setStatus("idle");
        } catch (e) {
            setStatus("error");
        }
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={handleCheckSync}
                disabled={status === "loading"}
                title="サーバー上の最新データ(curl経由など)を取得して反映します"
            >
                {status === "loading" ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : status === "success" ? (
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                ) : status === "error" ? (
                    <AlertCircle className="h-4 w-4 mr-2 text-destructive" />
                ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {status === "loading" ? "確認中..." : "同期"}
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pending Imports Found</DialogTitle>
                        <DialogDescription>
                            The following data was imported via CLI and is waiting to be synced to your current plan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {pendingData?.map((update: any, idx: number) => (
                            <div key={idx} className="border rounded p-3 bg-muted/50">
                                <h4 className="font-semibold mb-2">{update.label}</h4>
                                <div className="flex gap-2 text-sm">
                                    <Badge variant="secondary">
                                        Periods: {update.data.periods?.length || 0}
                                    </Badge>
                                    <Badge variant="secondary">
                                        Members: {update.data.members?.length || 0}
                                    </Badge>
                                    <Badge variant="secondary">
                                        WorkLogs: {update.data.workLogs?.length || 0}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                        <p className="text-sm text-muted-foreground mt-4">
                            Syncing will merge this data into your currently active plan.
                        </p>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 mr-auto"
                            onClick={clearRemoteData}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Discard All
                        </Button>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmSync}>
                            Import & Sync
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
