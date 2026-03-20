import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Theme } from '../theme/Theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

interface Props {
  product: any;
  onPress: () => void;
}

export const ProductCard = ({ product, onPress }: Props) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress} 
      style={styles.card}
    >
      <View style={styles.imageBox}>
        <Image 
          source={{ uri: product.image_url || 'https://via.placeholder.com/150' }} 
          style={styles.image} 
          resizeMode="cover"
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>0% EMI</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>₹{product.price.toLocaleString()}</Text>
        <Text style={styles.emi}>From ₹{(product.price / 12).toFixed(0)}/mo</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: 'white',
    borderRadius: Theme.radius,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  imageBox: {
    width: '100%',
    height: 140,
    backgroundColor: '#F9FAFB',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Theme.colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
    color: Theme.colors.foreground,
  },
  emi: {
    fontSize: 12,
    color: Theme.colors.mutedForeground,
    marginTop: 2,
  },
});
