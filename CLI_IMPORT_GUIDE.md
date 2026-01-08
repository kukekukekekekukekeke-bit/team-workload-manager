# CLI & Local Import Guide / CLI・ローカルインポートガイド

You can import data either via a local script (Direct File Access) or `curl` (HTTP).
`curl`（HTTP経由）またはローカルスクリプト（直接ファイルアクセス）を使用してデータをインポートできます。

---

## Method 1: Local Script (Recommended) / 方法1: ローカルスクリプト（推奨）

If you are running the application locally and have access to the terminal, this is the easiest method.
アプリケーションをローカルで実行しており、ターミナルにアクセスできる場合は、この方法が最も簡単です。

### Prerequisites / 前提条件
- Node.js installed / Node.jsがインストールされていること
- Data files (CSV) available locally / データファイル（CSV）がローカルにあること

### 1. Import Periods / Periodのインポート
```bash
npx tsx scripts/import.ts periods ./path/to/periods.csv
```

### 2. Import Workload / Workloadのインポート
```bash
npx tsx scripts/import.ts workload ./path/to/workload.csv
```

---

## Method 2: HTTP / Curl (Remote) / 方法2: HTTP / Curl（リモート）

Use this method if you cannot run the script directly.
スクリプトを直接実行できない場合は、この方法を使用してください。

### 1. Import Periods
```bash
curl -X POST -H "Content-Type: text/plain" --data-binary @path/to/your/periods.csv http://localhost:3000/api/import/periods
```

### 2. Import Workload
```bash
curl -X POST -H "Content-Type: text/plain" --data-binary @path/to/your/workload.csv http://localhost:3000/api/import/workload
```

---

## Advanced Usage: Plan-Specific Imports / 上級者向け: Plan指定インポート

You can target a specific plan by name using the `--plan` argument. This allows you to import data into a specific plan (e.g., "Project A") without affecting the global staging area or other plans.
`--plan` 引数を使用して特定のPlan名を指定できます。これにより、グローバルなステージングエリアや他のPlanに影響を与えることなく、特定のPlan（例: "Project A"）にデータをインポートできます。

### Syntax / 生成
```bash
npx tsx scripts/import.ts <type> <file_path> --plan "Your Plan Name"
```

### Examples / 使用例
**Import periods into "Project Alpha" / "Project Alpha"にPeriodをインポート:**
```bash
npx tsx scripts/import.ts periods ./periods.csv --plan "Project Alpha"
```

**Import workload into "Project Alpha" / "Project Alpha"にWorkloadをインポート:**
```bash
npx tsx scripts/import.ts workload ./workload.csv --plan "Project Alpha"
```

---

## Import Specifications & Behavior / インポート仕様と挙動

### 1. Staging Area / ステージングエリア（一時保管）
When you run the import command, data is **NOT** immediately added to the plan. Instead, it is saved to a "Staging Area" on the server.
インポートコマンドを実行しても、データは直ちにPlanに追加**されません**。代わりに、サーバー上の「ステージングエリア」に保存されます。

- **Global Staging**: Used when no `--plan` is specified. Available to sync into any active plan.
- **Plan-Specific Staging**: Used when `--plan` is specified. Only available when the matching plan is active.
- **グローバルステージング**: `--plan` が指定されない場合に使用されます。どのアクティブなPlanにも同期可能です。
- **Plan指定ステージング**: `--plan` が指定された場合に使用されます。該当するPlanがアクティブな場合のみ利用可能です。

### 2. Overwrite Rules (Last Wins) / 上書きルール（後勝ち）
To prevent duplicate data accumulation from accidental multiple runs:
誤って複数回実行した場合のデータの重複蓄積を防ぐため、以下のルールがあります：

- If you run the **same command twice**, the staging area is **overwritten** by the latest run.
- **Global** and **Plan-Specific** staging areas are independent. You can have pending global data AND pending plan-specific data simultaneously.
- **同じコマンドを2回実行**した場合、ステージングエリアの内容は最新の実行結果で**上書き**されます。
- **グローバル**と**Plan指定**のステージングエリアは独立しています。保留中のグローバルデータと、Plan指定データは同時に存在できます。

### 3. Sync & Merge / 同期とマージ
To apply the imported data:
インポートされたデータを適用するには：

1. Open the application in your browser. / ブラウザでアプリケーションを開きます。
2. Ensure you have the correct Plan active (if using plan-specific import). / （Plan指定インポートの場合）正しいPlanがアクティブであることを確認します。
3. Click the **"同期" (Sync)** button in the top right. / 右上の **"同期" (Sync)** ボタンをクリックします。
4. A **Confirmation Dialog** will appear showing pending imports. / 保留中のインポートを表示する**確認ダイアログ**が表示されます。
   - **Import & Sync**: Merges the data into your current plan and clears the staging area. / データを現在のPlanにマージし、ステージングエリアをクリアします。
   - **Discard All**: Deletes the pending data from the server without importing. / インポートせずに、サーバーから保留中のデータを削除します。
   - **Cancel**: Closes the dialog without changing anything. / 何も変更せずにダイアログを閉じます。

### 4. Data Merging Logic / データマージロジック
- **Periods**: New periods are appended. Existing periods (by ID) are updated. / 新しいPeriodは追加されます。既存のPeriod（IDによる）は更新されます。
- **Members**: New members are added. / 新しいメンバーは追加されます。
- **WorkLogs**: New work logs are added. / 新しいWorkLogは追加されます。
- **Note**: The sync process performs a **Merge**, not a full replacement. Your existing manual edits in the browser are preserved unless they conflict directly with new data IDs. / 同期プロセスは完全な置換ではなく**マージ**を行います。ブラウザでの手動編集内容は、新しいデータのIDと直接競合しない限り保持されます。

### 5. CSV Format Specifications / CSVフォーマット仕様

#### Workload CSV Format
| Column 1 (Type) | Column 2 (Project) | Column 3 (Task) | Column 4 (Member) | Column 5+ (Periods) |
|---|---|---|---|---|
| 作業分類 | 案件名 | 作業内容 | メンバー名 | 各Periodの工数 |

**Special Handling / 特別な処理:**

1.  **Empty Values (Zero-Filling) / 空の値（ゼロ埋め）**
    *   If a workload cell (Column 5+) is left empty, it is automatically treated as `0`. work log entries with `0` hours are skipped/not created.
    *   工数セル（5列目以降）が空欄の場合、自動的に `0` として扱われます。`0` 時間のデータは作成されません。

2.  **Leave/Holiday Registration / 休暇・休みの登録**
    *   To register leave/time-off, specify one of the following keywords in **Column 1 (Type)**:
        *   `leave`
        *   `休み`
        *   `休暇`
    *   When recognized as leave, the values in the Period columns are treated as leave hours.
    *   **1列目（作業分類）** に `leave`, `休み`, `休暇` のいずれかを指定すると、その行は「休暇」として扱われ、工数が休暇時間として登録されます。

3.  **Column Mapping / 列のマッピング**
    *   Mapping is based on **Column Order (Index)**, NOT Header Names.
    *   Column 5 maps to Period 1, Column 6 to Period 2, and so on.
    *   マッピングはヘッダー名ではなく**列の順番（インデックス）**に基づきます。
    *   5列目はシステムの1番目のPeriod、6列目は2番目のPeriod...という順で割り当てられます。
