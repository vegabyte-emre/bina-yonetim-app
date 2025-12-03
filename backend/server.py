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

# DUES (AİDAT) ENDPOINTS
@api_router.get("/apartments/{apartment_id}/dues")
async def get_apartment_dues(apartment_id: str):
    """Daire için aidat bilgilerini getir"""
    try:
        # Aidat tahakkuklarını getir
        dues = await db.dues.find({"apartment_id": apartment_id}).sort("due_date", -1).to_list(100)
        
        if not dues:
            # Demo aidat oluştur
            demo_dues = []
            current_date = datetime.utcnow()
            
            for i in range(6):
                month_offset = i
                due_date = datetime(current_date.year, current_date.month - month_offset, 1) if current_date.month > month_offset else datetime(current_date.year - 1, 12 - (month_offset - current_date.month), 1)
                
                is_paid = i > 0  # Sadece bu ay ödenmemiş
                
                due_doc = {
                    "apartment_id": apartment_id,
                    "amount": 750.00,
                    "month": due_date.month,
                    "year": due_date.year,
                    "due_date": due_date,
                    "paid": is_paid,
                    "payment_date": due_date if is_paid else None,
                    "description": f"{due_date.strftime('%B %Y')} Aidat",
                    "created_at": datetime.utcnow()
                }
                
                result = await db.dues.insert_one(due_doc)
                due_doc["_id"] = str(result.inserted_id)
                demo_dues.append(due_doc)
            
            dues = demo_dues
        
        # ObjectId'leri stringe çevir
        for due in dues:
            if due.get("_id"):
                due["_id"] = str(due["_id"])
        
        # Toplam borç hesapla
        total_debt = sum(due["amount"] for due in dues if not due.get("paid"))
        
        return {
            "dues": dues,
            "total_debt": total_debt,
            "overdue_count": len([d for d in dues if not d.get("paid") and d.get("due_date") < datetime.utcnow()])
        }
        
    except Exception as e:
        logging.error(f"Aidat getirme hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/dues/{due_id}/pay")
