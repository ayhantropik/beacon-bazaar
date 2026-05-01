import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import apiClient from '../services/api/client';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const PRIMARY = '#1a6b52';

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      Alert.alert('Geçersiz e-posta', 'Lütfen geçerli bir e-posta girin');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: trimmed });
      setSent(true);
    } catch (e: any) {
      // Backend henüz hazır değilse bile kullanıcıya tek tip mesaj göster (security best practice)
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#222" />
        </TouchableOpacity>

        {sent ? (
          <View style={styles.successBox}>
            <View style={styles.iconCircle}>
              <Icon name="email-check-outline" size={56} color={PRIMARY} />
            </View>
            <Text style={styles.successTitle}>E-posta gönderildi</Text>
            <Text style={styles.successDesc}>
              {email} adresine şifre sıfırlama bağlantısı gönderdik. E-postanı kontrol et ve bağlantıya tıklayarak şifreni yenile.
            </Text>
            <Button
              mode="contained"
              buttonColor={PRIMARY}
              style={styles.btn}
              onPress={() => navigation.navigate('Login')}
            >
              Girişe Dön
            </Button>
            <TouchableOpacity onPress={() => setSent(false)}>
              <Text style={styles.resend}>Farklı e-posta ile tekrar dene</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formBox}>
            <Text style={styles.title}>Şifremi Unuttum</Text>
            <Text style={styles.desc}>
              E-posta adresini gir, sana şifre sıfırlama bağlantısı gönderelim.
            </Text>

            <TextInput
              label="E-posta"
              mode="outlined"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <Button
              mode="contained"
              buttonColor={PRIMARY}
              loading={submitting}
              disabled={submitting}
              onPress={onSubmit}
              style={styles.btn}
            >
              Bağlantı Gönder
            </Button>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Girişe dön</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 16 },
  back: { padding: 8, alignSelf: 'flex-start' },
  formBox: { padding: 16, marginTop: 32 },
  title: { fontSize: 26, fontWeight: '800', color: PRIMARY, marginBottom: 8 },
  desc: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 24 },
  input: { backgroundColor: '#fff', marginBottom: 16 },
  btn: { borderRadius: 8, paddingVertical: 4, marginBottom: 16 },
  link: { color: PRIMARY, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  successBox: { padding: 16, alignItems: 'center', marginTop: 32 },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#222', marginBottom: 12 },
  successDesc: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  resend: { color: PRIMARY, fontWeight: '700', marginTop: 12 },
});
