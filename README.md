# Team Workload Manager

このプロジェクトは、チームの作業負荷を管理するためのWebアプリケーションです。
Next.jsで構築されており、ローカル環境で簡単に実行できます。

## 移行対象ファイル (Files to Transfer)

新しい環境へ移行する際は、`team-workload-manager` フォルダ内の以下のファイル・フォルダをコピーしてください。

## 📁 必須のフォルダ
- `src` : アプリケーションのソースコードが入っています。
- `public` : 画像などの静的ファイルが入っています。

---

## 📄 必須のファイル
- `.gitignore` : Git の設定ファイルです（Git を使わない場合でも持っていくのが無難）。
- `components.json` : UI コンポーネントの設定ファイルです。
- `eslint.config.mjs` : コード品質チェックの設定です。
- `next-env.d.ts` : Next.js が提供する型定義をTypeScriptに認識させるための宣言ファイル。
- `next.config.ts` : Next.js の設定ファイルです。
- `package-lock.json` : 依存関係の正確なバージョンを固定するためのファイルです。
- `package.json` : プロジェクトの設定と依存関係が記述されています。
- `postcss.config.mjs` : スタイルの設定ファイルです。
- `README.md` : 手順書・説明書。
- `sample_workload.csv` : データファイルとして使用している場合は必要です。
- `tsconfig.json` : TypeScript の設定ファイルです。

---

## 🚫 コピー不要（除外すべき）フォルダ
新しい環境で `npm install` や `npm run dev` を実行すると自動生成されます。

- `node_modules` : インストールされたライブラリの実体（非常にサイズが大きいです）。
- `.next` : ビルドキャッシュファイルなど。コピーするとトラブルの原因になる場合があります。
- `tsconfig.tsbuildinfo`   ← ビルド時に自動生成されるので不要
- `TEST_INSTRUCTIONS.md`   ← ドキュメントのみ。必要なら残しておくと便利

## 前提条件 (Prerequisites)

このツールを実行するには、以下のソフトウェアがインストールされている必要があります。

- **Node.js**: バージョン 18.17 以降 (推奨: 最新のLTSバージョン)
- **npm**: 通常Node.jsと一緒にインストールされます。

## セットアップ手順 (Setup Instructions)

コードを新しい環境に移動した後、以下の手順に従ってセットアップを行ってください。

### 1. 依存関係のインストール

ターミナル（コマンドプロンプトやPowerShellなど）を開き、プロジェクトのルートディレクトリ（`package.json`がある場所）で以下のコマンドを実行してください。

```bash
npm install
```

これにより、必要なライブラリがすべてインストールされます。

### 2. アプリケーションの起動（開発モード）

開発サーバーを起動するには、以下のコマンドを実行します。

```bash
npm run dev
```

コマンド実行後、ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスすると、アプリケーションが表示されます。

### 3. 本番用ビルドと実行（オプション）

本番環境として最適化された状態で実行したい場合は、以下の手順を行ってください。

```bash
# アプリケーションのビルド
npm run build

# ビルドしたアプリケーションの起動
npm start
```

## トラブルシューティング

- **ポートが使われている場合**: `localhost:3000` が既に使用されている場合、Next.jsは自動的に別のポート（例: 3001）を使用します。ターミナルの表示を確認してください。
- **依存関係のエラー**: `npm install` でエラーが発生する場合は、Node.jsのバージョンが古い可能性があります。`node -v` でバージョンを確認し、必要であればアップデートしてください。

## 技術スタック

- Framework: Next.js 16
- Language: TypeScript
- Styling: Tailwind CSS
- State Management: Zustand
- UI Components: Radix UI, Lucide React
