import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { register } from '../store/slices/authSlice';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((s) => s.auth);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!name || !surname || !email || !password) return;
    dispatch(register({ name, surname, email, password }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="headlineMedium" style={styles.title}>Kayıt Ol</Text>

        {error && <HelperText type="error" visible style={styles.error}>{error}</HelperText>}

        <View style={styles.row}>
          <TextInput label="Ad" value={name} onChangeText={setName} mode="outlined" style={[styles.input, styles.half]} />
          <TextInput label="Soyad" value={surname} onChangeText={setSurname} mode="outlined" style={[styles.input, styles.half]} />
        </View>

        <TextInput
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          mode="outlined"
          style={styles.input}
        />

        <Button mode="contained" onPress={handleRegister} loading={isLoading} disabled={isLoading} style={styles.button} contentStyle={styles.buttonContent}>
          Kayıt Ol
        </Button>

        <Button mode="text" onPress={() => navigation.navigate('Login')} style={styles.linkButton}>
          Zaten hesabınız var mı? Giriş Yap
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { textAlign: 'center', fontWeight: '700', marginBottom: 32 },
  error: { fontSize: 14, textAlign: 'center', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  input: { marginBottom: 16 },
  button: { marginTop: 8, borderRadius: 8 },
  buttonContent: { paddingVertical: 8 },
  linkButton: { marginTop: 16 },
});
