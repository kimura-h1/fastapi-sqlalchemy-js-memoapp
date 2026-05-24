# AWS デプロイ手順書

**作成日**: 2026-05-24  
**対象**: FastAPI + React メモアプリ  
**リージョン**: ap-northeast-1（東京）

---

## 前提条件

- AWS CLI がインストール済み・設定済み（`aws configure`）
- Docker がインストール済み
- GitHub リポジトリへのアクセス権がある

確認コマンド:
```bash
aws sts get-caller-identity
# → アカウントID・ARN が表示されれば OK
```

---

## Phase 2: RDS PostgreSQL の作成

### 2-1. セキュリティグループの作成

```bash
# デフォルト VPC の ID を確認
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=isDefault,Values=true" \
  --query "Vpcs[0].VpcId" \
  --output text \
  --region ap-northeast-1)
echo "VPC_ID: $VPC_ID"

# ECS タスク用 SG を確認（ECS サービスがすでに使っているもの）
aws ec2 describe-security-groups \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query "SecurityGroups[*].{ID:GroupId,Name:GroupName}" \
  --region ap-northeast-1

# RDS 用セキュリティグループを作成
SG_RDS=$(aws ec2 create-security-group \
  --group-name sg-memo-rds \
  --description "RDS for memo app" \
  --vpc-id $VPC_ID \
  --region ap-northeast-1 \
  --query GroupId \
  --output text)
echo "SG_RDS: $SG_RDS"

# ECS タスクの SG ID を控える（次のステップで使用）
# ※ ECS コンソール → サービス → タスク → ネットワーク設定 で確認できる
SG_ECS="sg-xxxxxxxxxxxxxxxxx"  # ← 実際の値に変える

# RDS SG に ECS からの PostgreSQL アクセスを許可
aws ec2 authorize-security-group-ingress \
  --group-id $SG_RDS \
  --protocol tcp \
  --port 5432 \
  --source-group $SG_ECS \
  --region ap-northeast-1
```

### 2-2. DB サブネットグループの作成

```bash
# デフォルト VPC のサブネット一覧を確認
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query "Subnets[*].{ID:SubnetId,AZ:AvailabilityZone}" \
  --region ap-northeast-1

# サブネットグループ作成（複数 AZ を指定）
aws rds create-db-subnet-group \
  --db-subnet-group-name memo-app-subnet-group \
  --db-subnet-group-description "Subnet group for memo app RDS" \
  --subnet-ids subnet-xxxxxxxxx subnet-yyyyyyyyy \
  --region ap-northeast-1
# ↑ subnet-ids は上のコマンドで確認した値に変える（2つ以上）
```

### 2-3. RDS インスタンスの作成

```bash
aws rds create-db-instance \
  --db-instance-identifier memo-app-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15 \
  --master-username fastapi_user \
  --master-user-password "YOUR_STRONG_PASSWORD" \
  --db-name fastapi_db \
  --allocated-storage 20 \
  --db-subnet-group-name memo-app-subnet-group \
  --vpc-security-group-ids $SG_RDS \
  --backup-retention-period 7 \
  --no-publicly-accessible \
  --region ap-northeast-1
```

> **注意**: `YOUR_STRONG_PASSWORD` は強いパスワードに変えてください（英数字・記号混在、12文字以上推奨）

### 2-4. RDS のエンドポイントを確認

作成完了まで約 5〜10 分かかります。

```bash
# ステータス確認（"available" になれば OK）
aws rds describe-db-instances \
  --db-instance-identifier memo-app-db \
  --query "DBInstances[0].{Status:DBInstanceStatus,Endpoint:Endpoint.Address}" \
  --region ap-northeast-1
```

エンドポイントをメモしておく:
```
memo-app-db.xxxxxxxxxxxx.ap-northeast-1.rds.amazonaws.com
```

---

## Phase 3: Secrets Manager の設定

### 3-1. DATABASE_URL シークレットの作成

```bash
# エンドポイントを環境変数にセット
RDS_ENDPOINT="memo-app-db.xxxxxxxxxxxx.ap-northeast-1.rds.amazonaws.com"

aws secretsmanager create-secret \
  --name memo-app/database-url \
  --description "FastAPI app database URL" \
  --secret-string "postgresql+asyncpg://fastapi_user:YOUR_STRONG_PASSWORD@${RDS_ENDPOINT}:5432/fastapi_db" \
  --region ap-northeast-1
```

