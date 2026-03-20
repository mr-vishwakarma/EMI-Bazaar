import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Theme } from '../../../src/theme/Theme';
import { supabase } from '../../../src/lib/supabase';
import { Button } from '../../../src/components/Button';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(12);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  async function fetchProduct() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          shops(shop_name, location)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Theme.colors.accent} />
      </View>
    );
  }

  const emiAmount = (product.price / selectedPlan).toFixed(0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Back Button Overlay */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <Image 
          source={{ uri: product.image_url || 'https://via.placeholder.com/400' }} 
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.content}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Verified Vendor</Text>
          </View>
          
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.shopName}>Available at {product.shops?.shop_name || 'Generic Shop'}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.price.toLocaleString()}</Text>
            <View style={styles.discountBadge}>
                <Text style={styles.discountText}>0% Interest</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Select EMI Plan</Text>
          <View style={styles.plansRow}>
            {[3, 6, 9, 12].map((months) => (
              <TouchableOpacity
                key={months}
                onPress={() => setSelectedPlan(months)}
                style={[
                  styles.planCard,
                  selectedPlan === months && styles.activePlanCard
                ]}
              >
                <Text style={[styles.planMonths, selectedPlan === months && styles.activePlanText]}>{months}m</Text>
                <Text style={[styles.planEmi, selectedPlan === months && styles.activePlanText]}>₹{(product.price / months).toFixed(0)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Product Description</Text>
          <Text style={styles.description}>
            {product.description || 'This premium product is available with 0% interest EMI options. No hidden charges. Get instant approval and take it home today.'}
          </Text>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Persistent Bottom Summary */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Monthly Payment</Text>
          <Text style={styles.footerValue}>₹{emiAmount} <Text style={{ fontSize: 12, color: Theme.colors.mutedForeground }}>x {selectedPlan} months</Text></Text>
        </View>
        <Button 
            title="Get on EMI" 
            variant="accent" 
            onPress={() => alert("Application System Coming Soon!")}
            style={{ width: 140 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingBottom: 20,
  },
  backBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  image: {
    width: width,
    height: width,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 24,
    backgroundColor: 'white',
    marginTop: -30,
    borderRadius: 30,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Theme.colors.foreground,
  },
  shopName: {
    fontSize: 14,
    color: Theme.colors.mutedForeground,
    marginTop: 4,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 20,
    marginBottom: 30,
    gap: 15,
  },
  price: {
    fontSize: 32,
    fontWeight: '900',
    color: Theme.colors.foreground,
  },
  discountBadge: {
    backgroundColor: Theme.colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
    marginBottom: 15,
  },
  plansRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  planCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 15,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activePlanCard: {
    backgroundColor: '#FFF7ED',
    borderColor: Theme.colors.accent,
  },
  planMonths: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.mutedForeground,
  },
  planEmi: {
    fontSize: 14,
    fontWeight: '900',
    color: Theme.colors.foreground,
    marginTop: 4,
  },
  activePlanText: {
    color: Theme.colors.accent,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: Theme.colors.mutedForeground,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  footerLabel: {
    fontSize: 12,
    color: Theme.colors.mutedForeground,
    fontWeight: '500',
  },
  footerValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Theme.colors.foreground,
  },
});
