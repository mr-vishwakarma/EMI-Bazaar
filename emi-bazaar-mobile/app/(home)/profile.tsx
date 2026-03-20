import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Theme } from '../../src/theme/Theme';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/Button';

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  async function fetchProfile() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 40 }}>👤</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Credit Limit</Text>
            <Text style={styles.statValue}>₹{profile?.credit_limit?.toLocaleString() || '0'}</Text>
          </View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: '#F3F4F6' }]}>
            <Text style={styles.statLabel}>KYC Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: profile?.kyc_status === 'verified' ? '#DEF7EC' : '#FEF3C7' }]}>
                <Text style={[styles.statusText, { color: profile?.kyc_status === 'verified' ? '#03543F' : '#92400E' }]}>
                    {profile?.kyc_status?.toUpperCase() || 'PENDING'}
                </Text>
            </View>
          </View>
        </View>

        <View style={styles.menuBox}>
            <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="settings-outline" size={24} color={Theme.colors.foreground} />
                <Text style={styles.menuText}>Account Settings</Text>
                <Ionicons name="chevron-forward" size={20} color={Theme.colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="shield-checkmark-outline" size={24} color={Theme.colors.foreground} />
                <Text style={styles.menuText}>Security & Privacy</Text>
                <Ionicons name="chevron-forward" size={20} color={Theme.colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="help-circle-outline" size={24} color={Theme.colors.foreground} />
                <Text style={styles.menuText}>Help Center</Text>
                <Ionicons name="chevron-forward" size={20} color={Theme.colors.mutedForeground} />
            </TouchableOpacity>
        </View>

        <Button 
            variant="outline"
            title="Log Out" 
            onPress={logout}
            style={{ marginTop: 40 }}
        />
        
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scroll: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    color: Theme.colors.foreground,
  },
  email: {
    fontSize: 14,
    color: Theme.colors.mutedForeground,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingVertical: 20,
    marginBottom: 40,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Theme.colors.mutedForeground,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  menuBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.foreground,
    marginLeft: 15,
  },
});
