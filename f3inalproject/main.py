import os
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import bcrypt
import jwt

# 匯入 Gemini AI 行程生成引擎
from ai_engine import generate_travel_itinerary, regenerate_single_place

# ---------------------------------------------------------------------------
# 資料庫設定 (SQLite)
# ---------------------------------------------------------------------------
DATABASE_URL = "sqlite:///./loka.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 使用者資料表模型 (SQLAlchemy)
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, nullable=True)
    password_hash = Column("hashed_password", String, nullable=False)
    is_premium = Column(Boolean, default=False, nullable=False)

# 行程儲存資料表模型 (SQLAlchemy)
class ItineraryModel(Base):
    __tablename__ = "itineraries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    trip_title = Column(String, nullable=False)
    itinerary_data = Column(Text, nullable=False)  # 儲存 AI 行程的 JSON 字串
    created_at = Column(DateTime, default=datetime.utcnow)

# 檢測與處理舊資料庫 schema 相容性 (Database Migration)
db_file = "loka.db"
if os.path.exists(db_file):
    import sqlite3
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        # 檢查 users 表中是否存在 email 欄位
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        if columns: # 表示 users 表已存在
            if "email" not in columns:
                cursor.execute("ALTER TABLE users ADD COLUMN email VARCHAR")
                conn.commit()
                print("Successfully migrated database: added email column to users table.")
        conn.close()
    except Exception as e:
        print(f"Database migration failed: {e}")

# 建立所有資料表 (若不存在)
Base.metadata.create_all(bind=engine)

