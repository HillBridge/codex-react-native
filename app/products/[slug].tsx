import { useLocalSearchParams } from 'expo-router';
import { ProductDetailScreen } from '@/features/products';
export default function ProductRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <ProductDetailScreen slug={slug || ''} />;
}
