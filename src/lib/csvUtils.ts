import { WorkLog, Period, Member } from "@/types";
import { v4 as uuidv4 } from "uuid";

/**
 * CSVインポート用のデータ型
 */
export interface CSVWorkloadRow {
    workType: string; // Project or Feature
    projectName: string;
    taskName: string;
    memberName: string;
    hours: number[]; // Period毎の工数
}

/**
 * CSVファイルをパースしてワークロードデータに変換
 * フォーマット: 作業分類,案件名,作業内容,メンバー名,Period1工数,Period2工数,...
 */
export function parseWorkloadCSV(csvContent: string): CSVWorkloadRow[] {
    const lines = csvContent.trim().split('\n');

    if (lines.length < 2) {
        throw new Error('CSVファイルが空か、ヘッダー行のみです');
    }

    // ヘッダー行をスキップ
    const dataLines = lines.slice(1);

    const rows: CSVWorkloadRow[] = [];

    for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        if (!line) continue; // 空行をスキップ

        const columns = parseCSVLine(line);

        if (columns.length < 4) {
            throw new Error(`行 ${i + 2}: 最低4列(作業分類,案件名,作業内容,メンバー名)が必要です`);
        }

        const [workType, projectName, taskName, memberName, ...hourStrings] = columns;

        // 工数列をパース
        const hours = hourStrings.map((h, idx) => {
            const num = parseFloat(h);
            if (isNaN(num)) {
                throw new Error(`行 ${i + 2}, 列 ${idx + 5}: 工数が数値ではありません: "${h}"`);
            }
            return num;
        });

        rows.push({
            workType: workType.trim(),
            projectName: projectName.trim(),
            taskName: taskName.trim(),
            memberName: memberName.trim(),
            hours,
        });
    }

    return rows;
}

/**
 * CSV行をパース(カンマ区切り、ダブルクォート対応)
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // エスケープされたダブルクォート
                current += '"';
                i++;
            } else {
                // クォートの開始/終了
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // カンマで区切る
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

/**
 * CSVデータをWorkLogに変換
 */
export function convertCSVToWorkLogs(
    csvRows: CSVWorkloadRow[],
    periods: Period[],
    members: Member[],
    createMemberCallback: (name: string) => Member
): WorkLog[] {
    const workLogs: WorkLog[] = [];
    const memberMap = new Map<string, string>(); // memberName -> memberId

    // 既存メンバーをマップに追加
    members.forEach(m => memberMap.set(m.name, m.id));

    for (const row of csvRows) {
        // メンバーIDを取得または作成
        let memberId = memberMap.get(row.memberName);
        if (!memberId) {
            const newMember = createMemberCallback(row.memberName);
            memberId = newMember.id;
            memberMap.set(row.memberName, memberId);
        }

        // 作業タイプを正規化
        const workType = normalizeWorkType(row.workType);

        // 各Periodの工数をWorkLogに変換
        row.hours.forEach((hours, index) => {
            if (hours <= 0) return; // 0以下の工数はスキップ

            if (index >= periods.length) {
                console.warn(`Period ${index + 1} が存在しません。スキップします。`);
                return;
            }

            const period = periods[index];

            workLogs.push({
                id: uuidv4(),
                memberId,
                periodId: period.id,
                type: workType,
                taskName: `${row.projectName} - ${row.taskName}`,
                hours,
            });
        });
    }

    return workLogs;
}

/**
 * 作業タイプを正規化
 */
function normalizeWorkType(workType: string): 'project' | 'feature' {
    const normalized = workType.toLowerCase().trim();
    if (normalized === 'project' || normalized === 'プロジェクト') {
        return 'project';
    } else if (normalized === 'feature' || normalized === 'フィーチャー' || normalized === '機能') {
        return 'feature';
    }
    // デフォルトはproject
    return 'project';
}

/**
 * メンバーごとの作業工数をCSV形式で生成(Leaveを除外)
 */
