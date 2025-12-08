
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function ServerSync() {
    const importState = useAppStore(state => state.importState);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handleSync = async () => {
        setStatus("loading");
        try {
            const res = await fetch("/api/data");
            if (!res.ok) throw new Error("Failed to fetch server data");
            const data = await res.json();

            if (!data.plans || !Array.isArray(data.plans)) {
                throw new Error("Invalid server data format");
            }

            importState(data);
            setStatus("success");
            setTimeout(() => setStatus("idle"), 2000);
        } catch (e) {
            console.error(e);
            setStatus("error");
            setTimeout(() => setStatus("idle"), 3000);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
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
            {status === "loading" ? "同期中..." : "同期"}
        </Button>
    );
}
