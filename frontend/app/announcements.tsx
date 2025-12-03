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

interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  created_at: string;
  created_by: string;
}

export default function AnnouncementsScreen() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const categories = [
    { id: 'all', label: 'Tümü', icon: 'apps' },
    { id: 'maintenance', label: 'Bakım', icon: 'construct' },
    { id: 'meeting', label: 'Toplantı', icon: 'people' },
    { id: 'general', label: 'Genel', icon: 'information-circle' },
  ];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [selectedCategory, announcements]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const buildingsResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/buildings`);
      const buildings = await buildingsResponse.json();

      if (buildings && buildings.length > 0) {
        const buildingId = buildings[0]._id;
        const response = await fetch(
          `${EXPO_PUBLIC_BACKEND_URL}/api/buildings/${buildingId}/announcements`
        );
        const data = await response.json();
        setAnnouncements(data || []);
      }
    } catch (error) {
      console.error('Duyuru yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAnnouncements = () => {
    if (selectedCategory === 'all') {
      setFilteredAnnouncements(announcements);
    } else {
      setFilteredAnnouncements(
        announcements.filter((a) => a.category === selectedCategory)
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnnouncements();
    setRefreshing(false);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Duyurular</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
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
        <Text style={styles.headerTitle}>Duyurular</Text>
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
        {/* Kategori Filtreleri */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={category.icon as any}
                size={18}
                color={selectedCategory === category.id ? '#10b981' : '#6b7280'}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Duyuru Listesi */}
        {filteredAnnouncements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>Duyuru bulunmuyor</Text>
          </View>
        ) : (
          filteredAnnouncements.map((announcement) => {
            const priorityConfig = getPriorityConfig(announcement.priority);
            return (
              <TouchableOpacity
                key={announcement._id}
                style={styles.announcementCard}
                onPress={() =>
                  router.push({
                    pathname: '/announcement-detail',
                    params: { id: announcement._id },
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.announcementHeader}>
                  <View
                    style={[styles.categoryIcon, { backgroundColor: priorityConfig.bg }]}
                  >
                    <Ionicons
                      name={getCategoryIcon(announcement.category) as any}
                      size={20}
                      color={priorityConfig.color}
                    />
                  </View>

                  <View style={styles.announcementMeta}>
                    <Text style={styles.announcementDate}>
                      {formatDate(announcement.created_at)}
                    </Text>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: priorityConfig.bg },
                      ]}
                    >
                      <Ionicons
                        name={priorityConfig.icon as any}
                        size={12}
                        color={priorityConfig.color}
                      />
                      <Text
                        style={[styles.priorityText, { color: priorityConfig.color }]}
                      >
                        {priorityConfig.text}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.announcementTitle}>{announcement.title}</Text>
                <Text style={styles.announcementContent} numberOfLines={2}>
                  {announcement.content}
                </Text>

                <View style={styles.announcementFooter}>
                  <View style={styles.authorContainer}>
                    <Ionicons name="person-circle" size={16} color="#6b7280" />
                    <Text style={styles.authorText}>{announcement.created_by}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            );
          })
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  categoriesContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: '#d1fae5',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryTextActive: {
    color: '#10b981',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6b7280',
  },
  announcementCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  announcementHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  announcementMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  announcementDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  announcementContent: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorText: {
    fontSize: 13,
    color: '#6b7280',
  },
});
