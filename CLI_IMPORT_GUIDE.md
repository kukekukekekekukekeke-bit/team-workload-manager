
# CLI Import Guide

Since browser imports are restricted, you can use the following commands to import data into the application.

## Prerequisites

- **curl**: A command-line tool for transferring data. Windows usually has `curl` installed by default.
- The application must be running locally (e.g., `http://localhost:3000`).

## 1. Import Periods (Required First)

Periods define the time ranges for the workload. You must import these first.

**CSV Format for Periods:**
`name,startDate,endDate`
(Header row is required)

**Example `periods.csv`:**
```csv
name,startDate,endDate
Period 1,2024-01-01,2024-01-31
Period 2,2024-02-01,2024-02-29
```

**Command:**
```bash
curl -X POST -H "Content-Type: text/plain" --data-binary @path/to/your/periods.csv http://localhost:3000/api/import/periods
```

## 2. Import Workload/Members

After periods are set up, you can import workload data. This will also automatically create members if they don't exist.

**CSV Format for Workload:**
`作業分類,案件名,作業内容,メンバー名,Period1工数,Period2工数,...`
(Header row is required)

**Example `workload.csv`:**
```csv
作業分類,案件名,作業内容,メンバー名,Period 1,Period 2
Project,Project A,Dev,Alice,10,20
Feature,Feature B,Design,Bob,5,15
```

**Command:**
```bash
curl -X POST -H "Content-Type: text/plain" --data-binary @path/to/your/workload.csv http://localhost:3000/api/import/workload
```

## 3. Sync Browser

After running the commands, go to the browser and click the **"同期" (Sync)** button in the top right corner to refresh the data from the server.
