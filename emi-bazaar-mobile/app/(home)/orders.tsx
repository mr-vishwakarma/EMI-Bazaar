import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Theme } from '../../src/theme/Theme';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/Button';

export default function MyEmis() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  async function fetchContracts() {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('emi_contracts')
        .select(`
          *,
          products(name, image_url),
          shops(shop_name)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContracts();
  }, [user]);

  async function handlePayNow(contractId: string) {
    // In a real app we trigger the payment gateway here.
    // For now we simulate the process_emi_payment RPC call
    setLoading(true);
    const { data, error } = await supabase.rpc('process_emi_payment', {
        p_contract_id: contractId,
        p_amount: 1000, // Placeholder, usually emi_amount
        p_payment_method: 'Mobile UPI'
    });

    if (error) {
        alert("Payment Error: " + error.message);
    } else {
        alert("Payment Successful! 🎉");
        fetchContracts();
    }
    setLoading(false);
  }

  const renderContract = ({ item }: { item: any }) => {
    const progress = (item.paid_installments / item.total_installments) * 100;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.shopName}>{item.shops?.shop_name || 'Generic Shop'}</Text>
            <Text style={styles.productName}>{item.products?.name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#DEF7EC' : '#FDE8E8' }]}>
            <Text style={[styles.statusText, { color: item.status === 'active' ? '#03543F' : '#9B1C1C' }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Installments:</Text>
            <Text style={styles.progressValue}>{item.paid_installments} / {item.total_installments}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Monthly EMI</Text>
            <Text style={styles.statValue}>₹{item.emi_amount.toLocaleString()}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={styles.statValue}>₹{(item.total_amount - (item.paid_installments * item.emi_amount)).toLocaleString()}</Text>
          </View>
        </View>

        {item.status === 'active' && item.paid_installments < item.total_installments && (
           <Button 
                title="Pay Next EMI" 
                variant="accent" 
                onPress={() => handlePayNow(item.id)}
                style={{ marginTop: 15 }}
           />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My EMI Ledger</Text>
        <Text style={styles.subtitle}>Keep track of all your active plans</Text>
      </View>

      {loading && contracts.length === 0 ? (
        <ActivityIndicator size="large" color={Theme.colors.accent} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={contracts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={renderContract}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchContracts} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={64} color={Theme.colors.mutedForeground} />
              <Text style={styles.emptyText}>No active EMI contracts found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Theme.colors.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.mutedForeground,
    marginTop: 4,
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  shopName: {
    fontSize: 12,
    color: Theme.colors.mutedForeground,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
    marginTop: 4,
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
  progressSection: {
    marginBottom: 20,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Theme.colors.accent,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: Theme.colors.mutedForeground,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
  },
  statsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 15,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: Theme.colors.mutedForeground,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Theme.colors.foreground,
  },
  empty: {
    padding: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: Theme.colors.mutedForeground,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});