### 3-2. SECRET_KEY シークレットの作成

```bash
# ランダムな SECRET_KEY を生成
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
echo "SECRET_KEY: $SECRET_KEY"  # 必ずメモしておく

aws secretsmanager create-secret \
  --name memo-app/secret-key \
  --description "FastAPI JWT secret key" \
  --secret-string "$SECRET_KEY" \
  --region ap-northeast-1
```

### 3-3. シークレットの ARN を確認（タスク定義で使う）

```bash
aws secretsmanager describe-secret \
  --secret-id memo-app/database-url \
  --query "ARN" \
  --output text \
  --region ap-northeast-1
# → arn:aws:secretsmanager:ap-northeast-1:632752099901:secret:memo-app/database-url-xxxxxx

aws secretsmanager describe-secret \
  --secret-id memo-app/secret-key \
  --query "ARN" \
  --output text \
  --region ap-northeast-1
# → arn:aws:secretsmanager:ap-northeast-1:632752099901:secret:memo-app/secret-key-xxxxxx
```

---

## Phase 4: ECS タスク定義の更新

### 4-1. ECS タスク実行ロールに権限を追加

```bash
# 現在のタスク実行ロール名を確認
aws ecs describe-task-definition \
  --task-definition memo-fastapi-task \
  --query "taskDefinition.executionRoleArn" \
  --region ap-northeast-1

# Secrets Manager へのアクセス権限を追加
ROLE_NAME="ecsTaskExecutionRole"  # ← 実際のロール名に変える

aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite
```

### 4-2. task-definition.json を更新

`task-definition.json` の `containerDefinitions` 内に以下を追加:

```json
"secrets": [
  {
    "name": "DATABASE_URL",
    "valueFrom": "arn:aws:secretsmanager:ap-northeast-1:632752099901:secret:memo-app/database-url-xxxxxx"
  },
  {
    "name": "SECRET_KEY",
    "valueFrom": "arn:aws:secretsmanager:ap-northeast-1:632752099901:secret:memo-app/secret-key-xxxxxx"
  }
]
```

> **注意**: `valueFrom` の ARN は Phase 3-3 で確認した値（末尾の `-xxxxxx` まで含む完全な ARN）を使う

### 4-3. タスク定義を登録

```bash
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json \
  --region ap-northeast-1
```

### 4-4. ECS サービスを強制更新

```bash
aws ecs update-service \
  --cluster memo-fastapi-cluster \
  --service memo-fastapi-service \
  --task-definition memo-fastapi-task \
  --force-new-deployment \
  --region ap-northeast-1
```

### 4-5. 起動確認

```bash
# タスクのステータスを確認（RUNNING になれば OK）
aws ecs describe-services \
  --cluster memo-fastapi-cluster \
  --services memo-fastapi-service \
  --query "services[0].{Running:runningCount,Pending:pendingCount,Desired:desiredCount}" \
  --region ap-northeast-1

# アプリログを確認
aws logs tail /ecs/memo-fastapi --follow
# → "Application startup complete." が出れば DB 接続成功
```

---

## Phase 5: ALB の作成

### 5-1. ALB 用セキュリティグループの作成

```bash
SG_ALB=$(aws ec2 create-security-group \
  --group-name sg-memo-alb \
  --description "ALB for memo app" \
  --vpc-id $VPC_ID \
  --region ap-northeast-1 \
  --query GroupId \
  --output text)
echo "SG_ALB: $SG_ALB"

# HTTP (80) と HTTPS (443) を全世界に開放
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ALB \
  --protocol tcp --port 80 --cidr 0.0.0.0/0 \
  --region ap-northeast-1

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ALB \
  --protocol tcp --port 443 --cidr 0.0.0.0/0 \
  --region ap-northeast-1

# ECS SG に ALB からの 8000 ポートアクセスを追加
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ECS \
  --protocol tcp --port 8000 --source-group $SG_ALB \
  --region ap-northeast-1
```

### 5-2. ALB の作成