def get_db():
    """資料庫 Session 依賴項"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------------------------------------------------------------------
# JWT 安全驗證與密碼雜湊
# ---------------------------------------------------------------------------
SECRET_KEY = "loka_ultra_secret_key_presentation_2026"
ALGORITHM = "HS256"
security = HTTPBearer()

def hash_password(password: str) -> str:
    """將密碼雜湊加密"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """驗證明文密碼與雜湊密碼是否相符"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """生成 JWT 驗證 Token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=24))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict:
    """解析並驗證 JWT Token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    """FastAPI 依賴項：驗證 JWT Token 並取得當前登入使用者"""
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="憑證無效或已過期，請重新登入。",
            headers={"WWW-Authenticate": "Bearer"},
        )
    username: str = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無效的驗證憑證。",
        )
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="使用者不存在。",
        )
    return user

# ---------------------------------------------------------------------------
# Pydantic 請求與回應 Model 定義
# ---------------------------------------------------------------------------
class UserAuthSchema(BaseModel):
    username: str
    password: str

class UserRegisterSchema(BaseModel):
    username: str
    email: str
    password: str

class UserLoginSchema(BaseModel):
    username: str
    password: str

class TripSaveSchema(BaseModel):
    trip_title: str
    itinerary_data: dict

class ItineraryRequestSchema(BaseModel):
    prompt: str
    start_date: str = ""
    end_date: str = ""
    people_count: int = 2


# ---------------------------------------------------------------------------
# FastAPI 應用初始化與配置
# ---------------------------------------------------------------------------
app = FastAPI(
    title="LOKA API",
    description="輕量化豪華旅行規劃助手 MVP 後端",
    version="1.0.0"
)

# CORS 中間件配置 (便於本地與前端跨域通訊)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# 靜態前端網頁路由 (為了實現單一指令執行，直接在此伺服前端檔案)
# ---------------------------------------------------------------------------
@app.get("/")
def serve_index():
    """伺服入口 HTML 檔案"""
    if not os.path.exists("index.html"):
        raise HTTPException(status_code=404, detail="前端 index.html 檔案不存在。")
    return FileResponse("index.html", headers={"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"})

@app.get("/App.jsx")
def serve_app_jsx():
    """伺服 App.jsx 組件，指定 application/javascript MimeType"""
    if not os.path.exists("App.jsx"):
        raise HTTPException(status_code=404, detail="前端 App.jsx 檔案不存在。")
    return FileResponse("App.jsx", media_type="application/javascript", headers={"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"})

@app.get("/MapComponent.jsx")
def serve_map_component_jsx():
    """伺服 MapComponent.jsx 組件，指定 application/javascript MimeType"""
    if not os.path.exists("MapComponent.jsx"):
        raise HTTPException(status_code=404, detail="前端 MapComponent.jsx 檔案不存在。")
    return FileResponse("MapComponent.jsx", media_type="application/javascript", headers={"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"})

@app.get("/static/{file_path:path}")
def serve_static(file_path: str):
    """伺服本地 static 目錄中的靜態資源（React, Babel, Leaflet 等）"""
    # 預防路徑穿越，清理路徑
    clean_path = file_path.replace("..", "").lstrip("/")
    full_path = os.path.join("static", clean_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail=f"靜態檔案 {clean_path} 不存在。")
    
    # 根據副檔名判斷並回傳對應的 MIME 類型
    media_type = None
    if full_path.endswith(".js"):
        media_type = "application/javascript"
    elif full_path.endswith(".css"):
        media_type = "text/css"
    elif full_path.endswith(".png"):
        media_type = "image/png"
    elif full_path.endswith(".jpg") or full_path.endswith(".jpeg"):
        media_type = "image/jpeg"
        
    return FileResponse(full_path, media_type=media_type)

# ---------------------------------------------------------------------------
# 商業邏輯 API 路由
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# 輔助工具函數 (Deep Link Generator)
# ---------------------------------------------------------------------------
def _to_traveloka_date(date_str: str) -> str:
    """Convert YYYY-MM-DD → DD-MM-YYYY for Traveloka URL spec format."""
    if not date_str or len(date_str) < 10:
        return date_str
    parts = date_str.split('-')
    if len(parts) == 3:
        return f"{parts[2]}-{parts[1]}-{parts[0]}"
    return date_str

# 全面的城市→機場代碼對照表 (關鍵字匹配)
_AIRPORT_MAP = {
    # Indonesia
    "bali": "DPS", "denpasar": "DPS", "ubud": "DPS", "seminyak": "DPS",
    "kuta": "DPS", "canggu": "DPS", "nusa dua": "DPS", "jimbaran": "DPS",
    "jakarta": "CGK", "tangerang": "CGK", "bekasi": "CGK", "bogor": "CGK",
    "depok": "CGK", "serpong": "CGK",
    "surabaya": "SUB", "sidoarjo": "SUB", "gresik": "SUB", "mojokerto": "SUB",
    "malang": "MLG", "yogyakarta": "JOG", "jogja": "JOG", "solo": "SOC",
    "semarang": "SRG", "bandung": "BDO",
    "lombok": "LOP", "mataram": "LOP", "senggigi": "LOP",
    "makassar": "UPG", "ujung pandang": "UPG", "sulawesi": "UPG",
    "medan": "KNO", "balikpapan": "BPN", "samarinda": "SRI",
    "manado": "MDC", "palu": "PLW", "palembang": "PLM",
    "pontianak": "PNK", "banjarmasin": "BDJ", "kupang": "KOE",
    "ambon": "AMQ", "sorong": "SOQ", "jayapura": "DJJ",
    "labuan bajo": "LBJ", "flores": "LBJ", "komodo": "LBJ",
    "raja ampat": "SOQ", "ternate": "TTE",
    # Southeast Asia
    "singapore": "SIN",
    "bangkok": "BKK", "pattaya": "BKK", "hua hin": "HHQ",
    "phuket": "HKT", "chiang mai": "CNX", "chiang rai": "CEI",
    "kuala lumpur": "KUL", "kl": "KUL", "putrajaya": "KUL", "genting": "KUL",
    "penang": "PEN", "langkawi": "LGK", "kota kinabalu": "BKI", "johor": "JHB",
    "hanoi": "HAN", "ho chi minh": "SGN", "saigon": "SGN", "danang": "DAD",
    "manila": "MNL", "cebu": "CEB", "boracay": "MPH",
    "phnom penh": "PNH", "siem reap": "REP",
    "yangon": "RGN", "mandalay": "MDL",
    "colombo": "CMB",
    # East Asia
    "tokyo": "TYO", "osaka": "KIX", "kyoto": "KIX", "nara": "KIX",
    "hiroshima": "HIJ", "fukuoka": "FUK", "sapporo": "CTS", "okinawa": "OKA",
    "seoul": "ICN", "busan": "PUS", "jeju": "CJU",
    "beijing": "PEK", "shanghai": "PVG", "guangzhou": "CAN",
    "chengdu": "CTU", "xian": "XIY", "hangzhou": "HGH",
    "hong kong": "HKG",
    "taipei": "TPE", "taichung": "RMQ", "kaohsiung": "KHH",
    "macau": "MFM",
    # South Asia
    "maldives": "MLE", "male": "MLE",
    "delhi": "DEL", "mumbai": "BOM", "bangalore": "BLR",
    "goa": "GOI", "chennai": "MAA", "kolkata": "CCU",
    "kathmandu": "KTM", "colombo": "CMB",
    # Middle East
    "dubai": "DXB", "abu dhabi": "AUH", "sharjah": "SHJ",
    "doha": "DOH", "riyadh": "RUH", "jeddah": "JED", "muscat": "MCT",
    # Australia / Pacific
    "sydney": "SYD", "melbourne": "MEL", "brisbane": "BNE",
    "perth": "PER", "adelaide": "ADL", "cairns": "CNS",
    "auckland": "AKL", "queenstown": "ZQN",
    # Europe
    "london": "LHR", "paris": "CDG", "amsterdam": "AMS",
    "rome": "FCO", "milan": "MXP", "barcelona": "BCN", "madrid": "MAD",
    "berlin": "BER", "munich": "MUC", "vienna": "VIE", "zurich": "ZRH",
    "istanbul": "IST", "athens": "ATH", "prague": "PRG",
    # Americas
    "new york": "JFK", "los angeles": "LAX", "chicago": "ORD",
    "miami": "MIA", "san francisco": "SFO", "vancouver": "YVR",
    "toronto": "YYZ", "cancun": "CUN",
}

def _get_airport_code(destination: str) -> str | None:
    """Return IATA airport code for a destination string, or None if unknown."""
    dest_lower = destination.lower()
    for keyword, code in _AIRPORT_MAP.items():
        if keyword in dest_lower:
            return code
    return None

def construct_booking_urls(destination: str, start_date: str, end_date: str,
                           guest_count: int, hotel_name: str = "") -> dict:
    """
    根據目的地、日期與旅客數，自動生成 Traveloka 機票及飯店的深層搜尋連結。
    Traveloka 日期格式：DD-MM-YYYY
    """
    import urllib.parse
    dest_clean = destination.strip()

    dest_airport = _get_airport_code(dest_clean)
    tv_start = _to_traveloka_date(start_date)
    tv_end   = _to_traveloka_date(end_date)

    # Traveloka 機票深層連結 (從雅加達 CGK 出發，經濟艙)
    if dest_airport:
        flight_url = (
            f"https://www.traveloka.com/en-id/flight/fullsearch"
            f"?spec={tv_start}.{tv_start}.CGK.{dest_airport}.{guest_count}.0.0.Economy"
        )
    else:
        # 無對應機場代碼時，退回關鍵字搜尋頁
        flight_url = (
            f"https://www.traveloka.com/en-id/flight"
            f"?q={urllib.parse.quote(dest_clean)}"
        )

    # Traveloka 飯店深層連結 — 優先使用 AI 推薦飯店名稱，並帶入日期
    search_name = hotel_name.strip() if hotel_name else dest_clean
    hotel_url = (
        f"https://www.traveloka.com/en-id/hotel/search"
        f"?spec={urllib.parse.quote(search_name)}.{tv_start}.{tv_end}.1.{guest_count}.0"
    )

    return {
        "flight_url": flight_url,
        "hotel_url": hotel_url
    }

# ---------------------------------------------------------------------------
# 商業邏輯 API 路由
# ---------------------------------------------------------------------------
@app.post("/api/auth/register")
def auth_register(auth_data: UserRegisterSchema, db: Session = Depends(get_db)):
    """新版使用者註冊端點 (支援 email)"""
    existing_user = db.query(User).filter(User.username == auth_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="該使用者名稱已被註冊。"
        )
    
    new_user = User(
        username=auth_data.username,
        email=auth_data.email,
        password_hash=hash_password(auth_data.password),
        is_premium=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = create_access_token(data={"sub": new_user.username})
    return {
        "message": "註冊成功",
        "access_token": token,
        "token_type": "bearer",
        "username": new_user.username,
        "is_premium": new_user.is_premium
    }

@app.post("/api/auth/login")
def auth_login(auth_data: UserLoginSchema, db: Session = Depends(get_db)):
    """新版使用者登入端點"""
    user = db.query(User).filter(User.username == auth_data.username).first()
    if not user or not verify_password(auth_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="帳號或密碼錯誤。"
        )
    
    token = create_access_token(data={"sub": user.username})
    return {
        "message": "登入成功",
        "access_token": token,
        "token_type": "bearer",
        "username": user.username,
        "is_premium": user.is_premium
    }

@app.post("/api/trips/save")
def save_trip(req_data: TripSaveSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """保存客製化行程 API (受 JWT 身分驗證保護)"""
    try:
        import json
        new_trip = ItineraryModel(
            user_id=current_user.id,
            trip_title=req_data.trip_title,
            itinerary_data=json.dumps(req_data.itinerary_data, ensure_ascii=False),
        )
        db.add(new_trip)
        db.commit()
        db.refresh(new_trip)
        return {
            "message": "Trip saved successfully",
            "trip_id": new_trip.id,
            "title": new_trip.trip_title
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"儲存行程失敗: {str(e)}"
        )

@app.get("/api/trips")
def get_trips(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """取得當前登入使用者的所有已儲存行程清單"""
    try:
        import json
        itineraries = db.query(ItineraryModel).filter(ItineraryModel.user_id == current_user.id).order_by(ItineraryModel.created_at.desc()).all()
        
        result = []
        for item in itineraries:
            try:
                data_dict = json.loads(item.itinerary_data)
            except Exception:
                data_dict = {}
            result.append({
                "id": item.id,
                "trip_title": item.trip_title,
                "created_at": item.created_at.isoformat() if item.created_at else None,
                "itinerary_data": data_dict
            })
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"取得行程失敗: {str(e)}"
        )

@app.delete("/api/trips/{trip_id}")
def delete_trip(trip_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """刪除當前使用者的指定行程"""
    try:
        trip = db.query(ItineraryModel).filter(ItineraryModel.id == trip_id, ItineraryModel.user_id == current_user.id).first()
        if not trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="找不到該行程或您無權刪除此行程。"
            )
        db.delete(trip)
        db.commit()
        return {"message": "行程已成功刪除"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"刪除行程失敗: {str(e)}"
        )

# ----------------- 向下相容舊版登入與註冊路由 -----------------
@app.post("/api/register")
def register_user(auth_data: UserAuthSchema, db: Session = Depends(get_db)):
    """舊版註冊路由相容"""
    existing_user = db.query(User).filter(User.username == auth_data.username).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="該使用者名稱已被註冊。")
    
    new_user = User(
        username=auth_data.username,
        email=None,
        password_hash=hash_password(auth_data.password),
        is_premium=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = create_access_token(data={"sub": new_user.username})
    return {
        "message": "註冊成功",
        "access_token": token,
        "token_type": "bearer",
        "username": new_user.username,
        "is_premium": new_user.is_premium
    }

@app.post("/api/login")
def login_user(auth_data: UserAuthSchema, db: Session = Depends(get_db)):
    """舊版登入路由相容"""
    user = db.query(User).filter(User.username == auth_data.username).first()
    if not user or not verify_password(auth_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="帳號或密碼錯誤。")
    
    token = create_access_token(data={"sub": user.username})
    return {
        "message": "登入成功",
        "access_token": token,
        "token_type": "bearer",
        "username": user.username,
        "is_premium": user.is_premium
    }

@app.get("/api/me")
def get_user_profile(current_user: User = Depends(get_current_user)):
    """取得當前登入使用者的個人檔案"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "is_premium": current_user.is_premium
    }

