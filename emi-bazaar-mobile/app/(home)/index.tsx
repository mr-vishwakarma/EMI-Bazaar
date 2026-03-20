import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Dimensions } from 'react-native';
import { Theme } from '../../src/theme/Theme';
import { ProductCard } from '../../src/components/ProductCard';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/authStore';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*').limit(20),
        supabase.from('categories').select('*'),
      ]);

      if (prodRes.error) throw prodRes.error;
      if (catRes.error) throw catRes.error;

      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCategoryPress(categoryId: string | null) {
    setSelectedCategory(categoryId);
    setLoading(true);
    try {
      let query = supabase.from('products').select('*');
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      const { data } = await query.limit(20);
      setProducts(data || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello, {user?.name || 'Shopper'}</Text>
          <Text style={styles.title}>Explore EMI Bazaar</Text>
        </View>
      </View>

      {/* Category Horizontal List */}
      <View style={styles.categoryWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, name: 'All' }, ...categories]}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => handleCategoryPress(item.id)}
              style={[
                styles.categoryTab, 
                selectedCategory === item.id && styles.activeTab
              ]}
            >
              <Text style={[
                styles.categoryText, 
                selectedCategory === item.id && styles.activeTabText
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Product Grid */}
      {loading ? (
        <ActivityIndicator size="large" color={Theme.colors.accent} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <ProductCard 
              product={item} 
              onPress={() => router.push(`/(home)/product/${item.id}`)} 
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No products found in this category.</Text>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: Theme.colors.mutedForeground,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Theme.colors.foreground,
  },
  categoryWrap: {
    marginBottom: 20,
  },
  categoryTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
    backgroundColor: Theme.colors.secondary,
    marginRight: 10,
  },
  activeTab: {
    backgroundColor: Theme.colors.accent,
  },
  categoryText: {
    fontSize: 14,
    color: Theme.colors.mutedForeground,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  gridContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  empty: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    color: Theme.colors.mutedForeground,
    fontSize: 14,
  },
});
