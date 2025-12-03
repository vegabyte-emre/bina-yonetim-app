import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Due {
  _id: string;
  amount: number;
  month: number;
  year: number;
  due_date: string;
  paid: boolean;
  payment_date?: string;
  description: string;
  transaction_id?: string;
}

export default function DuesScreen() {
  const router = useRouter();
  const [dues, setDues] = useState<Due[]>([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Demo daire ID'si (gerçek uygulamada kullanıcıdan gelecek)
  const apartmentId = 'demo-apartment-id';

  useEffect(() => {
    fetchDues();
  }, []);

  const fetchDues = async () => {
    try {
      setLoading(true);
      // Önce binaları çek
      const buildingsResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/buildings`);
      const buildings = await buildingsResponse.json();

      if (buildings && buildings.length > 0) {
        // İlk dairenin ID'sini kullan (demo için)
        const apartmentsResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/buildings`);
        
        // Demo apartment ID ile aidatları getir
        const duesResponse = await fetch(
          `${EXPO_PUBLIC_BACKEND_URL}/api/apartments/demo-apartment-123/dues`
        );
        const duesData = await duesResponse.json();

        setDues(duesData.dues || []);
        setTotalDebt(duesData.total_debt || 0);
        setOverdueCount(duesData.overdue_count || 0);
      }
    } catch (error) {
      console.error('Aidat yükleme hatası:', error);
      Alert.alert('Hata', 'Aidat bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDues();
    setRefreshing(false);
  };

  const handlePayment = (due: Due) => {
    if (due.paid) {
      // Makbuzu göster
      router.push({
        pathname: '/payment-receipt',
        params: { dueId: due._id },
      });
    } else {
      // Ödeme sayfasına git
      router.push({
        pathname: '/payment',
        params: { dueId: due._id, amount: due.amount.toString() },
      });
    }
  };

  const formatMonth = (month: number, year: number) => {
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${monthNames[month - 1]} ${year}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isOverdue = (due: Due) => {
    if (due.paid) return false;
    const dueDate = new Date(due.due_date);
    return dueDate < new Date();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Aidat Ödemeleri</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
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
        <Text style={styles.headerTitle}>Aidat Ödemeleri</Text>
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
        {/* Özet Kartı */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="wallet" size={32} color="#3b82f6" />
            <Text style={styles.summaryTitle}>Aidat Durumu</Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Toplam Borç</Text>
              <Text style={[styles.summaryValue, totalDebt > 0 ? styles.debtValue : styles.paidValue]}>
                ₺ {totalDebt.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Geciken</Text>
              <Text style={[styles.summaryValue, overdueCount > 0 ? styles.overdueValue : styles.okValue]}>
                {overdueCount} Ay
              </Text>
            </View>
          </View>

          {totalDebt > 0 && (
            <TouchableOpacity 
              style={styles.payAllButton}
              onPress={() => Alert.alert('Toplu Ödeme', 'Tüm borçları ödemek için yönlendiriliyorsunuz...')}
            >
              <Ionicons name="card" size={20} color="#ffffff" />
              <Text style={styles.payAllButtonText}>Tümünü Öde (₺ {totalDebt.toFixed(2)})</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Aidat Listesi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aidat Geçmişi</Text>

          {dues.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>Henüz aidat kaydı bulunmuyor</Text>
            </View>
          ) : (
            dues.map((due) => (
              <TouchableOpacity
                key={due._id}
                style={[
                  styles.dueCard,
                  due.paid && styles.dueCardPaid,
                  isOverdue(due) && styles.dueCardOverdue,
                ]}
                onPress={() => handlePayment(due)}
                activeOpacity={0.7}
              >
                <View style={styles.dueCardLeft}>
                  <View
                    style={[
                      styles.dueIcon,
                      due.paid
                        ? styles.dueIconPaid
                        : isOverdue(due)
                        ? styles.dueIconOverdue
                        : styles.dueIconPending,
                    ]}
                  >
                    <Ionicons
                      name={due.paid ? 'checkmark-circle' : isOverdue(due) ? 'alert-circle' : 'time'}
                      size={28}
                      color={
                        due.paid
                          ? '#10b981'
                          : isOverdue(due)
                          ? '#ef4444'
                          : '#f59e0b'
                      }
                    />
                  </View>

                  <View style={styles.dueInfo}>
                    <Text style={styles.dueMonth}>{formatMonth(due.month, due.year)}</Text>
                    <Text style={styles.dueDescription}>{due.description}</Text>
                    {due.paid && due.payment_date && (
                      <Text style={styles.duePaymentDate}>
                        Ödendi: {formatDate(due.payment_date)}
                      </Text>
                    )}
                    {!due.paid && (
                      <Text style={styles.dueDueDate}>
                        Son ödeme: {formatDate(due.due_date)}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.dueCardRight}>
                  <Text style={styles.dueAmount}>₺ {due.amount.toFixed(2)}</Text>
                  <View
                    style={[
                      styles.dueStatus,
                      due.paid
                        ? styles.dueStatusPaid
                        : isOverdue(due)
                        ? styles.dueStatusOverdue
                        : styles.dueStatusPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dueStatusText,
                        due.paid
                          ? styles.dueStatusTextPaid
                          : isOverdue(due)
                          ? styles.dueStatusTextOverdue
                          : styles.dueStatusTextPending,
                      ]}
                    >
                      {due.paid ? 'Ödendi' : isOverdue(due) ? 'Gecikmiş' : 'Bekliyor'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Bilgilendirme */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            Ödeme yapmak için aidat kartına tıklayın. Geciken ödemeler için gecikme faizi uygulanabilir.
          </Text>
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
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
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
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  debtValue: {
    color: '#ef4444',
  },
  paidValue: {
    color: '#10b981',
  },
  overdueValue: {
    color: '#ef4444',
  },
  okValue: {
    color: '#10b981',
  },
  summaryDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
  },
  payAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  payAllButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6b7280',
  },
  dueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  dueCardPaid: {
    borderColor: '#10b981',
  },
  dueCardOverdue: {
    borderColor: '#ef4444',
  },
  dueCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueIconPaid: {
    backgroundColor: '#d1fae5',
  },
  dueIconOverdue: {
    backgroundColor: '#fee2e2',
  },
  dueIconPending: {
    backgroundColor: '#fef3c7',
  },
  dueInfo: {
    flex: 1,
    marginLeft: 12,
  },
  dueMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  dueDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  duePaymentDate: {
    fontSize: 12,
    color: '#10b981',
  },
  dueDueDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  dueCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dueAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  dueStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dueStatusPaid: {
    backgroundColor: '#d1fae5',
  },
  dueStatusOverdue: {
    backgroundColor: '#fee2e2',
  },
  dueStatusPending: {
    backgroundColor: '#fef3c7',
  },
  dueStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dueStatusTextPaid: {
    color: '#10b981',
  },
  dueStatusTextOverdue: {
    color: '#ef4444',
  },
  dueStatusTextPending: {
    color: '#f59e0b',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
  },
});
