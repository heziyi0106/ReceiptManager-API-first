# ReceiptManager-API-first 收據管理系統測試
## RECEIPT_MANAGER — 開發啟動說明

目錄
- 前置需求
- 啟動步驟（單機逐步）
  - 1) 啟 Prism mock（via Makefile）
  - 2) 啟前端（Vite + React）
  - 3) 啟後端（FastAPI 範例）
- 同時啟（建議）
- 測試 API（curl 範例）
- 常見問題與排查
- 檔案位置與說明

---

前置需求
- Git
- Docker (用來啟 Prism mock)
- Node.js (v16+ 推薦) & npm （用於 frontend）
- Python 3.9+ & pip （用於 backend / FastAPI，若你選擇其他後端請依該技術棧安裝）

建議在 macOS/Windows 上先確保 Docker Desktop 能夠 access 你的專案資料夾（Docker Desktop → Settings → Resources → File Sharing / File Access）。

---

啟動步驟（單機逐步）

1) 啟 Prism mock（使用 Makefile）
- 目的：依照 openapi/ 下的 spec 啟 mock server（port 4010）
- 在 repo 根執行：
  - 前景（可直接看到 log）：
    make mock
  - 背景（detached）：
    make mock-detached
  - 若你的 spec 分散多個檔案或用相對 $ref，我推薦掛整個 openapi 資料夾（Makefile 已設定為這種方式）。
- 驗證：開啟另一個 terminal：
  curl -i http://localhost:4010/receipts

2) 啟前端（Vite + React）
- 位置：`frontend/`
- 若尚未安裝依賴（第一次執行）：
  cd frontend
  npm install
- 啟 dev server：
  npm run dev
- env 設定（在 `frontend/.env.development`）：
  VITE_API_URL=http://localhost:4010
  - 若你啟後端（取代 mock），修改為對應後端 URL。
- 前端預設 dev server URL（Vite）通常是 `http://localhost:5173`。開瀏覽器檢視畫面並觀察 Network 請求至 mock。

3) 啟後端（FastAPI 範例）
- 位置：`backend/`
- 建議使用虛擬環境：
  cd backend
  python -m venv .venv
  # mac / linux
  source .venv/bin/activate
  # windows (PowerShell)
  .venv\Scripts\Activate.ps1
- 安裝需求（第一次）：
  pip install -r requirements.txt
  # 如果沒有 requirements.txt，安裝至少：
  pip install fastapi "uvicorn[standard]" sqlmodel
- 啟 server（範例命令）：
  uvicorn main:app --reload --port 4010
- 如果你希望本地後端在 4010 接手前端呼叫，先停止 Prism mock（或改前端 .env 指到後端）。

---

同時啟（建議流程）
- 推薦用兩個 terminal：
  Terminal A (repo 根) ： `make mock` 或 `make mock-detached`
  Terminal B (frontend)： `cd frontend && npm run dev`
  Terminal C (backend)  ： 若你想測後端替代 mock，啟 backend server
- 若想用單一指令（可選），可在 repo 根 package.json 加入 concurrently 腳本，例如：
  npm install -D concurrently
  # package.json scripts 範例（非必要，示意）
  "scripts": {
    "dev": "concurrently \"make mock-detached\" \"cd frontend && npm run dev\""
  }

---

測試 API（curl 範例）
- 取得列表
  curl -i http://localhost:4010/receipts
- 取得單筆
  curl -i http://localhost:4010/receipts/1
- 建立（POST）
  curl -i -X POST http://localhost:4010/receipts \
    -H "Content-Type: application/json" \
    -d '{"title":"買咖啡","amount":80.5,"date":"2025-11-03"}'

注意：若使用 Prism 並且 spec 有定義 ResponseEnvelope，回傳內容會包在 envelope 的 `payload` 欄位內（請依前端程式所解析的欄位來處理）。

---

常見問題與排查
- 問題：Prism container 啟動但一收到 request 就 exit
  - 原因：OpenAPI spec 使用相對 $ref 指向其他檔案，但容器內並未掛載那些檔案。
  - 解法：Makefile 現在採用掛整個 `openapi/` 資料夾到 container（/tmp/openapi）。確保 `openapi/` 下包含所有被 $ref 的檔案，或使用 `make mock-bundle` (bundle)。
- 問題：前端拿不到 VITE_API_URL
  - 檢查 `frontend/.env.development` 是否存在且內容正確（VITE_ 前綴），修改後需重啟 `npm run dev`。
- 問題：Vite 報 Missing module (例如 axios)
  - 解法：進到 frontend 並執行 `npm install axios`，或檢查 package.json 依賴是否安裝完成。
- 問題：Docker volume mount 被拒絕（macOS）
  - 前往 Docker Desktop → Preferences → Resources → File Sharing，把 repo 路徑加入並重啟 Docker。

---

檔案位置與說明
- `Makefile` — mock / bundle / lint / validate 等常用 target（mock, mock-detached, mock-bundle, bundle, logs, stop-mock...）
- `openapi/` — OpenAPI spec（`receipts-api.yaml`、`components-response-envelope.yaml` 等）
- `frontend/` — Vite + React 前端程式（`.env.development`, `src/` 等）
- `backend/` — 後端範例（FastAPI scaffold: `main.py`, `requirements.txt`）

---