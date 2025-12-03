from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ========== MODELS ==========

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# Bina Modeli
class Building(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    name: str
    address: str
    block_count: int = 1
    apartment_count: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Daire Modeli
class Apartment(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    building_id: str
    block: str = "A"
    apartment_number: int
    floor: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Kullanıcı Modeli
class User(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    phone_number: str
    name: str
    role: str  # 'tenant' (kiracı), 'owner' (mülk sahibi), 'building_admin', 'super_admin'
    building_id: Optional[str] = None
    apartment_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Giriş İsteği
class LoginRequest(BaseModel):
    phone_number: str
    role: str  # 'tenant' veya 'owner'

# Giriş Yanıtı
class LoginResponse(BaseModel):
    success: bool
    message: str
    user: Optional[dict] = None

# ========== ENDPOINTS ==========

@api_router.get("/")
async def root():
    return {"message": "Bina Yönetim Sistemi API"}

# AUTH ENDPOINTS
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Basit giriş sistemi (SMS doğrulama sonra eklenecek)
    """
    try:
        # Kullanıcıyı telefon numarasına göre bul
        user_data = await db.users.find_one({"phone_number": request.phone_number})
        
        if user_data:
            # Kullanıcı var, bilgileri döndür
            user_data["_id"] = str(user_data["_id"])
            if user_data.get("building_id"):
                user_data["building_id"] = str(user_data["building_id"])
            if user_data.get("apartment_id"):
                user_data["apartment_id"] = str(user_data["apartment_id"])
            
            return LoginResponse(
                success=True,
                message="Giriş başarılı",
                user=user_data
            )
        else:
            # Yeni kullanıcı oluştur (demo için)
            # Gerçek uygulamada bu aşama farklı olacak
            
            # İlk binayı bul veya oluştur
            building = await db.buildings.find_one()
            if not building:
                # Demo bina oluştur
                building_data = {
                    "name": "Örnek Sitesi",
                    "address": "İstanbul, Türkiye",
                    "block_count": 2,
                    "apartment_count": 20,
                    "created_at": datetime.utcnow()
                }
                result = await db.buildings.insert_one(building_data)
                building_id = str(result.inserted_id)
            else:
                building_id = str(building["_id"])
            
            # Demo daire oluştur
            apartment_data = {
                "building_id": building_id,
                "block": "A",
                "apartment_number": 5,
                "floor": 2,
                "created_at": datetime.utcnow()
            }
            apartment_result = await db.apartments.insert_one(apartment_data)
            apartment_id = str(apartment_result.inserted_id)
            
            # Yeni kullanıcı oluştur
            new_user = {
                "phone_number": request.phone_number,
                "name": "Demo Kullanıcı",
                "role": request.role,
                "building_id": building_id,
                "apartment_id": apartment_id,
                "created_at": datetime.utcnow()
            }
            
            result = await db.users.insert_one(new_user)
            new_user["_id"] = str(result.inserted_id)
            new_user["building_id"] = building_id
            new_user["apartment_id"] = apartment_id
            
            return LoginResponse(
                success=True,
                message="Hesap oluşturuldu ve giriş yapıldı",
                user=new_user
            )
            
    except Exception as e:
        logging.error(f"Giriş hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# BUILDING ENDPOINTS
@api_router.get("/buildings")
async def get_buildings():
    """Tüm binaları getir"""
    buildings = await db.buildings.find().to_list(100)
    for building in buildings:
        building["_id"] = str(building["_id"])
    return buildings

@api_router.get("/buildings/{building_id}")
async def get_building(building_id: str):
    """Belirli bir binayı getir"""
    building = await db.buildings.find_one({"_id": ObjectId(building_id)})
    if building:
        building["_id"] = str(building["_id"])
        return building
    raise HTTPException(status_code=404, detail="Bina bulunamadı")

# USER ENDPOINTS
@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    """Kullanıcı bilgilerini getir"""
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user:
        user["_id"] = str(user["_id"])
        if user.get("building_id"):
            user["building_id"] = str(user["building_id"])
        if user.get("apartment_id"):
            user["apartment_id"] = str(user["apartment_id"])
        return user
    raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

# BUILDING STATUS ENDPOINTS
@api_router.get("/buildings/{building_id}/status")
async def get_building_status(building_id: str):
    """Bina özelliklerinin durumunu getir"""
    try:
        # Bina özellik durumunu kontrol et
        status = await db.building_status.find_one({"building_id": building_id})
        
        if not status:
            # Eğer kayıt yoksa, varsayılan durum oluştur
            default_status = {
                "building_id": building_id,
                "wifi": {
                    "status": "active",  # active, inactive, maintenance
                    "last_updated": datetime.utcnow()
                },
                "elevator": {
                    "status": "inactive",
                    "last_updated": datetime.utcnow()
                },
                "electricity": {
                    "status": "active",
                    "last_updated": datetime.utcnow()
                },
                "water": {
                    "status": "active",
                    "last_updated": datetime.utcnow()
                },
                "cleaning": {
                    "status": "active",
                    "last_updated": datetime.utcnow()
                },
                "created_at": datetime.utcnow()
            }
            
            await db.building_status.insert_one(default_status)
            status = default_status
        
        # ObjectId'leri stringe çevir
        if status.get("_id"):
            status["_id"] = str(status["_id"])
        
        return status
        
    except Exception as e:
        logging.error(f"Bina durumu getirme hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/buildings/{building_id}/status")
async def update_building_status(building_id: str, status_update: dict):
    """Bina özellik durumunu güncelle (Admin için)"""
    try:
        # Mevcut durumu getir
        current_status = await db.building_status.find_one({"building_id": building_id})
        
        if not current_status:
            raise HTTPException(status_code=404, detail="Bina durumu bulunamadı")
        
        # Güncelleme yap
        update_data = {}
        for key, value in status_update.items():
            if key in ["wifi", "elevator", "electricity", "water", "cleaning"]:
                update_data[f"{key}.status"] = value
                update_data[f"{key}.last_updated"] = datetime.utcnow()
        
        if update_data:
            await db.building_status.update_one(
                {"building_id": building_id},
                {"$set": update_data}
            )
        
        # Güncellenmiş durumu getir
        updated_status = await db.building_status.find_one({"building_id": building_id})
        if updated_status.get("_id"):
            updated_status["_id"] = str(updated_status["_id"])
        
        return updated_status
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Bina durumu güncelleme hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
