import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function PaymentReceiptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [due, setDue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const dueId = params.dueId as string;

  useEffect(() => {
    fetchDueDetail();
  }, []);

  const fetchDueDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/dues/${dueId}`);
      const data = await response.json();
      setDue(data);
    } catch (error) {
      console.error('Makbuz yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const message = `
Ödeme Makbuzu

Aidat: ${formatMonth(due.month, due.year)}
Tutar: ₺ ${due.amount.toFixed(2)}
Ödeme Tarihi: ${formatDate(due.payment_date)}
İşlem No: ${due.transaction_id}

Örnek Sitesi - Bina Yönetim Sistemi
      `;

      await Share.share({
        message: message.trim(),
      });
    } catch (error) {
      console.error('Paylaşma hatası:', error);
    }
  };

  const formatMonth = (month: number, year: number) => {
    const monthNames = [
      'Ocak',
      'Şubat',
      'Mart',
      'Nisan',
      'Mayıs',
      'Haziran',
      'Temmuz',
      'Ağustos',
      'Eylül',
      'Ekim',
      'Kasım',
      'Aralık',
    ];
    return `${monthNames[month - 1]} ${year}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ödeme Makbuzu</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!due) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ödeme Makbuzu</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
          <Text style={styles.errorText}>Makbuz bulunamadı</Text>
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
        <Text style={styles.headerTitle}>Ödeme Makbuzu</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Başarı İkonu */}
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          </View>
          <Text style={styles.successTitle}>Ödeme Başarılı!</Text>
          <Text style={styles.successText}>Ödemeniz başarıyla alınmıştır.</Text>
        </View>

        {/* Makbuz Kartı */}
        <View style={styles.receiptCard}>
          {/* Logo / Başlık */}
          <View style={styles.receiptHeader}>
            <Ionicons name="business" size={40} color="#3b82f6" />
            <Text style={styles.receiptCompany}>Örnek Sitesi</Text>
            <Text style={styles.receiptSubtitle}>Aidat Ödeme Makbuzu</Text>
          </View>

          <View style={styles.divider} />

          {/* Ödeme Detayları */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Aidat Dönemi</Text>
              <Text style={styles.detailValue}>{formatMonth(due.month, due.year)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tutar</Text>
              <Text style={[styles.detailValue, styles.amountText]}>
                ₺ {due.amount.toFixed(2)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ödeme Tarihi</Text>
              <Text style={styles.detailValue}>{formatDate(due.payment_date)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ödeme Yöntemi</Text>
              <Text style={styles.detailValue}>Kredi Kartı</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>İşlem Numarası</Text>
              <Text style={[styles.detailValue, styles.transactionId]}>
                {due.transaction_id}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Durum */}
          <View style={styles.statusSection}>
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.statusText}>ÖDENDİ</Text>
            </View>
          </View>
        </View>

        {/* Bilgi Notu */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            Bu makbuz elektronik ortamda oluşturulmuştur. Herhangi bir imza veya mühür
            gerektirmez.
          </Text>
        </View>

        {/* Aksiyonlar */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-social" size={24} color="#3b82f6" />
            <Text style={styles.actionButtonText}>Paylaş</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/dues')}
          >
            <Ionicons name="document-text" size={24} color="#10b981" />
            <Text style={styles.actionButtonText}>Tüm Aidatlar</Text>
          </TouchableOpacity>
        </View>

        {/* Ana Sayfaya Dön */}
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push('/home')}
        >
          <Ionicons name="home" size={20} color="#ffffff" />
          <Text style={styles.homeButtonText}>Ana Sayfaya Dön</Text>
        </TouchableOpacity>
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
  shareButton: {
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: '#6b7280',
  },
  receiptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  receiptCompany: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  receiptSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  detailsSection: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  amountText: {
    fontSize: 18,
    color: '#10b981',
  },
  transactionId: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  statusSection: {
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  infoNote: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
