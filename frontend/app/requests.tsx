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

interface Request {
  _id: string;
  category: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export default function RequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/users/demo-user-123/requests`
      );
      const data = await response.json();
      setRequests(data || []);
    } catch (error) {
      console.error('Talep yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
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
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Bugün, ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return 'Dün';
    } else if (diffDays < 7) {
      return `${diffDays} gün önce`;
    } else {
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Talep & Şikayet</Text>
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
        <Text style={styles.headerTitle}>Talep & Şikayet</Text>
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
        {/* Yeni Talep Butonu */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/create-request')}
        >
          <Ionicons name="add-circle" size={24} color="#ffffff" />
          <Text style={styles.createButtonText}>Yeni Talep Oluştur</Text>
        </TouchableOpacity>

        {/* Özet Kartı */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{requests.length}</Text>
            <Text style={styles.summaryLabel}>Toplam Talep</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>
              {requests.filter((r) => r.status === 'in_progress').length}
            </Text>
            <Text style={styles.summaryLabel}>Çalışılıyor</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>
              {requests.filter((r) => r.status === 'resolved').length}
            </Text>
            <Text style={styles.summaryLabel}>Çözüldü</Text>
          </View>
        </View>

        {/* Talep Listesi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Taleplerim</Text>

          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>Henüz talep bulunmuyor</Text>
              <Text style={styles.emptySubtext}>Yeni talep oluşturmak için yukarıdaki butona tıklayın</Text>
            </View>
          ) : (
            requests.map((request) => {
              const statusConfig = getStatusConfig(request.status);
              const categoryConfig = getCategoryConfig(request.category);

              return (
                <TouchableOpacity
                  key={request._id}
                  style={styles.requestCard}
                  onPress={() =>
                    router.push({
                      pathname: '/request-detail',
                      params: { id: request._id },
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.requestHeader}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: `${categoryConfig.color}15` },
                      ]}
                    >
                      <Ionicons
                        name={categoryConfig.icon as any}
                        size={20}
                        color={categoryConfig.color}
                      />
                    </View>

                    <View style={styles.requestMeta}>
                      <View style={styles.categoryBadge}>
                        <Text style={[styles.categoryText, { color: categoryConfig.color }]}>
                          {categoryConfig.label}
                        </Text>
                      </View>
                      <Text style={styles.requestDate}>{formatDate(request.created_at)}</Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                      <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
                      <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.text}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.requestTitle}>{request.title}</Text>
                  <Text style={styles.requestDescription} numberOfLines={2}>
                    {request.description}
                  </Text>

                  <View style={styles.requestFooter}>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  requestHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  requestMeta: {
    flex: 1,
  },
  categoryBadge: {
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  requestDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  requestFooter: {
    alignItems: 'flex-end',
  },
});
