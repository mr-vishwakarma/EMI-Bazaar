import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../src/stores/authStore';
import { supabase } from '../src/lib/supabase';

export default function RootLayout() {
  const { login, logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fetch role from profile table - for now we simplify matching web logic
        // In a real app we query the 'users' table
        const { data: userData } = await supabase
          .from('users')
          .select('role, full_name')
          .eq('id', session.user.id)
          .single();

        login({
          id: session.user.id,
          email: session.user.email || '',
          name: userData?.full_name || 'User',
          role: (userData?.role as any) || 'customer',
        });
      } else {
        logout();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(home)" />
      <Stack.Screen name="(vendor)" />
    </Stack>
  );
}
