import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Theme } from '../../src/theme/Theme';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/authStore';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role, full_name: role === 'customer' ? 'Customer' : 'Vendor' },
          },
        });

        if (error) throw error;
        Alert.alert('Success', 'Check your email for the confirmation link!');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          // If login is successful, useRootLayout listener handles some logic but we can also push here.
          // In a real app we fetch profile here as well.
          router.replace(role === 'customer' ? '/(home)' : '/(vendor)');
        }
      }
    } catch (err: any) {
      Alert.alert('Authentication Failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: role === 'customer' ? Theme.colors.accent : '#3B82F6' }]}>
              <Text style={styles.iconText}>{role === 'customer' ? '🏠' : '🏬'}</Text>
            </View>
            <Text style={styles.title}>{mode === 'login' ? 'Welcome Back!' : 'Join EMI Bazaar'}</Text>
            <Text style={styles.subtitle}>
              {mode === 'login' ? 'Sign in to continue your EMI journey' : 'Start your hassle-free EMI shopping today'}
            </Text>
          </View>

          <View style={styles.roleContainer}>
            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setRole('customer')}
                style={[styles.roleTab, role === 'customer' && styles.activeTab]}
            >
                <Text style={[styles.roleText, role === 'customer' && styles.activeTabText]}>Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setRole('vendor')}
                style={[styles.roleTab, role === 'vendor' && styles.activeTab]}
            >
                <Text style={[styles.roleText, role === 'vendor' && styles.activeTabText]}>Vendor</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Input 
              label="Email Address" 
              placeholder="name@example.com" 
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input 
              label="Password" 
              placeholder="••••••••" 
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Button 
                variant="accent"
                title={mode === 'login' ? 'Sign In' : 'Create Account'} 
                onPress={handleAuth} 
                loading={loading}
                style={{ marginTop: 20 }}
            />

            <TouchableOpacity 
              onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
              style={styles.toggle}
            >
              <Text style={styles.toggleText}>
                {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scroll: {
    padding: 30,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: Theme.colors.foreground,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.mutedForeground,
    textAlign: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.secondary,
    padding: 4,
    borderRadius: Theme.radius,
    marginBottom: 30,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Theme.radius - 4,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  roleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.mutedForeground,
  },
  activeTabText: {
    color: Theme.colors.accent,
  },
  form: {
    width: '100%',
  },
  toggle: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: Theme.colors.accent,
    fontWeight: 'bold',
  },
});
