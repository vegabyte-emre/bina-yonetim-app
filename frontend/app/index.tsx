import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function LoginScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRole, setSelectedRole] = useState<'tenant' | 'owner' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Basit validasyon
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Hata', 'Lütfen geçerli bir telefon numarası girin');
      return;
    }

    if (!selectedRole) {
      Alert.alert('Hata', 'Lütfen bir rol seçin');
      return;
    }

    setLoading(true);

    try {
      // API'ye giriş isteği gönder
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Giriş başarılı - ana sayfaya yönlendir
        // Kullanıcı bilgilerini sakla (sonra AsyncStorage kullanacağız)
        router.replace('/home');
      } else {
        Alert.alert('Giriş Başarısız', data.detail || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Giriş hatası:', error);
      Alert.alert('Hata', 'Sunucuya bağlanılamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo ve Başlık */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="business" size={60} color="#2563eb" />
          </View>
          <Text style={styles.title}>Bina Yönetim Sistemi</Text>
          <Text style={styles.subtitle}>Hoş Geldiniz</Text>
        </View>

        {/* Giriş Formu */}
        <View style={styles.formContainer}>
          {/* Telefon Numarası */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefon Numarası</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="5XX XXX XX XX"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={11}
              />
            </View>
          </View>

          {/* Rol Seçimi */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rol Seçin</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  selectedRole === 'tenant' && styles.roleButtonActive,
                ]}
                onPress={() => setSelectedRole('tenant')}
              >
                <Ionicons
                  name="person"
                  size={32}
                  color={selectedRole === 'tenant' ? '#2563eb' : '#6b7280'}
                />
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === 'tenant' && styles.roleTextActive,
                  ]}
                >
                  Kiracı
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  selectedRole === 'owner' && styles.roleButtonActive,
                ]}
                onPress={() => setSelectedRole('owner')}
              >
                <Ionicons
                  name="key"
                  size={32}
                  color={selectedRole === 'owner' ? '#2563eb' : '#6b7280'}
                />
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === 'owner' && styles.roleTextActive,
                  ]}
                >
                  Mülk Sahibi
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Giriş Butonu */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              loading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </Text>
          </TouchableOpacity>

          {/* Bilgi Notu */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              SMS doğrulama özelliği yakında eklenecektir.
            </Text>
          </View>
        </View>

        {/* Test Kullanıcıları (Geliştirme için) */}
        <View style={styles.testUsers}>
          <Text style={styles.testUsersTitle}>Test Kullanıcıları:</Text>
          <Text style={styles.testUserItem}>• Kiracı: 5551234567</Text>
          <Text style={styles.testUserItem}>• Mülk Sahibi: 5559876543</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
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
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  roleButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  roleText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  roleTextActive: {
    color: '#2563eb',
  },
  loginButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#1e40af',
  },
  testUsers: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  testUsersTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 8,
  },
  testUserItem: {
    fontSize: 13,
    color: '#78350f',
    marginVertical: 2,
  },
});
