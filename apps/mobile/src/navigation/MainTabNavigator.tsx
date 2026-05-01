import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { MainTabParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MapScreen from '../screens/MapScreen';
import FloatingCart from '../components/FloatingCart';
import { useNavigationState } from '@react-navigation/native';

const Tab = createBottomTabNavigator<MainTabParamList>();

function FloatingCartGate() {
  const route = useNavigationState((s) => {
    const main = s?.routes?.find((r) => r.name === 'Main') || s?.routes?.[s?.index || 0];
    const tabState: any = main?.state;
    if (!tabState) return 'Home';
    return tabState.routes?.[tabState.index]?.name || 'Home';
  });
  if (route === 'Cart') return null;
  return <FloatingCart />;
}

export default function MainTabNavigator() {
  return (
    <View style={styles.flex}>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Harita',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="map-marker" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Ara',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="magnify" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: 'Sepet',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cart" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
    <FloatingCartGate />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
