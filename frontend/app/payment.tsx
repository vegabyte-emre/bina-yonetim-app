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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveCard, setSaveCard] = useState(false);

  const amount = params.amount ? parseFloat(params.amount as string) : 0;
  const dueId = params.dueId as string;

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const validateForm = () => {
    if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
      Alert.alert('Hata', 'Geçerli bir kart numarası girin');
      return false;
    }
    if (!cardName || cardName.length < 3) {
      Alert.alert('Hata', 'Kart üzerindeki ismi girin');
      return false;
    }
    if (!expiryDate || expiryDate.length !== 5) {
      Alert.alert('Hata', 'Geçerli bir son kullanma tarihi girin (AA/YY)');
      return false;
    }
    if (!cvv || cvv.length !== 3) {
      Alert.alert('Hata', 'Geçerli bir CVV girin');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Test ödeme - gerçek entegrasyon sonra eklenecek
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/dues/${dueId}/pay`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            method: 'credit_card',
            card_last4: cardNumber.slice(-4),
            save_card: saveCard,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Ödeme Başarılı! 🎉',
          `₺ ${amount.toFixed(2)} tutarındaki ödemeniz başarıyla alındı.`,
          [
            {
              text: 'Makbuzu Görüntüle',
              onPress: () => {
                router.replace({
                  pathname: '/payment-receipt',
                  params: { dueId: dueId },
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Ödeme Başarısız', data.message || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Ödeme hatası:', error);
      Alert.alert('Hata', 'Ödeme işlemi sırasında bir hata oluştu');
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
        <Text style={styles.headerTitle}>Ödeme</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Tutar Kartı */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Ödenecek Tutar</Text>
          <Text style={styles.amountValue}>₺ {amount.toFixed(2)}</Text>
          <View style={styles.testBadge}>
            <Ionicons name="information-circle" size={16} color="#3b82f6" />
            <Text style={styles.testBadgeText}>Test Ödeme Modu</Text>
          </View>
        </View>

        {/* Kart Bilgileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kart Bilgileri</Text>

          <View style={styles.formCard}>
            {/* Kart Numarası */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kart Numarası</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                  maxLength={19}
                />
              </View>
            </View>

            {/* Kart Üzerindeki İsim */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kart Üzerindeki İsim</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="AHMET YILMAZ"
                  placeholderTextColor="#9ca3af"
                  value={cardName}
                  onChangeText={setCardName}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Son Kullanma Tarihi ve CVV */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.inputLabel}>Son Kullanma</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="calendar"
                    size={20}
                    color="#6b7280"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    value={expiryDate}
                    onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                    maxLength={5}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed"
                    size={20}
                    color="#6b7280"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    value={cvv}
                    onChangeText={setCvv}
                    maxLength={3}
                    secureTextEntry
                  />
                </View>
              </View>
            </View>

            {/* Kartı Kaydet */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setSaveCard(!saveCard)}
            >
              <View style={[styles.checkbox, saveCard && styles.checkboxChecked]}>
                {saveCard && <Ionicons name="checkmark" size={16} color="#ffffff" />}
              </View>
              <Text style={styles.checkboxLabel}>Kartımı kaydet (Gelecek ödemeler için)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Güvenlik Bilgisi */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={24} color="#10b981" />
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Güvenli Ödeme</Text>
            <Text style={styles.securityText}>
              Kart bilgileriniz 256-bit SSL ile şifrelenmektedir.
            </Text>
          </View>
        </View>

        {/* Ödeme Butonu */}
        <TouchableOpacity
          style={[styles.paymentButton, loading && styles.paymentButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#ffffff" />
              <Text style={styles.paymentButtonText}>İşleniyor...</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
              <Text style={styles.paymentButtonText}>₺ {amount.toFixed(2)} Öde</Text>
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
  },
  amountCard: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  testBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  testBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
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
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
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
  rowInputs: {
    flexDirection: 'row',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  securityNote: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 12,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  securityText: {
    fontSize: 13,
    color: '#166534',
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  paymentButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  paymentButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
});
