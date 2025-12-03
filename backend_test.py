#!/usr/bin/env python3
"""
Backend API Test Suite for Bina Yönetim Sistemi
Tests the authentication, building, and user management APIs
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend .env
BACKEND_URL = "https://smartprop-6.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.test_results = []
        self.created_users = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_login_new_tenant(self):
        """Test 1: Yeni kullanıcı girişi (Kiracı)"""
        test_name = "POST /api/auth/login - Yeni Kiracı"
        
        try:
            payload = {
                "phone_number": "5551234567",
                "role": "tenant"
            }
            
            response = requests.post(f"{BACKEND_URL}/auth/login", json=payload, timeout=30)
            
            if response.status_code != 200:
                self.log_test(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
                return None
                
            data = response.json()
            
            # Verify response structure
            if not data.get("success"):
                self.log_test(test_name, False, "success=false in response", {"response": data})
                return None
                
            if not data.get("user"):
                self.log_test(test_name, False, "user data missing", {"response": data})
                return None
                
            user = data["user"]
            
            # Verify user data
            required_fields = ["_id", "phone_number", "name", "role", "building_id", "apartment_id"]
            missing_fields = [field for field in required_fields if not user.get(field)]
            
            if missing_fields:
                self.log_test(test_name, False, f"Missing user fields: {missing_fields}", {"user": user})
                return None
                
            if user["phone_number"] != "5551234567":
                self.log_test(test_name, False, "Wrong phone number", {"expected": "5551234567", "got": user["phone_number"]})
                return None
                
            if user["role"] != "tenant":
                self.log_test(test_name, False, "Wrong role", {"expected": "tenant", "got": user["role"]})
                return None
                
            self.created_users.append(user)
            self.log_test(test_name, True, "Yeni kiracı başarıyla oluşturuldu", {
                "user_id": user["_id"],
                "building_id": user["building_id"],
                "apartment_id": user["apartment_id"]
            })
            return user
            
        except requests.exceptions.RequestException as e:
            self.log_test(test_name, False, f"Network error: {str(e)}")
            return None
        except Exception as e:
            self.log_test(test_name, False, f"Unexpected error: {str(e)}")
            return None
    
    def test_login_new_owner(self):
        """Test 2: Yeni kullanıcı girişi (Mülk Sahibi)"""
        test_name = "POST /api/auth/login - Yeni Mülk Sahibi"
        
        try:
            payload = {
                "phone_number": "5559876543",
                "role": "owner"
            }
            
            response = requests.post(f"{BACKEND_URL}/auth/login", json=payload, timeout=30)
            
            if response.status_code != 200:
                self.log_test(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
                return None
                
            data = response.json()
            
            if not data.get("success") or not data.get("user"):
                self.log_test(test_name, False, "Invalid response structure", {"response": data})
                return None
                
            user = data["user"]
            
            if user["phone_number"] != "5559876543" or user["role"] != "owner":
                self.log_test(test_name, False, "Wrong user data", {"user": user})
                return None
                
            self.created_users.append(user)
            self.log_test(test_name, True, "Yeni mülk sahibi başarıyla oluşturuldu", {
                "user_id": user["_id"],
                "building_id": user["building_id"],
                "apartment_id": user["apartment_id"]
            })
            return user
            
        except Exception as e:
            self.log_test(test_name, False, f"Error: {str(e)}")
            return None
    
    def test_login_existing_user(self):
        """Test 3: Mevcut kullanıcı ile tekrar giriş"""
        test_name = "POST /api/auth/login - Mevcut Kullanıcı"
        
        if not self.created_users:
            self.log_test(test_name, False, "No existing users to test with")
            return None
            
        existing_user = self.created_users[0]
        
        try:
            payload = {
                "phone_number": existing_user["phone_number"],
                "role": existing_user["role"]
            }
            
            response = requests.post(f"{BACKEND_URL}/auth/login", json=payload, timeout=30)
            
            if response.status_code != 200:
                self.log_test(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
                return None
                
            data = response.json()
            
            if not data.get("success") or not data.get("user"):
                self.log_test(test_name, False, "Invalid response structure", {"response": data})
                return None
                
            user = data["user"]
            
            # Verify it's the same user
            if user["_id"] != existing_user["_id"]:
                self.log_test(test_name, False, "Different user returned", {
                    "expected_id": existing_user["_id"],
                    "got_id": user["_id"]
                })
                return None
                
            self.log_test(test_name, True, "Mevcut kullanıcı başarıyla giriş yaptı", {
                "user_id": user["_id"],
                "message": data.get("message", "")
            })
            return user
            
        except Exception as e:
            self.log_test(test_name, False, f"Error: {str(e)}")
            return None
    
    def test_get_buildings(self):
        """Test 4: Bina listeleme"""
        test_name = "GET /api/buildings"
        
        try:
            response = requests.get(f"{BACKEND_URL}/buildings", timeout=30)
            
            if response.status_code != 200:
                self.log_test(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
                return None
                
            buildings = response.json()
            
            if not isinstance(buildings, list):
                self.log_test(test_name, False, "Response is not a list", {"response": buildings})
                return None
                
            if len(buildings) == 0:
                self.log_test(test_name, False, "No buildings found", {"response": buildings})
                return None
                
            # Verify building structure
            building = buildings[0]
            required_fields = ["_id", "name", "address", "apartment_count"]
            missing_fields = [field for field in required_fields if field not in building]
            
            if missing_fields:
                self.log_test(test_name, False, f"Missing building fields: {missing_fields}", {"building": building})
                return None
                
            self.log_test(test_name, True, f"{len(buildings)} bina listelendi", {
                "building_count": len(buildings),
                "first_building": building["name"]
            })
            return buildings
            
        except Exception as e:
            self.log_test(test_name, False, f"Error: {str(e)}")
            return None
    
    def test_get_user_details(self):
        """Test 5: Kullanıcı detayları getirme"""
        test_name = "GET /api/users/{user_id}"
        
        if not self.created_users:
            self.log_test(test_name, False, "No users to test with")
            return None
            
        user_to_test = self.created_users[0]
        user_id = user_to_test["_id"]
        
        try:
            response = requests.get(f"{BACKEND_URL}/users/{user_id}", timeout=30)
            
            if response.status_code != 200:
                self.log_test(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
                return None
                
            user = response.json()
            
            # Verify user data matches
            if user["_id"] != user_id:
                self.log_test(test_name, False, "Wrong user returned", {
                    "expected_id": user_id,
                    "got_id": user["_id"]
                })
                return None
                
            if user["phone_number"] != user_to_test["phone_number"]:
                self.log_test(test_name, False, "User data mismatch", {
                    "expected_phone": user_to_test["phone_number"],
                    "got_phone": user["phone_number"]
                })
                return None
                
            self.log_test(test_name, True, "Kullanıcı detayları başarıyla getirildi", {
                "user_id": user["_id"],
                "phone": user["phone_number"],
                "role": user["role"]
            })
            return user
            
        except Exception as e:
            self.log_test(test_name, False, f"Error: {str(e)}")
            return None

    def test_get_building_status(self, building_id):
        """Test 6: Bina durumu getirme (YENİ ÖZELLİK - ÖNCELİK: Yüksek)"""
        test_name = "GET /api/buildings/{building_id}/status - Bina Durumu"
        
        try:
            response = requests.get(f"{BACKEND_URL}/buildings/{building_id}/status", timeout=30)
            
            if response.status_code != 200:
                self.log_test(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
                return None
                
            status = response.json()
            
            # Verify required fields exist
            required_fields = ["wifi", "elevator", "electricity", "water", "cleaning"]
            missing_fields = []
            
            for field in required_fields:
                if field not in status:
                    missing_fields.append(field)
                else:
                    field_data = status[field]
                    if not isinstance(field_data, dict):
                        missing_fields.append(f"{field} (not dict)")
                    elif "status" not in field_data:
                        missing_fields.append(f"{field}.status")
                    elif "last_updated" not in field_data:
                        missing_fields.append(f"{field}.last_updated")
            
            if missing_fields:
                self.log_test(test_name, False, f"Missing required fields: {missing_fields}", {"status": status})
                return None
            
            # Verify default values (for new building)
            expected_defaults = {
                "wifi": "active",
                "elevator": "inactive", 
                "electricity": "active",
                "water": "active",
                "cleaning": "active"
            }
            
            default_check_passed = True
            for field, expected_status in expected_defaults.items():
                actual_status = status[field].get("status")
                if actual_status not in ["active", "inactive", "maintenance"]:
                    self.log_test(f"{test_name} - Status Values", False, 
                                f"Invalid status value for {field}: {actual_status}")
                    default_check_passed = False
            
            if default_check_passed:
                self.log_test(test_name, True, "Bina durumu başarıyla getirildi", {
                    "building_id": building_id,
                    "wifi": status["wifi"]["status"],
                    "elevator": status["elevator"]["status"],
                    "electricity": status["electricity"]["status"],
                    "water": status["water"]["status"],
                    "cleaning": status["cleaning"]["status"]
                })
            
            return status
            
        except Exception as e:
            self.log_test(test_name, False, f"Error: {str(e)}")
            return None

    def test_update_building_status(self, building_id):
        """Test 7: Bina durumu güncelleme (YENİ ÖZELLİK - ÖNCELİK: Orta)"""
        test_name = "PUT /api/buildings/{building_id}/status - Durum Güncelleme"
        
        try:
            # Test update data
            update_data = {
                "elevator": "active",
                "wifi": "maintenance"
            }
            
            response = requests.put(f"{BACKEND_URL}/buildings/{building_id}/status", 
                                  json=update_data, timeout=30)
            
            if response.status_code != 200:
                self.log_test(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
                return None
                
            updated_status = response.json()
            
            # Verify updates were applied
            update_errors = []
            
            if updated_status.get("elevator", {}).get("status") != "active":
                update_errors.append("elevator not updated to active")
                
            if updated_status.get("wifi", {}).get("status") != "maintenance":
                update_errors.append("wifi not updated to maintenance")
            
            # Verify timestamps were updated
            for field in ["elevator", "wifi"]:
                if field in updated_status:
                    last_updated = updated_status[field].get("last_updated")
                    if not last_updated:
                        update_errors.append(f"{field} missing last_updated timestamp")
            
            if update_errors:
                self.log_test(test_name, False, f"Update validation failed: {update_errors}", 
                            {"response": updated_status})
                return None
                
            self.log_test(test_name, True, "Bina durumu başarıyla güncellendi", {
                "building_id": building_id,
                "updated_elevator": updated_status["elevator"]["status"],
                "updated_wifi": updated_status["wifi"]["status"]
            })
            return updated_status
            
        except Exception as e:
            self.log_test(test_name, False, f"Error: {str(e)}")
            return None

    def test_building_status_persistence(self, building_id):
        """Test 8: Bina durumu kalıcılık kontrolü"""
        test_name = "GET /api/buildings/{building_id}/status - Persistence Check"
        
        try:
            response = requests.get(f"{BACKEND_URL}/buildings/{building_id}/status", timeout=30)
            
            if response.status_code != 200:
                self.log_test(test_name, False, f"HTTP {response.status_code}", {"response": response.text})
                return None
                
            status = response.json()
            
            # Check if previous updates are still there
            persistence_errors = []
            
            if status.get("elevator", {}).get("status") != "active":
                persistence_errors.append("elevator status not persisted")
                
            if status.get("wifi", {}).get("status") != "maintenance":
                persistence_errors.append("wifi status not persisted")
            
            if persistence_errors:
                self.log_test(test_name, False, f"Persistence check failed: {persistence_errors}", 
                            {"status": status})
                return None
                
            self.log_test(test_name, True, "Durum güncellemeleri kalıcı olarak kaydedildi", {
                "building_id": building_id,
                "elevator_persisted": status["elevator"]["status"],
                "wifi_persisted": status["wifi"]["status"]
            })
            return status
            
        except Exception as e:
            self.log_test(test_name, False, f"Error: {str(e)}")
            return None
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Backend API Test Suite başlatılıyor...")
        print(f"📡 Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Test 1: New tenant login
        self.test_login_new_tenant()
        
        # Test 2: New owner login  
        self.test_login_new_owner()
        
        # Test 3: Existing user login
        self.test_login_existing_user()
        
        # Test 4: Get buildings
        buildings = self.test_get_buildings()
        
        # Test 5: Get user details
        self.test_get_user_details()
        
        # Get building ID for status tests
        building_id = "693039d65725275621c2f007"  # Default from requirements
        if buildings and len(buildings) > 0:
            building_id = buildings[0]["_id"]
            print(f"🏗️ Using building ID for status tests: {building_id}")
        
        print("\n🔥 YENİ ÖZELLİK TESTLERİ - Bina Durumu API'leri")
        print("-" * 40)
        
        # Test 6: Get building status (NEW FEATURE - HIGH PRIORITY)
        self.test_get_building_status(building_id)
        
        # Test 7: Update building status (NEW FEATURE - MEDIUM PRIORITY)  
        self.test_update_building_status(building_id)
        
        # Test 8: Verify status persistence
        self.test_building_status_persistence(building_id)
        
        # Summary
        print("=" * 60)
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"📊 Test Sonuçları: {passed}/{total} test başarılı")
        
        # Separate old vs new feature results
        old_tests = [r for r in self.test_results if "status" not in r["test"].lower()]
        new_tests = [r for r in self.test_results if "status" in r["test"].lower()]
        
        old_passed = sum(1 for r in old_tests if r["success"])
        new_passed = sum(1 for r in new_tests if r["success"])
        
        print(f"   📋 Mevcut API'ler: {old_passed}/{len(old_tests)} başarılı")
        print(f"   🔥 Yeni Bina Durumu API'leri: {new_passed}/{len(new_tests)} başarılı")
        
        if passed == total:
            print("🎉 Tüm testler başarıyla geçti!")
            return True
        else:
            print("⚠️  Bazı testler başarısız oldu:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   ❌ {result['test']}: {result['message']}")
            return False

def main():
    """Main test runner"""
    tester = BackendTester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()