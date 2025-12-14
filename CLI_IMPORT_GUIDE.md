
# CLI & Local Import Guide

You can import data either via `curl` (HTTP) or by using a local script (Direct File Access).

## Method 1: Local Script (Recommended for Local Use)

If you are running the application locally and have access to the terminal, this is the easiest method. It does not rely on network requests.

### Prerequisites
- Node.js installed
- Data files (CSV) available locally

### 1. Import Periods
```bash
npx tsx scripts/import.ts periods ./path/to/periods.csv
```

### 2. Import Workload
```bash
npx tsx scripts/import.ts workload ./path/to/workload.csv
```

---

## Method 2: HTTP / Curl (For Remote or API Use)

Use this method if you prefer using HTTP requests or cannot run the script directly.

### 1. Import Periods
```bash
curl -X POST -H "Content-Type: text/plain" --data-binary @path/to/your/periods.csv http://localhost:3000/api/import/periods
```

### 2. Import Workload
```bash
curl -X POST -H "Content-Type: text/plain" --data-binary @path/to/your/workload.csv http://localhost:3000/api/import/workload
```

## After Importing

After running either method:
1. Go to the browser.
2. Click the **"同期" (Sync)** button in the top right corner to refresh the data from the server.
