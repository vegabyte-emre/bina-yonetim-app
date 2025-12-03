import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function RequestDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const requestId = params.id as string;

  useEffect(() => {
    fetchRequestDetail();
  }, []);

  const fetchRequestDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/requests/${requestId}`);
      const data = await response.json();
      setRequest(data);
    } catch (error) {
      console.error('Talep detay yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'received':
        return { color: '#2563eb', bg: '#dbeafe', text: 'Alındı', icon: 'mail' };
      case 'in_progress':
        return { color: '#f59e0b', bg: '#fef3c7', text: 'Çalışılıyor', icon: 'construct' };
      case 'resolved':
        return { color: '#10b981', bg: '#d1fae5', text: 'Çözüldü', icon: 'checkmark-circle' };
      default:
        return { color: '#6b7280', bg: '#f3f4f6', text: 'Bilinmiyor', icon: 'help-circle' };
    }
  };

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'maintenance':
        return { label: 'Bakım', icon: 'build', color: '#f59e0b' };
      case 'cleaning':
        return { label: 'Temizlik', icon: 'brush', color: '#10b981' };
      case 'security':
        return { label: 'Güvenlik', icon: 'shield-checkmark', color: '#ef4444' };
      case 'other':
        return { label: 'Diğer', icon: 'ellipsis-horizontal-circle', color: '#8b5cf6' };
      default:
        return { label: 'Genel', icon: 'information-circle', color: '#6b7280' };
    }
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
          <Text style={styles.headerTitle}>Talep Detayı</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Talep Detayı</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorText}>Talep bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(request.status);
  const categoryConfig = getCategoryConfig(request.category);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Talep Detayı</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Durum Kartı */}
        <View style={[styles.statusCard, { backgroundColor: statusConfig.bg }]}>
          <View style={styles.statusHeader}>
            <Ionicons name={statusConfig.icon as any} size={32} color={statusConfig.color} />
            <View style={styles.statusInfo}>
              <Text style={[styles.statusTitle, { color: statusConfig.color }]}>
                {statusConfig.text}
              </Text>
              <Text style={[styles.statusSubtitle, { color: statusConfig.color }]}>
                Talep durumu
              </Text>
            </View>
          </View>
        </View>

        {/* Talep Bilgileri */}
        <View style={styles.detailCard}>
          <View style={styles.categoryBadgeContainer}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: `${categoryConfig.color}15` },
              ]}
            >
              <Ionicons name={categoryConfig.icon as any} size={16} color={categoryConfig.color} />
              <Text style={[styles.categoryBadgeText, { color: categoryConfig.color }]}>
                {categoryConfig.label}
              </Text>
            </View>
          </View>

          <Text style={styles.requestTitle}>{request.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={16} color="#6b7280" />
              <Text style={styles.metaText}>{formatDate(request.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* Açıklama */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Açıklama</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{request.description}</Text>
          </View>
        </View>

        {/* Süreç Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Süreç Takibi</Text>

          <View style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View style={[styles.timelineDot, styles.timelineDotCompleted]}>
                <Ionicons name="checkmark" size={14} color="#ffffff" />
              </View>
              <View style={[styles.timelineLine, styles.timelineLineCompleted]} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Talep Alındı</Text>
              <Text style={styles.timelineDescription}>
                Talebiniz başarıyla kaydedildi
              </Text>
              <Text style={styles.timelineDate}>{formatDate(request.created_at)}</Text>
            </View>
          </View>

          {request.status === 'in_progress' || request.status === 'resolved' ? (
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, styles.timelineDotCompleted]}>
                  <Ionicons name="checkmark" size={14} color="#ffffff" />
                </View>
                {request.status === 'resolved' && (
                  <View style={[styles.timelineLine, styles.timelineLineCompleted]} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Çalışılıyor</Text>
                <Text style={styles.timelineDescription}>Talebiniz işleme alındı</Text>
                <Text style={styles.timelineDate}>{formatDate(request.updated_at)}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, styles.timelineDotPending]} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, styles.timelineTitlePending]}>
                  Çalışılıyor
                </Text>
                <Text style={styles.timelineDescription}>
                  Talebiniz en kısa sürede değerlendirilecek
                </Text>
              </View>
            </View>
          )}

          {request.status === 'resolved' ? (
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, styles.timelineDotCompleted]}>
                  <Ionicons name="checkmark" size={14} color="#ffffff" />
                </View>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Çözüldü</Text>
                <Text style={styles.timelineDescription}>Talebiniz tamamlandı</Text>
                <Text style={styles.timelineDate}>{formatDate(request.resolved_at)}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, styles.timelineDotPending]} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, styles.timelineTitlePending]}>
                  Çözüldü
                </Text>
                <Text style={styles.timelineDescription}>
                  Talebiniz çözüldüğünde bilgilendirileceksiniz
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* İletişim */}
        <View style={styles.contactNote}>
          <Ionicons name="call" size={20} color="#3b82f6" />
          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>Acil mi?</Text>
            <Text style={styles.contactText}>
              Acil durumlar için yönetim ile iletişime geçebilirsiniz.
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
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  categoryBadgeContainer: {
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#6b7280',
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
  descriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  descriptionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
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
    width: 28,
    height: 28,
    borderRadius: 14,
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
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  timelineTitlePending: {
    color: '#9ca3af',
  },
  timelineDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: '#10b981',
  },
  contactNote: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 13,
    color: '#1e40af',
  },
});
