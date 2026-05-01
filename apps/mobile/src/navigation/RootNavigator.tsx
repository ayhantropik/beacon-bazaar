import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../store/hooks';
import type { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import StoreDetailScreen from '../screens/StoreDetailScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import AuctionsScreen from '../screens/AuctionsScreen';
import AuctionDetailScreen from '../screens/AuctionDetailScreen';
import MyBidsScreen from '../screens/MyBidsScreen';
import OtoListingScreen from '../screens/OtoListingScreen';
import EmlakListingScreen from '../screens/EmlakListingScreen';
import YemekListingScreen from '../screens/YemekListingScreen';
import AddressesScreen from '../screens/AddressesScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import ChatScreen from '../screens/ChatScreen';
import AppointmentBookingScreen from '../screens/AppointmentBookingScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import GiftPickerScreen from '../screens/GiftPickerScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SellerDashboardScreen from '../screens/SellerDashboardScreen';
import SellerProductsScreen from '../screens/SellerProductsScreen';
import SellerOrdersScreen from '../screens/SellerOrdersScreen';
import CreateStoreScreen from '../screens/CreateStoreScreen';
import CreateProductScreen from '../screens/CreateProductScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ headerShown: true, headerTitle: 'Ürün Detayı', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="StoreDetail"
            component={StoreDetailScreen}
            options={{ headerShown: true, headerTitle: 'Mağaza', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ headerShown: true, headerTitle: 'Siparişi Tamamla', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="Orders"
            component={OrdersScreen}
            options={{ headerShown: true, headerTitle: 'Siparişlerim', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{ headerShown: true, headerTitle: 'Sipariş Detayı', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={{ headerShown: true, headerTitle: 'Favorilerim', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="Auctions"
            component={AuctionsScreen}
            options={{ headerShown: true, headerTitle: 'Açık Artırma', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="AuctionDetail"
            component={AuctionDetailScreen}
            options={{ headerShown: true, headerTitle: 'Açık Artırma Detayı', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="MyBids"
            component={MyBidsScreen}
            options={{ headerShown: true, headerTitle: 'Tekliflerim', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="OtoListing"
            component={OtoListingScreen}
            options={{ headerShown: true, headerTitle: 'Oto', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="EmlakListing"
            component={EmlakListingScreen}
            options={{ headerShown: true, headerTitle: 'Emlak', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="YemekListing"
            component={YemekListingScreen}
            options={{ headerShown: true, headerTitle: 'Yemek', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="Addresses"
            component={AddressesScreen}
            options={{ headerShown: true, headerTitle: 'Adreslerim', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="Conversations"
            component={ConversationsScreen}
            options={{ headerShown: true, headerTitle: 'Mesajlarım', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ headerShown: true, headerTitle: 'Sohbet', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="AppointmentBooking"
            component={AppointmentBookingScreen}
            options={{ headerShown: true, headerTitle: 'Randevu Al', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="Appointments"
            component={AppointmentsScreen}
            options={{ headerShown: true, headerTitle: 'Randevularım', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="GiftPicker"
            component={GiftPickerScreen}
            options={{ headerShown: true, headerTitle: 'Hediye Asistanı', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ headerShown: true, headerTitle: 'Bildirimler', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: true, headerTitle: 'Ayarlar', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="SellerDashboard"
            component={SellerDashboardScreen}
            options={{ headerShown: true, headerTitle: 'Mağazam', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="SellerProducts"
            component={SellerProductsScreen}
            options={{ headerShown: true, headerTitle: 'Ürünlerim', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="SellerOrders"
            component={SellerOrdersScreen}
            options={{ headerShown: true, headerTitle: 'Mağaza Siparişleri', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="CreateStore"
            component={CreateStoreScreen}
            options={{ headerShown: true, headerTitle: 'Mağaza Oluştur', headerBackTitle: 'Geri' }}
          />
          <Stack.Screen
            name="CreateProduct"
            component={CreateProductScreen}
            options={{ headerShown: true, headerTitle: 'Yeni Ürün', headerBackTitle: 'Geri' }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
