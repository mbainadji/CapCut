import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import DashboardProjectsScreen from '../services/screen/DashboardProjectsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProjectScreen from '../screens/project/EditProjectScreen';

export type HomeStackParamList = {
  Dashboard: undefined;
  EditProject: { projectId: string };
  Profile: undefined;
};

export type TabParamList = {
  DashboardTab: undefined;
  ProfileTab: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopColor: '#1A1A1A',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#7C3AFF',
        tabBarInactiveTintColor: '#444',
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardProjectsScreen}
        options={{
          tabBarLabel: 'Projets',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🎬</Text>,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function HomeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={TabNavigator} />
      <Stack.Screen name="EditProject" component={EditProjectScreen} />
    </Stack.Navigator>
  );
}
