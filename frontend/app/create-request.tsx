import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function CreateRequestScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'maintenance', label: 'Bakım', icon: 'build', color: '#f59e0b' },
    { id: 'cleaning', label: 'Temizlik', icon: 'brush', color: '#10b981' },
    { id: 'security', label: 'Güvenlik', icon: 'shield-checkmark', color: '#ef4444' },
    { id: 'other', label: 'Diğer', icon: 'ellipsis-horizontal-circle', color: '#8b5cf6' },
  ];

  const priorities = [
    { id: 'low', label: 'Düşük', color: '#10b981' },
    { id: 'normal', label: 'Normal', color: '#3b82f6' },
    { id: 'high', label: 'Yüksek', color: '#f59e0b' },
  ];

  const validateForm = () => {
    if (!selectedCategory) {
      Alert.alert('Hata', 'Lütfen bir kategori seçin');
      return false;
    }
    if (!title || title.length < 3) {
      Alert.alert('Hata', 'Lütfen geçerli bir başlık girin (en az 3 karakter)');
      return false;
    }
    if (!description || description.length < 10) {
      Alert.alert('Hata', 'Lütfen detaylı bir açıklama girin (en az 10 karakter)');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'demo-user-123',
          category: selectedCategory,
          title: title,
          description: description,
          priority: priority,
          images: [],
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Başarılı! ✓', 'Talebiniz başarıyla oluşturuldu', [
          {
            text: 'Tamam',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Hata', data.message || 'Talep oluşturulamadı');
      }
    } catch (error) {
      console.error('Talep oluşturma hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Talep</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Kategori Seçimi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategori Seçin *</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.categoryCardActive,
                  selectedCategory === category.id && {
                    borderColor: category.color,
                  },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: `${category.color}15` },
                  ]}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={28}
                    color={category.color}
                  />
                </View>
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === category.id && {
                      color: category.color,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Başlık */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Başlık *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="text" size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Örn: Asansör Arızası"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>
          <Text style={styles.helperText}>{title.length}/100</Text>
        </View>

        {/* Açıklama */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Açıklama *</Text>
          <View style={styles.textareaWrapper}>
            <TextInput
              style={styles.textarea}
              placeholder="Lütfen sorununuzu detaylı bir şekilde açıklayın..."
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
          <Text style={styles.helperText}>{description.length}/500</Text>
        </View>

        {/* Öncelik */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Öncelik</Text>
          <View style={styles.priorityContainer}>
            {priorities.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.priorityButton,
                  priority === item.id && styles.priorityButtonActive,
                  priority === item.id && { backgroundColor: `${item.color}15` },
                  priority === item.id && { borderColor: item.color },
                ]}
                onPress={() => setPriority(item.id)}
              >
                <Text
                  style={[
                    styles.priorityText,
                    priority === item.id && {
                      color: item.color,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fotoğraf Ekleme (Opsiyonel - Sonra eklenecek) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fotoğraf Ekle (Opsiyonel)</Text>
          <TouchableOpacity style={styles.photoButton} disabled>
            <Ionicons name="camera" size={24} color="#9ca3af" />
            <Text style={styles.photoButtonText}>Yakında eklenecek</Text>
          </TouchableOpacity>
        </View>

        {/* Bilgi Notu */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            Talebiniz oluşturulduktan sonra yönetim ekibi tarafından değerlendirilecek ve
            size geri dönüş yapılacaktır.
          </Text>
        </View>

        {/* Gönder Butonu */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#ffffff" />
              <Text style={styles.submitButtonText}>Gönderiliyor...</Text>
            </>
          ) : (
            <>
              <Ionicons name="send" size={20} color="#ffffff" />
              <Text style={styles.submitButtonText}>Talebi Gönder</Text>
            </>
          )}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  categoryCardActive: {
    borderWidth: 2,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#111827',
  },
  textareaWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  textarea: {
    fontSize: 16,
    color: '#111827',
    minHeight: 120,
  },
  helperText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'right',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  priorityButtonActive: {
    borderWidth: 2,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  infoBox: {
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#c4b5fd',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
