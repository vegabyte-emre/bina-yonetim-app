import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
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

interface StatusHistory {
  date: string;
  facility: string;
  status: StatusType;
  note: string;
}

export default function BuildingStatusDetailScreen() {
  const router = useRouter();
  const [buildingStatus, setBuildingStatus] = useState<BuildingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Demo geçmiş kayıtları
  const statusHistory: StatusHistory[] = [
    {
      date: '2025-12-03T10:30:00',
      facility: 'Asansör',
      status: 'inactive',
      note: 'Arıza nedeniyle devre dışı. Teknisyen çağrıldı.',
    },
    {
      date: '2025-12-02T14:15:00',
      facility: 'Wi-Fi',
      status: 'maintenance',
      note: 'Router güncellemesi yapıldı.',
    },
    {
      date: '2025-12-01T09:00:00',
      facility: 'Su',
      status: 'active',
      note: 'Su kesintisi giderildi.',
    },
  ];

  // Demo bakım takvimi
  const maintenanceSchedule = [
    {
      date: '2025-12-10',
      facility: 'Asansör',
      description: 'Yıllık periyodik bakım',
      time: '09:00 - 12:00',
    },
    {
      date: '2025-12-15',
      facility: 'Elektrik',
      description: 'Jeneratör test çalışması',
      time: '14:00 - 15:00',
    },
    {
      date: '2025-12-20',
      facility: 'Su',
      description: 'Su deposu temizliği',
      time: '08:00 - 17:00',
    },
  ];

  useEffect(() => {
    fetchBuildingStatus();
  }, []);

  const fetchBuildingStatus = async () => {
    try {
      setLoading(true);
      const buildingsResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/buildings`);
      const buildings = await buildingsResponse.json();

      if (buildings && buildings.length > 0) {
        const actualBuildingId = buildings[0]._id;

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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBuildingStatus();
    setRefreshing(false);
  };

  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case 'active':
        return {
          color: '#10b981',
          bgColor: '#d1fae5',
          text: 'Aktif',
          icon: 'checkmark-circle',
        };
      case 'inactive':
        return {
          color: '#ef4444',
          bgColor: '#fee2e2',
          text: 'Arızalı',
          icon: 'close-circle',
        };
      case 'maintenance':
        return {
          color: '#f59e0b',
          bgColor: '#fef3c7',
          text: 'Bakımda',
          icon: 'construct',
        };
      default:
        return {
          color: '#6b7280',
          bgColor: '#f3f4f6',
          text: 'Bilinmiyor',
          icon: 'help-circle',
        };
    }
  };

  const getFacilityIcon = (facility: string) => {
    switch (facility.toLowerCase()) {
      case 'wifi':
      case 'wi-fi':
        return 'wifi';
      case 'asansör':
      case 'elevator':
        return 'arrow-up-circle';
      case 'elektrik':
      case 'electricity':
        return 'flash';
      case 'su':
      case 'water':
        return 'water';
      case 'temizlik':
      case 'cleaning':
        return 'brush';
      default:
        return 'information-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Bugün, ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Dün, ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const formatScheduleDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bina Durumu</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bina Durumu</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Mevcut Durum */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mevcut Durum</Text>

          {buildingStatus && (
            <>
              {/* Wi-Fi */}
              {buildingStatus.wifi && (
                <View style={styles.statusCard}>
                  <View style={styles.statusCardHeader}>
                    <View
                      style={[
                        styles.statusIconLarge,
                        { backgroundColor: getStatusConfig(buildingStatus.wifi.status).bgColor },
                      ]}
                    >
                      <Ionicons
                        name="wifi"
                        size={32}
                        color={getStatusConfig(buildingStatus.wifi.status).color}
                      />
                    </View>
                    <View style={styles.statusCardInfo}>
                      <Text style={styles.statusCardTitle}>Wi-Fi</Text>
                      <Text style={styles.statusCardTime}>
                        Son güncelleme: {formatDate(buildingStatus.wifi.last_updated)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadgeLarge,
                        { backgroundColor: getStatusConfig(buildingStatus.wifi.status).bgColor },
                      ]}
                    >
                      <Ionicons
                        name={getStatusConfig(buildingStatus.wifi.status).icon as any}
                        size={16}
                        color={getStatusConfig(buildingStatus.wifi.status).color}
                      />
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: getStatusConfig(buildingStatus.wifi.status).color },
                        ]}
                      >
                        {getStatusConfig(buildingStatus.wifi.status).text}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Asansör */}
              {buildingStatus.elevator && (
                <View style={styles.statusCard}>
                  <View style={styles.statusCardHeader}>
                    <View
                      style={[
                        styles.statusIconLarge,
                        { backgroundColor: getStatusConfig(buildingStatus.elevator.status).bgColor },
                      ]}
                    >
                      <Ionicons
                        name="arrow-up-circle"
                        size={32}
                        color={getStatusConfig(buildingStatus.elevator.status).color}
                      />
                    </View>
                    <View style={styles.statusCardInfo}>
                      <Text style={styles.statusCardTitle}>Asansör</Text>
                      <Text style={styles.statusCardTime}>
                        Son güncelleme: {formatDate(buildingStatus.elevator.last_updated)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadgeLarge,
                        { backgroundColor: getStatusConfig(buildingStatus.elevator.status).bgColor },
                      ]}
                    >
                      <Ionicons
                        name={getStatusConfig(buildingStatus.elevator.status).icon as any}
                        size={16}
                        color={getStatusConfig(buildingStatus.elevator.status).color}
                      />
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: getStatusConfig(buildingStatus.elevator.status).color },
                        ]}
                      >
                        {getStatusConfig(buildingStatus.elevator.status).text}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Elektrik */}
              {buildingStatus.electricity && (
                <View style={styles.statusCard}>
                  <View style={styles.statusCardHeader}>
                    <View
                      style={[
                        styles.statusIconLarge,
                        {
                          backgroundColor: getStatusConfig(buildingStatus.electricity.status)
                            .bgColor,
                        },
                      ]}
                    >
                      <Ionicons
                        name="flash"
                        size={32}
                        color={getStatusConfig(buildingStatus.electricity.status).color}
                      />
                    </View>
                    <View style={styles.statusCardInfo}>
                      <Text style={styles.statusCardTitle}>Elektrik</Text>
                      <Text style={styles.statusCardTime}>
                        Son güncelleme: {formatDate(buildingStatus.electricity.last_updated)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadgeLarge,
                        {
                          backgroundColor: getStatusConfig(buildingStatus.electricity.status)
                            .bgColor,
                        },
                      ]}
                    >
                      <Ionicons
                        name={getStatusConfig(buildingStatus.electricity.status).icon as any}
                        size={16}
                        color={getStatusConfig(buildingStatus.electricity.status).color}
                      />
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: getStatusConfig(buildingStatus.electricity.status).color },
                        ]}
                      >
                        {getStatusConfig(buildingStatus.electricity.status).text}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Su */}
              {buildingStatus.water && (
                <View style={styles.statusCard}>
                  <View style={styles.statusCardHeader}>
                    <View
                      style={[
                        styles.statusIconLarge,
                        { backgroundColor: getStatusConfig(buildingStatus.water.status).bgColor },
                      ]}
                    >
                      <Ionicons
                        name="water"
                        size={32}
                        color={getStatusConfig(buildingStatus.water.status).color}
                      />
                    </View>
                    <View style={styles.statusCardInfo}>
                      <Text style={styles.statusCardTitle}>Su</Text>
                      <Text style={styles.statusCardTime}>
                        Son güncelleme: {formatDate(buildingStatus.water.last_updated)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadgeLarge,
                        { backgroundColor: getStatusConfig(buildingStatus.water.status).bgColor },
                      ]}
                    >
                      <Ionicons
                        name={getStatusConfig(buildingStatus.water.status).icon as any}
                        size={16}
                        color={getStatusConfig(buildingStatus.water.status).color}
                      />
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: getStatusConfig(buildingStatus.water.status).color },
                        ]}
                      >
                        {getStatusConfig(buildingStatus.water.status).text}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* Geçmiş Kayıtlar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geçmiş Kayıtlar</Text>
          {statusHistory.map((item, index) => (
            <View key={index} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View
                  style={[
                    styles.historyIcon,
                    { backgroundColor: getStatusConfig(item.status).bgColor },
                  ]}
                >
                  <Ionicons
                    name={getFacilityIcon(item.facility) as any}
                    size={20}
                    color={getStatusConfig(item.status).color}
                  />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>{item.facility}</Text>
                  <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
                </View>
                <View
                  style={[
                    styles.historyBadge,
                    { backgroundColor: getStatusConfig(item.status).bgColor },
                  ]}
                >
                  <Text
                    style={[styles.historyBadgeText, { color: getStatusConfig(item.status).color }]}
                  >
                    {getStatusConfig(item.status).text}
                  </Text>
                </View>
              </View>
              <Text style={styles.historyNote}>{item.note}</Text>
            </View>
          ))}
        </View>

        {/* Bakım Takvimi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Planlı Bakım Takvimi</Text>
          {maintenanceSchedule.map((item, index) => (
            <View key={index} style={styles.maintenanceCard}>
              <View style={styles.maintenanceDateBox}>
                <Text style={styles.maintenanceDay}>
                  {new Date(item.date).getDate()}
                </Text>
                <Text style={styles.maintenanceMonth}>
                  {new Date(item.date).toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase()}
                </Text>
              </View>
              <View style={styles.maintenanceInfo}>
                <View style={styles.maintenanceHeader}>
                  <Ionicons
                    name={getFacilityIcon(item.facility) as any}
                    size={20}
                    color="#8b5cf6"
                  />
                  <Text style={styles.maintenanceTitle}>{item.facility}</Text>
                </View>
                <Text style={styles.maintenanceDescription}>{item.description}</Text>
                <View style={styles.maintenanceTime}>
                  <Ionicons name="time-outline" size={16} color="#6b7280" />
                  <Text style={styles.maintenanceTimeText}>{item.time}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* İletişim Bilgileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İletişim Bilgileri</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Ionicons name="call" size={24} color="#3b82f6" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Site Yönetimi</Text>
                <Text style={styles.contactValue}>0 (212) 555 00 00</Text>
              </View>
            </View>

            <View style={styles.contactDivider} />

            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Ionicons name="construct" size={24} color="#10b981" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Teknik Servis</Text>
                <Text style={styles.contactValue}>0 (212) 555 00 01</Text>
              </View>
            </View>

            <View style={styles.contactDivider} />

            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Ionicons name="shield-checkmark" size={24} color="#f59e0b" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Güvenlik</Text>
                <Text style={styles.contactValue}>0 (212) 555 00 02</Text>
              </View>
            </View>
          </View>

          {/* Acil Durum Notu */}
          <View style={styles.emergencyNote}>
            <Ionicons name="warning" size={20} color="#ef4444" />
            <Text style={styles.emergencyText}>
              Acil durumlarda lütfen güvenlik ile iletişime geçin.
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCardInfo: {
    flex: 1,
    marginLeft: 16,
  },
  statusCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  statusCardTime: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  historyDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  historyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyNote: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginLeft: 52,
  },
  maintenanceCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  maintenanceDateBox: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 8,
  },
  maintenanceDay: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  maintenanceMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 2,
  },
  maintenanceInfo: {
    flex: 1,
    marginLeft: 16,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  maintenanceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  maintenanceDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  maintenanceTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maintenanceTimeText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 4,
  },
  contactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  contactDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  emergencyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  emergencyText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#991b1b',
  },
});
