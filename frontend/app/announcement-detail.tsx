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

interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  created_at: string;
  created_by: string;
}

export default function AnnouncementDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchAnnouncementDetail();
    }
  }, [params.id]);

  const fetchAnnouncementDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/announcements/${params.id}`
      );
      const data = await response.json();
      setAnnouncement(data);

      // Okundu olarak işaretle
      markAsRead();
    } catch (error) {
      console.error('Duyuru detay yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      // Demo user ID - gerçek uygulamada kullanıcıdan gelecek
      await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/announcements/${params.id}/read?user_id=demo-user-123`,
        { method: 'POST' }
      );
    } catch (error) {
      console.error('Okundu işaretleme hatası:', error);
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { color: '#dc2626', bg: '#fee2e2', text: 'Acil', icon: 'alert-circle' };
      case 'high':
        return { color: '#ea580c', bg: '#ffedd5', text: 'Yüksek', icon: 'warning' };
      case 'normal':
        return { color: '#2563eb', bg: '#dbeafe', text: 'Normal', icon: 'information-circle' };
      case 'low':
        return { color: '#059669', bg: '#d1fae5', text: 'Düşük', icon: 'checkmark-circle' };
      default:
        return { color: '#6b7280', bg: '#f3f4f6', text: 'Normal', icon: 'information-circle' };
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'maintenance':
        return 'Bakım';
      case 'meeting':
        return 'Toplantı';
      case 'general':
        return 'Genel';
      default:
        return 'Duyuru';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'maintenance':
        return 'construct';
      case 'meeting':
        return 'people';
      case 'general':
        return 'information-circle';
      default:
        return 'document-text';
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
          <Text style={styles.headerTitle}>Duyuru Detayı</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!announcement) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Duyuru Detayı</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorText}>Duyuru bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  const priorityConfig = getPriorityConfig(announcement.priority);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Duyuru Detayı</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Başlık Kartı */}
        <View style={styles.titleCard}>
          <View style={styles.badgeRow}>
            <View style={[styles.categoryBadge, { backgroundColor: priorityConfig.bg }]}>
              <Ionicons
                name={getCategoryIcon(announcement.category) as any}
                size={16}
                color={priorityConfig.color}
              />
              <Text style={[styles.badgeText, { color: priorityConfig.color }]}>
                {getCategoryLabel(announcement.category)}
              </Text>
            </View>

            <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.bg }]}>
              <Ionicons
                name={priorityConfig.icon as any}
                size={16}
                color={priorityConfig.color}
              />
              <Text style={[styles.badgeText, { color: priorityConfig.color }]}>
                {priorityConfig.text}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{announcement.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={16} color="#6b7280" />
              <Text style={styles.metaText}>{formatDate(announcement.created_at)}</Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="person-circle" size={16} color="#6b7280" />
              <Text style={styles.metaText}>{announcement.created_by}</Text>
            </View>
          </View>
        </View>

        {/* İçerik Kartı */}
        <View style={styles.contentCard}>
          <View style={styles.contentHeader}>
            <Ionicons name="document-text" size={20} color="#10b981" />
            <Text style={styles.contentTitle}>Duyuru İçeriği</Text>
          </View>
          <Text style={styles.contentText}>{announcement.content}</Text>
        </View>

        {/* Bilgi Notu */}
        {announcement.priority === 'urgent' && (
          <View style={styles.urgentNote}>
            <Ionicons name="warning" size={20} color="#dc2626" />
            <Text style={styles.urgentText}>
              Bu acil bir duyurudur. Lütfen gerekli önlemleri alınız.
            </Text>
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
  titleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    lineHeight: 30,
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
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  contentText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  urgentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 12,
  },
  urgentText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '600',
  },
});
