import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function LegalProcessScreen() {
  const router = useRouter();
  const [legalProcess, setLegalProcess] = useState<any>(null);
  const [paymentPlan, setPaymentPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Hukuki süreç bilgisi
      const legalResponse = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/apartments/demo-apartment-123/legal-process`
      );
      const legalData = await legalResponse.json();
      setLegalProcess(legalData);

      // Ödeme planı
      const paymentResponse = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/apartments/demo-apartment-123/payment-plan`
      );
      const paymentData = await paymentResponse.json();
      setPaymentPlan(paymentData);
    } catch (error) {
      console.error('Hukuki süreç yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const formatDate = (dateString: string) => {
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
          <Text style={styles.headerTitle}>Hukuki Süreç</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Hukuki süreç yoksa
  if (!legalProcess?.has_process) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hukuki Süreç</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <View style={styles.noProcessContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          </View>
          <Text style={styles.noProcessTitle}>Hukuki Süreç Bulunmuyor</Text>
          <Text style={styles.noProcessText}>
            Aidat ödemeleriniz düzenli. Hakkınızda hukuki işlem bulunmamaktadır.
          </Text>
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
        <Text style={styles.headerTitle}>Hukuki Süreç</Text>
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
        {/* Uyarı Kartı */}
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={32} color="#dc2626" />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Hukuki Süreç Devam Ediyor</Text>
            <Text style={styles.warningText}>
              Aidat borcunuz nedeniyle hukuki işlem başlatılmıştır.
            </Text>
          </View>
        </View>

        {/* Borç Özeti */}
        <View style={styles.debtCard}>
          <Text style={styles.sectionTitle}>Borç Özeti</Text>
          <View style={styles.debtRow}>
            <Text style={styles.debtLabel}>Toplam Borç</Text>
            <Text style={styles.debtAmount}>₺ {legalProcess.total_debt?.toFixed(2)}</Text>
          </View>
          <View style={styles.debtRow}>
            <Text style={styles.debtLabel}>Geciken Ay</Text>
            <Text style={styles.debtMonths}>{legalProcess.overdue_months} Ay</Text>
          </View>
        </View>

        {/* Süreç Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Süreç Aşamaları</Text>
          
          {legalProcess.timeline?.map((stage: any, index: number) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.timelineDot,
                    stage.completed ? styles.timelineDotCompleted : styles.timelineDotPending,
                  ]}
                >
                  {stage.completed && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                </View>
                {index < legalProcess.timeline.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      stage.completed
                        ? styles.timelineLineCompleted
                        : styles.timelineLinePending,
                    ]}
                  />
                )}
              </View>

              <View style={styles.timelineContent}>
                <Text style={[styles.stageTitle, !stage.completed && styles.stageTitlePending]}>
                  {stage.title}
                </Text>
                <Text style={styles.stageDescription}>{stage.description}</Text>
                {stage.date && (
                  <Text style={styles.stageDate}>{formatDate(stage.date)}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Ödeme Planı */}
        {paymentPlan?.has_debt && (
          <View style={styles.paymentPlanCard}>
            <View style={styles.planHeader}>
              <Ionicons name="card" size={24} color="#3b82f6" />
              <Text style={styles.planTitle}>Önerilen Ödeme Planı</Text>
            </View>
            <Text style={styles.planDescription}>
              {paymentPlan.suggested_plan.description}
            </Text>
            <View style={styles.planDetails}>
              <View style={styles.planItem}>
                <Text style={styles.planLabel}>Taksit Sayısı</Text>
                <Text style={styles.planValue}>{paymentPlan.suggested_plan.installments}</Text>
              </View>
              <View style={styles.planDivider} />
              <View style={styles.planItem}>
                <Text style={styles.planLabel}>Aylık Tutar</Text>
                <Text style={styles.planValue}>
                  ₺ {paymentPlan.suggested_plan.monthly_amount}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.contactButton}>
              <Ionicons name="call" size={20} color="#ffffff" />
              <Text style={styles.contactButtonText}>Yönetim ile Görüş</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* İletişim Bilgileri */}
        {legalProcess.contact && (
          <View style={styles.contactCard}>
            <Text style={styles.sectionTitle}>Avukat İletişim</Text>
            
            <View style={styles.contactItem}>
              <Ionicons name="person-circle" size={24} color="#6b7280" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Avukat</Text>
                <Text style={styles.contactValue}>{legalProcess.contact.lawyer_name}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleCall(legalProcess.contact.lawyer_phone)}
            >
              <Ionicons name="call" size={24} color="#10b981" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Telefon</Text>
                <Text style={[styles.contactValue, styles.contactLink]}>
                  {legalProcess.contact.lawyer_phone}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleEmail(legalProcess.contact.lawyer_email)}
            >
              <Ionicons name="mail" size={24} color="#3b82f6" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>E-posta</Text>
                <Text style={[styles.contactValue, styles.contactLink]}>
                  {legalProcess.contact.lawyer_email}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        )}

        {/* Notlar */}
        {legalProcess.notes && (
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <Ionicons name="document-text" size={20} color="#f59e0b" />
              <Text style={styles.notesTitle}>Önemli Not</Text>
            </View>
            <Text style={styles.notesText}>{legalProcess.notes}</Text>
          </View>
        )}
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
  noProcessContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  noProcessTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  noProcessText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 16,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#991b1b',
  },
  debtCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  debtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  debtLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  debtAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ef4444',
  },
  debtMonths: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f59e0b',
  },
  section: {
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotCompleted: {
    backgroundColor: '#10b981',
  },
  timelineDotPending: {
    backgroundColor: '#e5e7eb',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineLineCompleted: {
    backgroundColor: '#10b981',
  },
  timelineLinePending: {
    backgroundColor: '#e5e7eb',
  },
  timelineContent: {
    flex: 1,
  },
  stageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  stageTitlePending: {
    color: '#9ca3af',
  },
  stageDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  stageDate: {
    fontSize: 12,
    color: '#10b981',
  },
  paymentPlanCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e40af',
  },
  planDescription: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 16,
  },
  planDetails: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  planItem: {
    flex: 1,
    alignItems: 'center',
  },
  planLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  planValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e40af',
  },
  planDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  contactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  contactLink: {
    color: '#3b82f6',
  },
  notesCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  notesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
  },
  notesText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
});
