import { Tabs } from 'expo-router';
import { Theme } from '../../src/theme/Theme';
import { Ionicons } from '@expo/vector-icons';

export default function HomeLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: Theme.colors.accent,
      tabBarInactiveTintColor: Theme.colors.mutedForeground,
      headerShown: false,
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
        height: 60,
        paddingBottom: 8,
      }
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'My EMIs',
          tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
