# ReceiptManager-API-first 收據管理系統測試

## 目錄
- 前置需求
- Docker & CI/CD（進階啟動，要快速體驗或正式部署請參考）
- 啟動步驟（單機逐步）
  - 1) 啟 Prism mock（via Makefile）
  - 2) 啟前端（Vite + React）
  - 3) 啟後端（FastAPI 範例）
- 同時啟（建議）
- 測試 API（curl 範例）
- 常見問題與排查
- 檔案位置與說明

---

## 前置需求
- Git
- Docker (用來啟 Prism mock、或直接以 docker-compose 啟動所有服務、更便於 CI/CD)
- Node.js (v16+ 推薦) & npm （用於 frontend）
- Python 3.9+ & pip （用於 backend / FastAPI，若你選擇其他後端請依該技術棧安裝）

建議在 macOS/Windows 上先確保 Docker Desktop 能夠 access 你的專案資料夾（Docker Desktop → Settings → Resources → File Sharing / File Access）。

---

## Docker & CI/CD：快速啟動 / 部署（進階方式）

本專案支援 Docker 化部署，可用於本機測試、正式環境、CI/CD 自動建構。  
推薦給希望「直接起動環境」、「統一團隊開發體驗」或「自動化釋出」的使用者/工程師。

### 本地 Docker 快速啟動

1. 準備 requirements.txt（確保 FastAPI 已安裝；可空檔，未來方便 CI/CD 擴充）
2. 直接用發佈 Docker Image 各自啟動（無需 clone 專案）

如果你只需快速體驗前後端，不用自己 build image，可用 Docker Hub 已推送好的 image 直接啟動：

#### 啟動後端（FastAPI）

```bash
docker run -d \
  --name receipt_manager_backend \
  -p 8000:8000 \
  -e ENV=development \
  happy0106/receipt-manager-backend:latest
```

#### 啟動前端（Vite）

```bash
docker run -d \
  --name receipt_manager_frontend \
  -p 5173:5173 \
  -e VITE_API_URL=http://localhost:8000 \
  happy0106/receipt-manager-frontend:latest
```

- 啟動後，在瀏覽器開啟 [http://localhost:5173](http://localhost:5173)
- 前端自動串連本地 API [http://localhost:8000](http://localhost:8000)

#### 容器管理指令

```bash
docker ps                           # 查看在執行的容器
docker logs receipt_manager_backend # 查看後端 log
docker logs receipt_manager_frontend # 查看前端 log
docker stop receipt_manager_backend receipt_manager_frontend # 停止
docker rm receipt_manager_backend receipt_manager_frontend   # 刪除
```

> 若有 port 被佔用、需更改請自行調整指令中的 -p 參數。

---

3. 預設 web 服務會在 [http://localhost:8000](http://localhost:8000) 運作，對應 FastAPI 後端

#### 重要配置檔案

**Dockerfile** （請放 repo 根目錄）:
```dockerfile
FROM python:3.10.14-slim
WORKDIR /app
COPY requirements.txt ./requirements.txt
RUN pip install --upgrade pip && \
    pip install -r requirements.txt
COPY . /app
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**docker-compose.yml**:
```yaml
version: "3.8"
services:
  web:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./:/app
    environment:
      - ENV=development
```

> 註：若 main.py 路徑、啟動方式與此範例略有不同，請自行調整 Dockerfile `CMD`或 compose `command`。

### CI/CD 自動化建構與推送（GitHub Actions）

1. 設定 GitHub Secrets:
    - DOCKERHUB_USERNAME / DOCKERHUB_TOKEN （用於推送到 Docker Hub）
    - CR_PAT（或使用 GitHub Actions 內建 GITHUB_TOKEN；請參考 workflow 註解）

2. workflow 範例檔案（放 `.github/workflows/ci.yml`）：

```yaml
name: CI - test, build and publish

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

      - name: Run tests (if any)
        run: |
          if python -c "import pytest" >/dev/null 2>&1; then pytest -q || (echo 'Tests failed' && exit 1); else
            if [ -d tests ] || ls | grep -q 'test_' ; then
              python -m pip install pytest
              pytest -q || (echo 'Tests failed' && exit 1)
            else
              echo "No tests found, skipping pytest"
            fi
          fi

  build-and-publish:
    needs: test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.repository_owner }}
          password: ${{ secrets.CR_PAT || github.token }}

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          registry: docker.io
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Set up QEMU (multi-arch)
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push image to GHCR and Docker Hub
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          platforms: linux/amd64
          tags: |
            ghcr.io/${{ github.repository_owner }}/receipt-manager:${{ github.sha }}
            ghcr.io/${{ github.repository_owner }}/receipt-manager:latest
            docker.io/${{ secrets.DOCKERHUB_USERNAME }}/receipt-manager:${{ github.sha }}
            docker.io/${{ secrets.DOCKERHUB_USERNAME }}/receipt-manager:latest
```

3. 推送至 main/master 分支即自動建構 image 並推送到 GHCR/Docker Hub。

### 測試自動化建議

- 本專案建議於 `tests/` 目錄撰寫 pytest 測試；如暫無測試可先建立 `tests/test_health.py` 讓 CI 檢查流程順暢。

---

## 啟動步驟（單機逐步）

1) 啟 Prism mock（使用 Makefile）
- 目的：依照 openapi/ 下的 spec 啟 mock server（port 4010）
- 在 repo 根執行：
  - 前景（可直接看到 log）：
    ```bash
    make mock
    ```
  - 背景（detached）：
    ```bash
    make mock-detached
    ```
  - 若你的 spec 分散多個檔案或用相對 $ref，我推薦掛整個 openapi 資料夾（Makefile 已設定為這種方式）。
- 驗證：開啟另一個 terminal：
  ```bash
  curl -i http://localhost:4010/receipts
  ```

2) 啟前端（Vite + React）
- 位置：`frontend/`
- 若尚未安裝依賴（第一次執行）：
  ```bash
  cd frontend
  npm install
  ```
- 啟 dev server：
  ```bash
  npm run dev
  ```
- env 設定（在 `frontend/.env.development`）：
  ```
  VITE_API_URL=http://localhost:4010
  ```
  - 若你啟後端（取代 mock），修改為對應後端 URL。
- 前端預設 dev server URL（Vite）通常是 `http://localhost:5173`。開瀏覽器檢視畫面並觀察 Network 請求至 mock。

3) 啟後端（FastAPI 範例）
- 位置：`backend/`
- 建議使用虛擬環境：
  ```bash
  cd backend
  python -m venv .venv
  source .venv/bin/activate         # mac / linux
  .venv\Scripts\Activate.ps1        # windows (PowerShell)
  ```
