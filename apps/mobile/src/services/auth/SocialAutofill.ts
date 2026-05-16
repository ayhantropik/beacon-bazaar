import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { env } from '../../config/env';

WebBrowser.maybeCompleteAuthSession();

// Expo Go (executionEnvironment === 'storeClient') ise Web Client + proxy.
// Standalone EAS build'de iOS native scheme.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

export interface AutofillData {
  fullName?: string;
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  district?: string;
  zipCode?: string;
}

/**
 * Apple Sign In ile profil bilgisi (sadece adın ilk girişte gelir).
 * Adres bilgisi vermez — Apple bunu paylaşmaz.
 */
export async function autofillFromApple(): Promise<AutofillData | null> {
  if (Platform.OS !== 'ios') {
    Alert.alert('Apple Sign In', 'Bu özellik yalnızca iOS cihazlarda çalışır');
    return null;
  }
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    Alert.alert('Apple Sign In', 'Bu cihazda Apple Sign In kullanılamıyor');
    return null;
  }
  try {
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    const name = [cred.fullName?.givenName, cred.fullName?.familyName]
      .filter(Boolean)
      .join(' ')
      .trim();
    return {
      fullName: name || undefined,
      email: cred.email || undefined,
    };
  } catch (e: any) {
    if (e.code === 'ERR_REQUEST_CANCELED') return null;
    Alert.alert('Apple Sign In', e.message || 'Bilinmeyen hata');
    return null;
  }
}

/**
 * Google ile giriş yap, People API'den isim/email/telefon/adres çek.
 * Production için Google Cloud Console'da OAuth Client ID gerekir.
 */
export async function autofillFromGoogle(): Promise<AutofillData | null> {
  const clientId = isExpoGo ? env.googleAuthClientIdWeb : env.googleAuthClientIdIos;
  if (!clientId) {
    Alert.alert(
      'Google',
      'Google ile bağlantı için yapılandırma gerekiyor. Geliştirici tarafından eklendiğinde aktif olacak.',
    );
    return null;
  }
  try {
    const redirectUri = isExpoGo
      ? AuthSession.makeRedirectUri({ useProxy: true } as any)
      : AuthSession.makeRedirectUri({ scheme: 'venividicoop', path: 'auth-callback' });
    const discovery = await AuthSession.fetchDiscoveryAsync(
      'https://accounts.google.com',
    );
    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: [
        'openid',
        'profile',
        'email',
        'https://www.googleapis.com/auth/user.addresses.read',
        'https://www.googleapis.com/auth/user.phonenumbers.read',
      ],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
    });
    const result = await request.promptAsync(discovery, isExpoGo ? { useProxy: true } as any : undefined);
    if (result.type !== 'success' || !result.authentication?.accessToken) {
      return null;
    }
    const token = result.authentication.accessToken;

    const peopleRes = await fetch(
      'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,phoneNumbers,addresses',
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await peopleRes.json();
    const name = data?.names?.[0]?.displayName;
    const email = data?.emailAddresses?.[0]?.value;
    const phone = data?.phoneNumbers?.[0]?.value;
    const addr = data?.addresses?.[0];
    return {
      fullName: name,
      email,
      phone,
      street: addr?.streetAddress,
      city: addr?.city,
      district: addr?.region,
      zipCode: addr?.postalCode,
    };
  } catch (e: any) {
    Alert.alert('Google', e.message || 'Google bağlantısı başarısız');
    return null;
  }
}

/**
 * Facebook ile giriş yap, Graph API'den isim/email/şehir çek.
 * Adres alanı çoğu hesapta yok.
 */
export async function autofillFromFacebook(): Promise<AutofillData | null> {
  const appId = env.facebookAppId;
  if (!appId) {
    Alert.alert(
      'Facebook',
      'Facebook ile bağlantı için yapılandırma gerekiyor. Geliştirici tarafından eklendiğinde aktif olacak.',
    );
    return null;
  }
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'venividicoop',
      path: 'auth-callback',
    });
    const discovery = {
      authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
    };
    const request = new AuthSession.AuthRequest({
      clientId: appId,
      scopes: ['public_profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
    });
    const result = await request.promptAsync(discovery);
    if (result.type !== 'success' || !result.authentication?.accessToken) {
      return null;
    }
    const token = result.authentication.accessToken;
    const fbRes = await fetch(
      `https://graph.facebook.com/me?fields=name,email,location{location{city,country,zip,street}}&access_token=${token}`,
    );
    const data = await fbRes.json();
    const loc = data?.location?.location;
    return {
      fullName: data?.name,
      email: data?.email,
      city: loc?.city,
      street: loc?.street,
      zipCode: loc?.zip,
    };
  } catch (e: any) {
    Alert.alert('Facebook', e.message || 'Facebook bağlantısı başarısız');
    return null;
  }
}
