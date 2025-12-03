import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Bina durumu tipleri
type StatusType = 'active' | 'inactive' | 'maintenance';

interface FacilityStatus {
  status: StatusType;
  last_updated: string;
}

interface BuildingStatus {
  wifi: FacilityStatus;
  elevator: FacilityStatus;
  electricity: FacilityStatus;
  water: FacilityStatus;
  cleaning?: FacilityStatus;
}

export default function HomeScreen() {
  const router = useRouter();
  const [buildingStatus, setBuildingStatus] = useState<BuildingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Demo bina ID'si (gerçek uygulamada kullanıcının binasından gelecek)
  const buildingId = 'demo-building-id';

  useEffect(() => {
    fetchBuildingStatus();
  }, []);

  const fetchBuildingStatus = async () => {
    try {
      setLoading(true);
      // İlk önce bina ID'sini alalım (gerçek uygulamada kullanıcıdan gelecek)
      const buildingsResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/buildings`);
      const buildings = await buildingsResponse.json();
      
      if (buildings && buildings.length > 0) {
        const actualBuildingId = buildings[0]._id;
        
        // Bina durumunu getir
        const statusResponse = await fetch(
          `${EXPO_PUBLIC_BACKEND_URL}/api/buildings/${actualBuildingId}/status`
        );
        const statusData = await statusResponse.json();
        setBuildingStatus(statusData);
      }
    } catch (error) {
      console.error('Bina durumu yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case 'active':
        return {
          color: '#10b981',
          bgColor: '#d1fae5',
          text: 'Aktif',
          dotColor: '#10b981',
        };
      case 'inactive':
        return {
          color: '#ef4444',
          bgColor: '#fee2e2',
          text: 'Arızalı',
          dotColor: '#ef4444',
        };
      case 'maintenance':
        return {
          color: '#f59e0b',
          bgColor: '#fef3c7',
          text: 'Bakımda',
          dotColor: '#f59e0b',
        };
      default:
        return {
          color: '#6b7280',
          bgColor: '#f3f4f6',
          text: 'Bilinmiyor',
          dotColor: '#6b7280',
        };
    }
  };

  const menuItems = [
    {
      id: 1,
      title: 'Aidat Ödemeleri',
      icon: 'wallet',
      color: '#3b82f6',
      route: '/dues',
    },
    {
      id: 2,
      title: 'Duyurular',
      icon: 'megaphone',
      color: '#10b981',
      route: '/announcements',
    },
    {
      id: 3,
      title: 'Bina Durumu',
      icon: 'business',
      color: '#f59e0b',
      route: '/building-status',
    },
    {
      id: 4,
      title: 'Talep & Şikayet',
      icon: 'chatbubbles',
      color: '#8b5cf6',
      route: '/requests',
    },
    {
      id: 5,
      title: 'Hukuki Süreç',
      icon: 'document-text',
      color: '#ef4444',
      route: '/legal',
    },
    {
      id: 6,
      title: 'Profilim',
      icon: 'person-circle',
      color: '#6b7280',
      route: '/profile',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Merhaba 👋</Text>
          <Text style={styles.userName}>Ahmet Yılmaz</Text>
          <Text style={styles.apartmentInfo}>A Blok - Daire 5</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications" size={24} color="#111827" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Ana İçerik */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Aidat Özet Kartı */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="wallet" size={24} color="#3b82f6" />
            <Text style={styles.summaryTitle}>Aidat Durumu</Text>
          </View>
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Güncel Borç</Text>
              <Text style={styles.summaryAmount}>₺ 0</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Son Ödeme Tarihi</Text>
              <Text style={styles.summaryDate}>-</Text>
            </View>
          </View>
        </View>

        {/* Bina Durumu Kartı */}
        <TouchableOpacity
          style={styles.buildingStatusCard}
          onPress={() => router.push('/building-status')}
          activeOpacity={0.7}
        >
          <View style={styles.buildingStatusHeader}>
            <Ionicons name="business" size={24} color="#8b5cf6" />
            <Text style={styles.buildingStatusTitle}>Bina Durumu</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color="#8b5cf6" style={{ marginVertical: 20 }} />
          ) : buildingStatus ? (
            <View style={styles.statusGrid}>
              {/* Wi-Fi Durumu */}
              {buildingStatus.wifi && (
                <View style={styles.statusItem}>
                  <View
                    style={[
                      styles.statusIconContainer,
                      { backgroundColor: getStatusConfig(buildingStatus.wifi.status).bgColor },
                    ]}
                  >
                    <Ionicons
                      name="wifi"
                      size={24}
                      color={getStatusConfig(buildingStatus.wifi.status).color}
                    />
                  </View>
                  <Text style={styles.statusLabel}>Wi-Fi</Text>
                  <View style={styles.statusBadge}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusConfig(buildingStatus.wifi.status).dotColor },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusConfig(buildingStatus.wifi.status).color },
                      ]}
                    >
                      {getStatusConfig(buildingStatus.wifi.status).text}
                    </Text>
                  </View>
                </View>
              )}

              {/* Asansör Durumu */}
              {buildingStatus.elevator && (
                <View style={styles.statusItem}>
                  <View
                    style={[
                      styles.statusIconContainer,
                      { backgroundColor: getStatusConfig(buildingStatus.elevator.status).bgColor },
                    ]}
                  >
                    <Ionicons
                      name="arrow-up-circle"
                      size={24}
                      color={getStatusConfig(buildingStatus.elevator.status).color}
                    />
                  </View>
                  <Text style={styles.statusLabel}>Asansör</Text>
                  <View style={styles.statusBadge}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusConfig(buildingStatus.elevator.status).dotColor },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusConfig(buildingStatus.elevator.status).color },
                      ]}
                    >
                      {getStatusConfig(buildingStatus.elevator.status).text}
                    </Text>
                  </View>
                </View>
              )}

              {/* Elektrik Durumu */}
              {buildingStatus.electricity && (
                <View style={styles.statusItem}>
                  <View
                    style={[
                      styles.statusIconContainer,
                      { backgroundColor: getStatusConfig(buildingStatus.electricity.status).bgColor },
                    ]}
                  >
                    <Ionicons
                      name="flash"
                      size={24}
                      color={getStatusConfig(buildingStatus.electricity.status).color}
                    />
                  </View>
                  <Text style={styles.statusLabel}>Elektrik</Text>
                  <View style={styles.statusBadge}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: getStatusConfig(buildingStatus.electricity.status)
                            .dotColor,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusConfig(buildingStatus.electricity.status).color },
                      ]}
                    >
                      {getStatusConfig(buildingStatus.electricity.status).text}
                    </Text>
                  </View>
                </View>
              )}

              {/* Su Durumu */}
              {buildingStatus.water && (
                <View style={styles.statusItem}>
                  <View
                    style={[
                      styles.statusIconContainer,
                      { backgroundColor: getStatusConfig(buildingStatus.water.status).bgColor },
                    ]}
                  >
                    <Ionicons
                      name="water"
                      size={24}
                      color={getStatusConfig(buildingStatus.water.status).color}
                    />
                  </View>
                  <Text style={styles.statusLabel}>Su</Text>
                  <View style={styles.statusBadge}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusConfig(buildingStatus.water.status).dotColor },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusConfig(buildingStatus.water.status).color },
                      ]}
                    >
                      {getStatusConfig(buildingStatus.water.status).text}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.errorText}>Bina durumu yüklenemedi</Text>
          )}
        </TouchableOpacity>

        {/* Menü Grid */}
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => {
                if (item.route === '/dues') {
                  router.push('/dues');
                } else if (item.route === '/announcements') {
                  router.push('/announcements');
                } else if (item.route === '/requests') {
                  router.push('/requests');
                } else if (item.route === '/legal') {
                  router.push('/legal');
                } else if (item.route === '/profile') {
                  router.push('/profile');
                } else {
                  console.log(`Navigating to ${item.route}`);
                }
              }}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Son Duyurular */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son Duyurular</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.announcementCard}>
            <View style={styles.announcementHeader}>
              <Ionicons name="megaphone" size={20} color="#10b981" />
              <Text style={styles.announcementDate}>Bugün, 14:30</Text>
            </View>
            <Text style={styles.announcementTitle}>Henüz duyuru bulunmamaktadır</Text>
            <Text style={styles.announcementText}>
              Yöneticiniz duyuru paylaştığında burada görünecektir.
            </Text>
          </View>
        </View>
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
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  apartmentInfo: {
    fontSize: 14,
    color: '#6b7280',
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  summaryDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  menuItem: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  announcementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  announcementDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  announcementText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  buildingStatusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buildingStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  buildingStatusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statusActive: {
    backgroundColor: '#d1fae5',
  },
  statusInactive: {
    backgroundColor: '#fee2e2',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: '#10b981',
  },
  statusDotInactive: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#10b981',
  },
  statusTextInactive: {
    color: '#ef4444',
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 20,
  },
});
