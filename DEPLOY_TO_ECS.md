# Deploy to AWS ECS / ECR

AWS Elastic Container Service (ECS) にデプロイするための手順です。
前提として、AWS CLI がインストールされ、適切な権限で設定されている必要があります。

## 変数の設定 (PowerShell)

ご自身の環境に合わせて値を変更して実行してください。

```powershell
$AWS_REGION = "ap-northeast-1"
$AWS_ACCOUNT_ID = "YOUR_AWS_ACCOUNT_ID" # 12桁の数字 AWSアカウントID
$REPO_NAME = "team-workload-manager"
$IMAGE_TAG = "latest"
```

## 1. ECR リポジトリの作成

まだリポジトリがない場合は作成します。

```powershell
aws ecr create-repository --repository-name $REPO_NAME --region $AWS_REGION
```

## 2. ECR へのログイン

Docker クライアントを ECR に認証させます。

```powershell
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
```

## 3. Docker イメージのビルド

`--platform linux/amd64` を指定することで、ECS Fargate などで一般的な x86_64 アーキテクチャ向けにビルドします（Apple Silicon Mac などを使っている場合は特に重要です）。

```powershell
docker build --platform linux/amd64 -t $REPO_NAME .
```

## 4. イメージのタグ付け

ECR の URI 形式に合わせてタグを付けます。

```powershell
docker tag "${REPO_NAME}:latest" "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}:${IMAGE_TAG}"
```

## 5. ECR へのプッシュ

```powershell
docker push "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}:${IMAGE_TAG}"
```

---

## 6. ECS タスク定義の設定 (参考)

AWS コンソールまたは Terraform/CDK などで ECS タスク定義を作成する際は、以下の点に注意してください。

- **イメージ URI**: 上記でプッシュした URI を指定 (`...amazonaws.com/team-workload-manager:latest`)
- **ポートマッピング**: コンテナポート `3000` を開く
- **環境変数**: 必要に応じて設定 (例: `NODE_ENV=production`)
- **リソース**: メモリは最低 512MB 以上推奨 (Next.js アプリの規模によります)

## トラブルシューティング

- **ビルドエラー**: `next.config.ts` に `output: "standalone"` が設定されているか確認してください。
- **権限エラー**: AWS CLI のプロファイル (`aws configure`) が正しい権限 (AmazonEC2ContainerRegistryFullAccess など) を持っているか確認してください。