async def pay_due(due_id: str, payment_info: dict):
    """Aidat ödemesi yap (Test ödeme)"""
    try:
        # Aidat kaydını bul
        due = await db.dues.find_one({"_id": ObjectId(due_id)})
        
        if not due:
            raise HTTPException(status_code=404, detail="Aidat kaydı bulunamadı")
        
        if due.get("paid"):
            raise HTTPException(status_code=400, detail="Bu aidat zaten ödenmiş")
        
        # Test ödeme - gerçek ödeme entegrasyonu sonra eklenecek
        # Şimdilik her zaman başarılı kabul ediyoruz
        payment_successful = True
        
        if payment_successful:
            # Ödemeyi işaretle
            await db.dues.update_one(
                {"_id": ObjectId(due_id)},
                {
                    "$set": {
                        "paid": True,
                        "payment_date": datetime.utcnow(),
                        "payment_method": payment_info.get("method", "test"),
                        "transaction_id": f"TEST-{datetime.utcnow().timestamp()}"
                    }
                }
            )
            
            # Güncellenmiş kaydı getir
            updated_due = await db.dues.find_one({"_id": ObjectId(due_id)})
            updated_due["_id"] = str(updated_due["_id"])
            
            return {
                "success": True,
                "message": "Ödeme başarılı",
                "due": updated_due
            }
        else:
            return {
                "success": False,
                "message": "Ödeme başarısız"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Ödeme hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/dues/{due_id}")
async def get_due_detail(due_id: str):
    """Aidat detayını getir"""
    try:
        due = await db.dues.find_one({"_id": ObjectId(due_id)})
        
        if not due:
            raise HTTPException(status_code=404, detail="Aidat kaydı bulunamadı")
        
        due["_id"] = str(due["_id"])
        return due
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Aidat detay hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ANNOUNCEMENTS (DUYURULAR) ENDPOINTS
@api_router.get("/buildings/{building_id}/announcements")
async def get_building_announcements(building_id: str, category: Optional[str] = None):
    """Bina duyurularını getir"""
    try:
        # Duyuruları getir
        query = {"building_id": building_id}
        if category and category != "all":
            query["category"] = category
        
        announcements = await db.announcements.find(query).sort("created_at", -1).to_list(100)
        
        if not announcements:
            # Demo duyurular oluştur
            demo_announcements = [
                {
                    "building_id": building_id,
                    "title": "Su Kesintisi Bildirisi",
                    "content": "Yarın saat 09:00 - 17:00 arası bakım çalışması nedeniyle su kesintisi yaşanacaktır. Lütfen gerekli önlemlerinizi alınız.",
                    "category": "maintenance",
                    "priority": "high",
                    "created_at": datetime.utcnow(),
                    "created_by": "Site Yönetimi"
                },
                {
                    "building_id": building_id,
                    "title": "Aylık Toplantı Duyurusu",
                    "content": "15 Aralık Cuma günü saat 19:00'da aylık site toplantımız yapılacaktır. Tüm site sakinlerinin katılımı beklenmektedir.",
                    "category": "meeting",
                    "priority": "normal",
                    "created_at": datetime.utcnow(),
                    "created_by": "Site Yönetimi"
                },
                {
                    "building_id": building_id,
                    "title": "Asansör Arızası",
                    "content": "A Blok asansörü arıza nedeniyle devre dışıdır. Teknisyen çağrılmıştır. En kısa sürede tamir edilecektir.",
                    "category": "maintenance",
                    "priority": "urgent",
                    "created_at": datetime.utcnow(),
                    "created_by": "Teknik Servis"
                },
                {
                    "building_id": building_id,
                    "title": "Yeni Yıl Kutlaması",
                    "content": "31 Aralık Salı günü saat 20:00'da site bahçesinde yılbaşı kutlaması düzenlenecektir. Ailenizle birlikte katılabilirsiniz.",
                    "category": "general",
                    "priority": "normal",
                    "created_at": datetime.utcnow(),
                    "created_by": "Site Yönetimi"
                },
                {
                    "building_id": building_id,
                    "title": "Ortak Alan Temizliği",
                    "content": "Her Pazartesi ve Perşembe günleri ortak alanların temizliği yapılmaktadır. Lütfen bu saatlerde merdiven ve koridorları kullanırken dikkatli olunuz.",
                    "category": "general",
                    "priority": "low",
                    "created_at": datetime.utcnow(),
                    "created_by": "Site Yönetimi"
                }
            ]
            
            for announcement in demo_announcements:
                result = await db.announcements.insert_one(announcement)
                announcement["_id"] = str(result.inserted_id)
            
            announcements = demo_announcements
        
        # ObjectId'leri stringe çevir
        for announcement in announcements:
            if announcement.get("_id"):
                announcement["_id"] = str(announcement["_id"])
        
        return announcements
        
    except Exception as e:
        logging.error(f"Duyuru getirme hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/announcements/{announcement_id}")
async def get_announcement_detail(announcement_id: str):
    """Duyuru detayını getir"""
    try:
        announcement = await db.announcements.find_one({"_id": ObjectId(announcement_id)})
        
        if not announcement:
            raise HTTPException(status_code=404, detail="Duyuru bulunamadı")
        
        announcement["_id"] = str(announcement["_id"])
        return announcement
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Duyuru detay hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/announcements/{announcement_id}/read")
async def mark_announcement_read(announcement_id: str, user_id: str):
    """Duyuruyu okundu olarak işaretle"""
    try:
        # Okundu kaydı oluştur veya güncelle
        read_record = {
            "announcement_id": announcement_id,
            "user_id": user_id,
            "read_at": datetime.utcnow()
        }
        
        # Mevcut kayıt var mı kontrol et
        existing = await db.announcement_reads.find_one({
            "announcement_id": announcement_id,
            "user_id": user_id
        })
        
        if not existing:
            await db.announcement_reads.insert_one(read_record)
        else:
            await db.announcement_reads.update_one(
                {"announcement_id": announcement_id, "user_id": user_id},
                {"$set": {"read_at": datetime.utcnow()}}
            )
        
        return {"success": True, "message": "Duyuru okundu olarak işaretlendi"}
        
    except Exception as e:
        logging.error(f"Duyuru okundu işaretleme hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/{user_id}/announcements/unread-count")
async def get_unread_announcements_count(user_id: str, building_id: str):
    """Okunmamış duyuru sayısını getir"""
    try:
        # Tüm duyuruları getir
        all_announcements = await db.announcements.find({"building_id": building_id}).to_list(100)
        
        # Okunan duyuruları getir
        read_announcements = await db.announcement_reads.find({"user_id": user_id}).to_list(100)
        read_ids = [r["announcement_id"] for r in read_announcements]
        
        # Okunmamış sayısını hesapla
        unread_count = len([a for a in all_announcements if str(a["_id"]) not in read_ids])
        
        return {"unread_count": unread_count}
        
    except Exception as e:
        logging.error(f"Okunmamış duyuru sayısı hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# REQUESTS (TALEP & ŞİKAYET) ENDPOINTS
@api_router.get("/users/{user_id}/requests")
async def get_user_requests(user_id: str):
    """Kullanıcının tüm taleplerinı getir"""
    try:
        requests = await db.requests.find({"user_id": user_id}).sort("created_at", -1).to_list(100)
        
        if not requests:
            # Demo talepler oluştur
            demo_requests = [
                {
                    "user_id": user_id,
                    "category": "maintenance",
                    "title": "Asansör Arızası",
                    "description": "A Blok asansörü çalışmıyor. Lütfen en kısa sürede bakımını yapın.",
                    "status": "in_progress",
                    "priority": "high",
                    "images": [],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                {
                    "user_id": user_id,
                    "category": "cleaning",
                    "title": "Merdiven Temizliği",
                    "description": "5. kattaki merdiven boşluğu temizlenmeye ihtiyacı var.",
                    "status": "resolved",
                    "priority": "low",
                    "images": [],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "resolved_at": datetime.utcnow()
                },
                {
                    "user_id": user_id,
                    "category": "security",
                    "title": "Güvenlik Kamerası Sorunu",
                    "description": "Giriş kapısındaki güvenlik kamerası çalışmıyor.",
                    "status": "received",
                    "priority": "normal",
                    "images": [],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            ]
            
            for request in demo_requests:
                result = await db.requests.insert_one(request)
                request["_id"] = str(result.inserted_id)
            
            requests = demo_requests
        
        # ObjectId'leri stringe çevir
        for request in requests:
            if request.get("_id"):
                request["_id"] = str(request["_id"])
        
        return requests
        
    except Exception as e:
        logging.error(f"Talep getirme hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/requests")
async def create_request(request_data: dict):
    """Yeni talep oluştur"""
    try:
        new_request = {
            "user_id": request_data.get("user_id"),
            "category": request_data.get("category"),
            "title": request_data.get("title"),
            "description": request_data.get("description"),
            "status": "received",
            "priority": request_data.get("priority", "normal"),
            "images": request_data.get("images", []),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.requests.insert_one(new_request)
        new_request["_id"] = str(result.inserted_id)
        
        return {
            "success": True,
            "message": "Talebiniz başarıyla oluşturuldu",
            "request": new_request
        }
        
    except Exception as e:
        logging.error(f"Talep oluşturma hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/requests/{request_id}")
async def get_request_detail(request_id: str):
    """Talep detayını getir"""
    try:
        request = await db.requests.find_one({"_id": ObjectId(request_id)})
        
        if not request:
            raise HTTPException(status_code=404, detail="Talep bulunamadı")
        
        request["_id"] = str(request["_id"])
        return request
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Talep detay hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/requests/{request_id}/status")
async def update_request_status(request_id: str, status_data: dict):
    """Talep durumunu güncelle (Admin için)"""
    try:
        new_status = status_data.get("status")
        
        update_data = {
            "status": new_status,
            "updated_at": datetime.utcnow()
        }
        
        if new_status == "resolved":
            update_data["resolved_at"] = datetime.utcnow()
        
        await db.requests.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": update_data}
        )
        
        # Güncellenmiş talebi getir
        updated_request = await db.requests.find_one({"_id": ObjectId(request_id)})
        if updated_request.get("_id"):
            updated_request["_id"] = str(updated_request["_id"])
        
        return updated_request
        
    except Exception as e:
        logging.error(f"Talep durum güncelleme hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# LEGAL PROCESS (HUKUKİ SÜREÇ) ENDPOINTS
@api_router.get("/apartments/{apartment_id}/legal-process")
async def get_legal_process(apartment_id: str):
    """Daire için hukuki süreç bilgilerini getir"""
    try:
        # Hukuki süreç kaydını kontrol et
        legal_process = await db.legal_processes.find_one({"apartment_id": apartment_id})
        
        if not legal_process:
            # Aidat borcu kontrol et
            dues = await db.dues.find({
                "apartment_id": apartment_id,
                "paid": False
            }).to_list(100)
            
            total_debt = sum(due["amount"] for due in dues)
            overdue_months = len(dues)
            
            # Eğer 2+ ay gecikme varsa demo süreç oluştur
            if overdue_months >= 2:
                legal_process = {
                    "apartment_id": apartment_id,
                    "status": "warning_sent",
                    "total_debt": total_debt,
                    "overdue_months": overdue_months,
                    "timeline": [
                        {
                            "stage": "warning_sent",
                            "title": "İhtar Gönderildi",
                            "description": "Aidat borcu nedeniyle resmi ihtar gönderilmiştir.",
                            "date": datetime.utcnow(),
                            "completed": True
                        },
                        {
                            "stage": "legal_notice",
                            "title": "Yasal Bildirim",
                            "description": "Ödeme yapılmaması durumunda yasal işlem başlatılacaktır.",
                            "date": None,
                            "completed": False
                        },
                        {
                            "stage": "lawyer_assigned",
                            "title": "Avukata Devredildi",
                            "description": "Dosya hukuk danışmanına iletilmiştir.",
                            "date": None,
                            "completed": False
                        },
                        {
                            "stage": "lawsuit_filed",
                            "title": "Dava Açıldı",
                            "description": "Mahkeme sürecine geçilmiştir.",
                            "date": None,
                            "completed": False
                        }
                    ],
                    "contact": {
                        "lawyer_name": "Av. Mehmet Yılmaz",
                        "lawyer_phone": "0 (212) 555 01 01",
                        "lawyer_email": "m.yilmaz@hukuk.com"
                    },
                    "notes": "Ödeme planı için yönetim ile görüşebilirsiniz.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                result = await db.legal_processes.insert_one(legal_process)
                legal_process["_id"] = str(result.inserted_id)
            else:
                # Borç yok veya az, süreç yok
                return {
                    "has_process": False,
                    "total_debt": total_debt,
                    "overdue_months": overdue_months,
                    "message": "Hukuki süreç bulunmamaktadır."
                }
        
        # ObjectId'yi stringe çevir
        if legal_process.get("_id"):
            legal_process["_id"] = str(legal_process["_id"])
        
        legal_process["has_process"] = True
        return legal_process
        
    except Exception as e:
        logging.error(f"Hukuki süreç getirme hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/apartments/{apartment_id}/payment-plan")
async def get_payment_plan(apartment_id: str):
    """Ödeme planı önerisi getir"""
    try:
        # Ödenmemiş aidatları getir
        dues = await db.dues.find({
            "apartment_id": apartment_id,
            "paid": False
        }).sort("due_date", 1).to_list(100)
        
        if not dues:
            return {
                "has_debt": False,
                "message": "Borcunuz bulunmamaktadır."
            }
        
        total_debt = sum(due["amount"] for due in dues)
        
        # 3 aylık taksit planı öner
        installment_amount = total_debt / 3
        
        payment_plan = {
            "has_debt": True,
            "total_debt": total_debt,
            "overdue_count": len(dues),
            "suggested_plan": {
                "installments": 3,
                "monthly_amount": round(installment_amount, 2),
                "description": "3 eşit taksit ile ödeme yapabilirsiniz."
            },
            "dues": []
        }
        
        for due in dues:
            if due.get("_id"):
                due["_id"] = str(due["_id"])
            payment_plan["dues"].append(due)
        
        return payment_plan
        
    except Exception as e:
        logging.error(f"Ödeme planı hatası: {str(e)}")
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
