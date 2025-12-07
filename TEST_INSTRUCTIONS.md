# テスト手順

## 1. Periodの作成

Admin画面 (http://localhost:3000/admin) で以下の4つのPeriodを作成してください:

1. **Period 1**
   - Name: `11/20-12/03`
   - Start Date: `2024-11-20`
   - End Date: `2024-12-03`
   - Working Days: `10` (2週間 - 土日を除く)

2. **Period 2**
   - Name: `12/04-12/17`
   - Start Date: `2024-12-04`
   - End Date: `2024-12-17`
   - Working Days: `10`

3. **Period 3**
   - Name: `12/18-12/31`
   - Start Date: `2024-12-18`
   - End Date: `2024-12-31`
   - Working Days: `10`

4. **Period 4**
   - Name: `01/01-01/14`
   - Start Date: `2025-01-01`
   - End Date: `2025-01-14`
   - Working Days: `10`

## 2. CSVインポート

1. メイン画面 (http://localhost:3000) に移動
2. 「作業エクスポート」と「休暇エクスポート」ボタンの右側にある「CSVインポート」ボタンをクリック
3. `sample_workload.csv` ファイルを選択
4. 「インポート」ボタンをクリック
5. 成功メッセージが表示されることを確認

## 3. データの確認

Workload Gridに以下のメンバーのデータが表示されることを確認:
- 田中太郎
- 佐藤花子
- 鈴木一郎
- 山田次郎
- 高橋三郎

各メンバーの各Periodに工数が表示されることを確認してください。