```bash
# サブネット ID（複数 AZ）を確認して入力
SUBNET_IDS="subnet-xxxxxxxxx subnet-yyyyyyyyy"

ALB_ARN=$(aws elbv2 create-load-balancer \
  --name memo-app-alb \
  --subnets $SUBNET_IDS \
  --security-groups $SG_ALB \
  --scheme internet-facing \
  --type application \
  --region ap-northeast-1 \
  --query "LoadBalancers[0].LoadBalancerArn" \
  --output text)
echo "ALB_ARN: $ALB_ARN"

# ALB の DNS 名を確認
aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query "LoadBalancers[0].DNSName" \
  --output text \
  --region ap-northeast-1
# → memo-app-alb-xxxxxxxxx.ap-northeast-1.elb.amazonaws.com
```

### 5-3. ターゲットグループの作成

```bash
TG_ARN=$(aws elbv2 create-target-group \
  --name memo-app-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path "/health" \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region ap-northeast-1 \
  --query "TargetGroups[0].TargetGroupArn" \
  --output text)
echo "TG_ARN: $TG_ARN"
```

> **注意**: FastAPI アプリに `/health` エンドポイントがあることを確認してください（なければ `/docs` でも可）

### 5-4. ALB リスナーの作成

```bash
# HTTP (80) リスナー
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN \
  --region ap-northeast-1
```

### 5-5. ECS サービスを ALB と紐付け

ECS コンソール → サービス → 更新 → ロードバランサーの設定 で以下を設定:
- ロードバランサーのタイプ: Application Load Balancer
- ロードバランサー名: memo-app-alb
- コンテナ: memo-fastapi-container → 8000 番ポート
- ターゲットグループ: memo-app-tg

または CLI で:
```bash
aws ecs update-service \
  --cluster memo-fastapi-cluster \
  --service memo-fastapi-service \
  --load-balancers "targetGroupArn=$TG_ARN,containerName=memo-fastapi-container,containerPort=8000" \
  --region ap-northeast-1
```

---

## Phase 6: フロントエンド（S3 + CloudFront）

### 6-1. S3 バケットの作成

```bash
BUCKET_NAME="memo-app-frontend-$(date +%s)"
echo "BUCKET_NAME: $BUCKET_NAME"

aws s3api create-bucket \
  --bucket $BUCKET_NAME \
  --region ap-northeast-1 \
  --create-bucket-configuration LocationConstraint=ap-northeast-1
```

### 6-2. 静的ウェブサイトホスティングの設定

```bash
# パブリックアクセスブロックを解除
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# バケットポリシーで公開読み取りを許可
aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Sid\": \"PublicRead\",
      \"Effect\": \"Allow\",
      \"Principal\": \"*\",
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::${BUCKET_NAME}/*\"
    }]
  }"

# 静的ウェブサイトとして設定
aws s3api put-bucket-website \
  --bucket $BUCKET_NAME \
  --website-configuration '{
    "IndexDocument": {"Suffix": "index.html"},
    "ErrorDocument": {"Key": "index.html"}
  }'
```

> **注意**: `ErrorDocument` を `index.html` にすることで React Router のルーティングが正常に動作します

### 6-3. フロントエンドのビルドとアップロード

```bash
cd frontapp-react

# ALB の DNS 名を API URL として設定
ALB_DNS="memo-app-alb-xxxxxxxxx.ap-northeast-1.elb.amazonaws.com"

REACT_APP_API_URL="http://${ALB_DNS}" npm run build

# S3 にアップロード
aws s3 sync build/ s3://$BUCKET_NAME/ --delete

cd ..
```

### 6-4. CloudFront ディストリビューションの作成

```bash
aws cloudfront create-distribution \
  --distribution-config "{
    \"CallerReference\": \"memo-app-$(date +%s)\",
    \"DefaultRootObject\": \"index.html\",
    \"Origins\": {
      \"Quantity\": 1,
      \"Items\": [{
        \"Id\": \"S3-${BUCKET_NAME}\",
        \"DomainName\": \"${BUCKET_NAME}.s3-website-ap-northeast-1.amazonaws.com\",
        \"CustomOriginConfig\": {
          \"HTTPPort\": 80,
          \"HTTPSPort\": 443,
          \"OriginProtocolPolicy\": \"http-only\"
        }
      }]
    },
    \"DefaultCacheBehavior\": {
      \"TargetOriginId\": \"S3-${BUCKET_NAME}\",
      \"ViewerProtocolPolicy\": \"redirect-to-https\",
      \"AllowedMethods\": {\"Quantity\": 2, \"Items\": [\"GET\", \"HEAD\"]},
      \"CachePolicyId\": \"658327ea-f89d-4fab-a63d-7e88639e58f6\",
      \"Compress\": true
    },
    \"CustomErrorResponses\": {
      \"Quantity\": 1,
      \"Items\": [{
        \"ErrorCode\": 403,
        \"ResponsePagePath\": \"/index.html\",
        \"ResponseCode\": \"200\",
        \"ErrorCachingMinTTL\": 10
      }]
    },
    \"Comment\": \"memo-app frontend\",
    \"Enabled\": true,
    \"PriceClass\": \"PriceClass_200\"
  }"
```

