from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uuid

app = FastAPI(title="ReceiptManager Demo")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_methods=["*"],
  allow_headers=["*"]
)

def envelope(payload=None, code="OK", message="成功", meta=None, errors=None):
  return {
    "request_id": str(uuid.uuid4()),
    "timestamp": datetime.utcnow().isoformat(),
    "code": code,
    "message": message,
    "payload": payload,
    "meta": meta,
    "errors": errors
  }

# in-memory demo store
DB = [
  {"id": 1, "title": "午餐", "amount": 120.5, "date": "2025-11-01"},
  {"id": 2, "title": "晚餐", "amount": 150.0, "date": "2025-11-01"},
  {"id": 3, "title": "早餐", "amount": 80.0, "date": "2025-11-01"},
  {"id": 4, "title": "電吉他與音箱", "amount": 4000, "date": "2025-11-02"}
]

@app.get("/receipts")
def list_receipts():
  return envelope(payload=DB, meta={"page":1,"size":len(DB),"total":len(DB)})

@app.get("/receipts/{id}")
def get_receipt(id: int):
  for r in DB:
    if r["id"] == id:
      return envelope(payload=r)
  return envelope(payload=None, code="NOT_FOUND", message="找不到該收據", errors=[{"field":"id","reason":"不存在"}])