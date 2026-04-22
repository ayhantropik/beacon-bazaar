import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, HelperText } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import apiClient from '../services/api/client';

const PRIMARY = '#1a6b52';

type Props = NativeStackScreenProps<AuthStackParamList, 'EmailVerification'>;

export default function EmailVerificationScreen({ route, navigation }: Props) {
  const { email } = route.params;
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setResendSuccess(false);
    try {
      await apiClient.post('/auth/resend-verification', { email });
      setResendSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gönderim başarısız oldu');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Icon name="email-check" size={80} color={PRIMARY} />

      <Text variant="headlineSmall" style={styles.title}>
        E-posta Onayı Gerekli
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        <Text style={styles.emailText}>{email}</Text> adresine bir onay bağlantısı gönderdik.
      </Text>

      <Text variant="bodySmall" style={styles.info}>
        Lütfen e-postanızı kontrol edin ve bağlantıya tıklayarak hesabınızı onaylayın.
      </Text>

      {error && (
        <HelperText type="error" visible style={styles.error}>
          {error}
        </HelperText>
      )}

      {resendSuccess && (
        <HelperText type="info" visible style={styles.success}>
          Onay e-postası tekrar gönderildi!
        </HelperText>
      )}

      <Button
        mode="contained"
        onPress={handleResend}
        loading={isResending}
        disabled={isResending}
        style={styles.resendButton}
        contentStyle={styles.buttonContent}
        buttonColor={PRIMARY}
      >
        Tekrar Gönder
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('Register')}
        style={styles.linkButton}
        textColor={PRIMARY}
      >
        Farklı e-posta ile kayıt ol
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  title: {
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#555',
    lineHeight: 22,
    marginBottom: 8,
  },
  emailText: {
    fontWeight: '600',
    color: '#333',
  },
  info: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 24,
    lineHeight: 18,
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
  },
  success: {
    fontSize: 14,
    textAlign: 'center',
    color: '#27ae60',
  },
  resendButton: {
    width: '100%',
    borderRadius: 8,
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 16,
  },
});
