import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [building, setBuilding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Demo kullanıcı bilgileri
      const userData = {
        _id: 'demo-user-123',
        name: 'Ahmet Yılmaz',
        phone_number: '5551234567',
        email: 'ahmet.yilmaz@email.com',
        role: 'tenant',
        apartment_number: 5,
        block: 'A',
        floor: 2,
      };
      
      const buildingData = {
        name: 'Örnek Sitesi',
        address: 'Kadıköy, İstanbul',
      };

      setUser(userData);
      setBuilding(buildingData);
    } catch (error) {
      console.error('Kullanıcı bilgisi yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: () => {
            router.replace('/');
          },
        },
      ]
    );
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'tenant':
        return 'Kiracı';
      case 'owner':
        return 'Mülk Sahibi';
      case 'both':
        return 'Kiracı & Mülk Sahibi';
      default:
        return 'Kullanıcı';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profilim</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profilim</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profil Kartı */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#8b5cf6" />
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#8b5cf6" />
            <Text style={styles.roleText}>{getRoleLabel(user?.role)}</Text>
          </View>
        </View>

        {/* Kişisel Bilgiler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="call" size={20} color="#3b82f6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Telefon</Text>
                <Text style={styles.infoValue}>{user?.phone_number}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="mail" size={20} color="#10b981" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>E-posta</Text>
                <Text style={styles.infoValue}>{user?.email || 'Ekli değil'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Daire Bilgileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daire Bilgileri</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="business" size={20} color="#f59e0b" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Site Adı</Text>
                <Text style={styles.infoValue}>{building?.name}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="location" size={20} color="#ef4444" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Adres</Text>
                <Text style={styles.infoValue}>{building?.address}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="home" size={20} color="#8b5cf6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Daire</Text>
                <Text style={styles.infoValue}>
                  {user?.block} Blok - Daire {user?.apartment_number} (Kat {user?.floor})
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bildirim Ayarları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirim Ayarları</Text>
          
          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications" size={24} color="#3b82f6" />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Push Bildirimleri</Text>
                  <Text style={styles.settingDescription}>
                    Duyurular ve güncellemeler
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={notificationsEnabled ? '#3b82f6' : '#f3f4f6'}
              />
            </View>

            <View style={styles.settingDivider} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="chatbubble-ellipses" size={24} color="#10b981" />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>SMS Bildirimleri</Text>
                  <Text style={styles.settingDescription}>
                    Aidat ve önemli duyurular (Yakında)
                  </Text>
                </View>
              </View>
              <Switch
                value={smsEnabled}
                onValueChange={setSmsEnabled}
                trackColor={{ false: '#d1d5db', true: '#86efac' }}
                thumbColor={smsEnabled ? '#10b981' : '#f3f4f6'}
                disabled={true}
              />
            </View>
          </View>
        </View>

        {/* Hızlı Erişim */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          
          <View style={styles.quickAccessCard}>
            <TouchableOpacity style={styles.quickAccessItem}>
              <Ionicons name="document-text" size={24} color="#3b82f6" />
              <Text style={styles.quickAccessText}>Kullanım Koşulları</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.quickAccessDivider} />

            <TouchableOpacity style={styles.quickAccessItem}>
              <Ionicons name="shield-checkmark" size={24} color="#10b981" />
              <Text style={styles.quickAccessText}>Gizlilik Politikası</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.quickAccessDivider} />

            <TouchableOpacity style={styles.quickAccessItem}>
              <Ionicons name="help-circle" size={24} color="#f59e0b" />
              <Text style={styles.quickAccessText}>Yardım & Destek</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.quickAccessDivider} />

            <TouchableOpacity style={styles.quickAccessItem}>
              <Ionicons name="information-circle" size={24} color="#8b5cf6" />
              <Text style={styles.quickAccessText}>Uygulama Hakkında</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Çıkış Yap Butonu */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#ef4444" />
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>

        {/* Versiyon Bilgisi */}
        <Text style={styles.versionText}>Versiyon 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingInfo: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  quickAccessCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickAccessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  quickAccessText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  quickAccessDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 52,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
  versionText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 24,
  },
});