CloudFront のドメイン名（`xxxxxxxxxxxx.cloudfront.net`）をメモしておく。

---

## Phase 7: GitHub Actions CI/CD の設定

### 7-1. GitHub Secrets の設定

GitHub リポジトリ → Settings → Secrets and variables → Actions → New repository secret

| シークレット名 | 値 |
|--------------|-----|
| `AWS_ACCESS_KEY_ID` | IAM ユーザーのアクセスキー |
| `AWS_SECRET_ACCESS_KEY` | IAM ユーザーのシークレットキー |

### 7-2. IAM ユーザーの権限確認

CI/CD 用 IAM ユーザーに以下のポリシーが必要:
- `AmazonECR_FullAccess`
- `AmazonECS_FullAccess`

```bash
# IAM ユーザーのポリシー確認
aws iam list-attached-user-policies \
  --user-name YOUR_IAM_USER_NAME
```

### 7-3. 動作確認

```bash
# main ブランチに push して GitHub Actions を起動
git push origin main

# GitHub の Actions タブでワークフローの進行を確認
# → ECR プッシュ → ECS デプロイ の順に実行される
```

---

## 動作確認チェックリスト

### バックエンド確認

```bash
ALB_DNS="memo-app-alb-xxxxxxxxx.ap-northeast-1.elb.amazonaws.com"

# ヘルスチェック
curl http://$ALB_DNS/health

# API ドキュメント
curl http://$ALB_DNS/docs
```

### フロントエンド確認

ブラウザで CloudFront のドメインにアクセス:
```
https://xxxxxxxxxxxx.cloudfront.net
```

1. ログイン画面が表示される
2. アカウント登録 → ログイン ができる
3. メモの作成・編集・削除 ができる
4. 請求書の作成 ができる

---

## トラブルシューティング

### ECS タスクが起動しない

```bash
# タスクの停止理由を確認
aws ecs describe-tasks \
  --cluster memo-fastapi-cluster \
  --tasks $(aws ecs list-tasks --cluster memo-fastapi-cluster --query "taskArns[0]" --output text) \
  --query "tasks[0].stoppedReason" \
  --region ap-northeast-1

# ログで詳細を確認
aws logs tail /ecs/memo-fastapi --follow
```

よくある原因:
- Secrets Manager の ARN が間違っている → Phase 3-3 で確認した完全 ARN を使う
- タスク実行ロールに SecretsManager 権限がない → Phase 4-1 を再確認
- RDS のセキュリティグループが ECS からの接続を拒否 → Phase 2-1 を再確認

### ALB のヘルスチェックが失敗する

```bash
# ターゲットの状態を確認
aws elbv2 describe-target-health \
  --target-group-arn $TG_ARN \
  --region ap-northeast-1
```

よくある原因:
- FastAPI に `/health` エンドポイントがない → `main.py` に追加が必要（下記参照）
- ECS タスクが起動していない → 上の手順で確認

`main.py` に追加するコード:
```python
@app.get("/health")
async def health():
    return {"status": "ok"}
```

### CORS エラーが出る（フロントエンドから API にアクセスできない）

`main.py` の `allow_origins` に CloudFront のドメインを追加:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://xxxxxxxxxxxx.cloudfront.net",  # ← 追加
    ],
    ...
)
```

---

## コスト管理

**不要なリソースを削除する場合（学習・検証後）:**

```bash
# ECS サービスのタスク数を 0 に（課金停止）
aws ecs update-service \
  --cluster memo-fastapi-cluster \
  --service memo-fastapi-service \
  --desired-count 0 \
  --region ap-northeast-1

# RDS を停止（7日後に自動再起動するので注意）
aws rds stop-db-instance \
  --db-instance-identifier memo-app-db \
  --region ap-northeast-1
```

完全に削除する場合は RDS → ALB → ECS サービス → ECS クラスター → ECR の順に削除してください。