- 安裝需求（第一次）：
  ```bash
  pip install -r requirements.txt
  # 如果沒有 requirements.txt，安裝至少：
  pip install fastapi "uvicorn[standard]" sqlmodel
  ```
- 啟 server（範例命令）：
  ```bash
  uvicorn main:app --reload --port 8000
  ```
- 如果你希望本地後端在 8000 接手前端呼叫，先停止 Prism mock（或改前端 .env 指到後端）。

---

## 同時啟（建議流程）
- 推薦用兩個 terminal：
  - Terminal A (repo 根) ： `make mock` 或 `make mock-detached`
  - Terminal B (frontend)： `cd frontend && npm run dev`
  - Terminal C (backend)  ： 若你想測後端替代 mock，啟 backend server
- 若想用單一指令（可選）可在 repo 根 package.json 加入 concurrently 腳本，例如：
  ```bash
  npm install -D concurrently
  # package.json scripts 範例
  "scripts": {
    "dev": "concurrently \"make mock-detached\" \"cd frontend && npm run dev\""
  }
  ```

---

## 測試 API（curl 範例）
- 取得列表
  ```bash
  curl -i http://localhost:4010/receipts
  ```
- 取得單筆
  ```bash
  curl -i http://localhost:4010/receipts/1
  ```
- 建立（POST）
  ```bash
  curl -i -X POST http://localhost:4010/receipts \
    -H "Content-Type: application/json" \
    -d '{"title":"買咖啡","amount":80.5,"date":"2025-11-03"}'
  ```

注意：若使用 Prism 並且 spec 有定義 ResponseEnvelope，回傳內容會包在 envelope 的 `payload` 欄位內（請依前端程式所解析的欄位來處理）。

---

## 常見問題與排查
- Docker build fail 或 port bind fail？
  - 檢查 Docker Desktop 已啟動、8000/4010 端口未被佔用（或在 compose 裡改 port）。
- Prism container 啟動但一收到 request 就 exit
  - 原因：OpenAPI spec 使用相對 $ref 指向其他檔案，但容器內並未掛載那些檔案。
  - 解法：Makefile 現在採用掛整個 `openapi/` 資料夾到 container（/tmp/openapi）。確保 `openapi/` 下包含所有被 $ref 的檔案，或使用 `make mock-bundle` (bundle)。
- 前端拿不到 VITE_API_URL
  - 檢查 `frontend/.env.development` 是否存在且內容正確（VITE_ 前綴），修改後需重啟 `npm run dev`。
- Vite 報 Missing module (例如 axios)
  - 進到 frontend 並執行 `npm install axios`，或檢查 package.json 依賴是否安裝完成。
- Docker volume mount 被拒絕（macOS）
  - 前往 Docker Desktop → Preferences → Resources → File Sharing，把 repo 路徑加入並重啟 Docker。
- CI push GHCR 權限被拒？
  - 檢查 CR_PAT 權限，或 repo Settings > Actions > Allow GitHub Actions to create and publish packages。

---

## 檔案位置與說明
- `Makefile` — mock / bundle / lint / validate 等常用 target（mock, mock-detached, mock-bundle, bundle, logs, stop-mock...）
- `openapi/` — OpenAPI spec（`receipts-api.yaml`、`components-response-envelope.yaml` 等）
- `frontend/` — Vite + React 前端程式（`.env.development`, `src/` 等）
- `backend/` — 後端範例（FastAPI scaffold: `main.py`, `requirements.txt`）
- `Dockerfile`, `docker-compose.yml` — 本地 Docker 開發與 CI/CD deploy 的主要設定檔
- `.github/workflows/ci.yml` — GitHub Actions workflow/CI 設定

---

## 建議
- 建議團隊新進工程師如不熟本地 Python/NODE dev，優先用 Docker-compose 啟動。
- 欲部署到雲端/正式環境，優先使用 CI/CD + GHCR/Docker Hub image。
- 有任何問題歡迎開 GitHub Issue 討論！