@app.post("/api/upgrade")
def upgrade_to_premium(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """升級使用者至 Premium 會員"""
    current_user.is_premium = True
    db.commit()
    db.refresh(current_user)
    return {
        "message": "升級成功！您已解鎖 LOKA Premium 尊榮服務。",
        "username": current_user.username,
        "is_premium": current_user.is_premium
    }

@app.post("/api/generate-itinerary")
def api_generate_itinerary(req_data: ItineraryRequestSchema, current_user: User = Depends(get_current_user)):
    """行程規劃生成 API (受登入保護)"""
    try:
        # 呼叫 Gemini AI 引擎
        itinerary_data = generate_travel_itinerary(req_data.prompt)
        
        # 使用前端明確傳入的日期與人數（比 AI 輸出更可靠）
        import re
        match = re.search(r"for (\d+) travelers", req_data.prompt)
        guest_count = req_data.people_count if req_data.people_count else (int(match.group(1)) if match else 2)

        dest = itinerary_data.get("destination", "Bali")
        s_date = req_data.start_date if req_data.start_date else itinerary_data.get("start_date", "2026-07-01")
        e_date = req_data.end_date if req_data.end_date else itinerary_data.get("end_date", "2026-07-03")
        
        hotel_name = itinerary_data.get("hotel_logistics", {}).get("name", "")
        urls = construct_booking_urls(dest, s_date, e_date, guest_count, hotel_name)
        
        # 注入 Tiket.com 機票及飯店搜尋深層連結至 payload
        if "flight_logistics" in itinerary_data:
            itinerary_data["flight_logistics"]["booking_url"] = urls["flight_url"]
        if "hotel_logistics" in itinerary_data:
            itinerary_data["hotel_logistics"]["booking_url"] = urls["hotel_url"]
            
        return itinerary_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI 生成行程失敗: {str(e)}"
        )

class RegeneratePlaceSchema(BaseModel):
    destination: str
    day_number: int
    existing_titles: list

@app.post("/api/regenerate-place")
def api_regenerate_place(req_data: RegeneratePlaceSchema, current_user: User = Depends(get_current_user)):
    """單一景點替換生成 API — 為指定天數建議一個新的不重複景點"""
    try:
        new_place = regenerate_single_place(req_data.destination, req_data.day_number, req_data.existing_titles)
        return new_place
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"景點重新生成失敗: {str(e)}"
        )


class PaymentRequestSchema(BaseModel):
    card_number: str
    expiry: str
    cvv: str

@app.post('/api/payment/simulate')
def simulate_payment(req_data: PaymentRequestSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if len(req_data.card_number.replace(' ', '')) < 16:
        raise HTTPException(status_code=400, detail='Invalid card number architecture.')
    current_user.is_premium = True
    db.commit()
    db.refresh(current_user)
    return {'message': 'Payment verified via mock gateway. Premium status activated!', 'is_premium': True}

# ---------------------------------------------------------------------------
# 本地執行進入點
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    # 啟動本地開發伺服器，預設連接埠 8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
