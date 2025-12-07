"use client";

import { useState } from "react";
import { useActivePlan } from "@/hooks/useActivePlan";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import { parseWorkloadCSV, convertCSVToWorkLogs } from "@/lib/csvUtils";
import { v4 as uuidv4 } from "uuid";
import { Member } from "@/types";

interface CSVImportProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CSVImport({ open, onOpenChange }: CSVImportProps) {
    const { periods, members, addMember, addWorkLog } = useActivePlan();
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError("");
            setSuccess("");
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError("ファイルを選択してください");
            return;
        }

        if (periods.length === 0) {
            setError("Periodが設定されていません。先にPeriodを作成してください。");
            return;
        }

        setIsProcessing(true);
        setError("");
        setSuccess("");

        try {
            // ファイルを読み込み
            const content = await file.text();

            // CSVをパース
            const csvRows = parseWorkloadCSV(content);

            if (csvRows.length === 0) {
                throw new Error("データ行が見つかりません");
            }

            // メンバー作成コールバック
            const createMember = (name: string): Member => {
                const newMember: Member = {
                    id: uuidv4(),
                    name,
                    buffer: 5, // デフォルトバッファ
                    projectRatio: 50,
                    featureRatio: 50,
                };
                addMember(newMember);
                return newMember;
            };

            // WorkLogに変換
            const workLogs = convertCSVToWorkLogs(
                csvRows,
                periods,
                members,
                createMember
            );

            // WorkLogを追加
            workLogs.forEach(log => addWorkLog(log));

            setSuccess(`${workLogs.length}件のワークログをインポートしました`);
            setFile(null);

            // 2秒後にダイアログを閉じる
            setTimeout(() => {
                onOpenChange(false);
                setSuccess("");
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "インポートに失敗しました");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>CSVインポート</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="csv-file">CSVファイル</Label>
                        <Input
                            id="csv-file"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            disabled={isProcessing}
                        />
                        <p className="text-xs text-muted-foreground">
                            フォーマット: 作業分類,案件名,作業内容,メンバー名,Period1工数,Period2工数,...
                        </p>
                    </div>

                    {file && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Upload className="h-4 w-4" />
                            <span>{file.name}</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-start gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{success}</span>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isProcessing}
                        >
                            キャンセル
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={!file || isProcessing}
                        >
                            {isProcessing ? "インポート中..." : "インポート"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