export function generateWorkloadSummaryCSV(
    members: Member[],
    periods: Period[],
    workLogs: WorkLog[]
): string {
    const lines: string[] = [];

    // ヘッダー行
    const header = ['作業分類', 'メンバー名', ...periods.map(p => p.name)];
    lines.push(header.join(','));

    // メンバーごとにProject/Featureの工数を集計
    members.forEach(member => {
        // Project工数
        const projectHours = periods.map(period => {
            const logs = workLogs.filter(
                log => log.memberId === member.id &&
                    log.periodId === period.id &&
                    log.type === 'project'
            );
            return logs.reduce((sum, log) => sum + log.hours, 0);
        });

        const projectRow = ['Project', member.name, ...projectHours.map(h => h.toString())];
        lines.push(projectRow.join(','));

        // Feature工数
        const featureHours = periods.map(period => {
            const logs = workLogs.filter(
                log => log.memberId === member.id &&
                    log.periodId === period.id &&
                    log.type === 'feature'
            );
            return logs.reduce((sum, log) => sum + log.hours, 0);
        });

        const featureRow = ['Feature', member.name, ...featureHours.map(h => h.toString())];
        lines.push(featureRow.join(','));
    });

    return lines.join('\n');
}

/**
 * メンバーごとの休暇工数をCSV形式で生成
 */
export function generateLeavesSummaryCSV(
    members: Member[],
    periods: Period[],
    workLogs: WorkLog[]
): string {
    const lines: string[] = [];

    // ヘッダー行
    const header = ['休み', 'メンバー名', ...periods.map(p => p.name)];
    lines.push(header.join(','));

    // メンバーごとにLeave工数を集計
    members.forEach(member => {
        const leaveHours = periods.map(period => {
            const logs = workLogs.filter(
                log => log.memberId === member.id &&
                    log.periodId === period.id &&
                    log.type === 'leave'
            );
            return logs.reduce((sum, log) => sum + log.hours, 0);
        });

        const row = ['休み', member.name, ...leaveHours.map(h => h.toString())];
        lines.push(row.join(','));
    });

    return lines.join('\n');
}

/**
 * Period一覧をCSV形式で生成
 */
export function generatePeriodCSV(periods: Period[]): string {
    const lines: string[] = [];

    // ヘッダー行
    lines.push('name,startDate,endDate');

    // データ行
    periods.forEach(period => {
        const row = [period.name, period.startDate, period.endDate];
        lines.push(row.join(','));
    });

    return lines.join('\n');
}

/**
 * CSVファイルをパースしてPeriodデータに変換
 * フォーマット: name,startDate,endDate
 */
export function parsePeriodCSV(csvContent: string): Omit<Period, "id">[] {
    const lines = csvContent.trim().split('\n');

    if (lines.length < 2) {
        throw new Error('CSVファイルが空か、ヘッダー行のみです');
    }

    // ヘッダー行をスキップ
    const dataLines = lines.slice(1);
    const periods: Omit<Period, "id">[] = [];

    for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        if (!line) continue; // 空行をスキップ

        const columns = parseCSVLine(line);

        if (columns.length < 3) {
            throw new Error(`行 ${i + 2}: 3列(name,startDate,endDate)が必要です`);
        }

        const [name, startDate, endDate] = columns;

        // 日付形式の検証 (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate.trim())) {
            throw new Error(`行 ${i + 2}: 開始日の形式が不正です (YYYY-MM-DD形式で入力してください): "${startDate}"`);
        }
        if (!dateRegex.test(endDate.trim())) {
            throw new Error(`行 ${i + 2}: 終了日の形式が不正です (YYYY-MM-DD形式で入力してください): "${endDate}"`);
        }

        periods.push({
            name: name.trim(),
            startDate: startDate.trim(),
            endDate: endDate.trim(),
            workingDays: 0, // Will be calculated dynamically
        });
    }

    return periods;
}

/**
 * CSVファイルをダウンロード
 */
export function downloadCSV(content: string, filename: string): void {
    // BOM付きUTF-8でエンコード(Excelで正しく開けるように)
    const bom = '\uFEFF';
    const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}
