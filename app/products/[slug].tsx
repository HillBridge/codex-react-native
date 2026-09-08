import { useLocalSearchParams } from 'expo-router';
import { ProtectedRoute } from '@/features/auth';
import { ProductDetailScreen } from '@/features/products';
export default function ProductRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return (
    <ProtectedRoute>
      <ProductDetailScreen slug={slug || ''} />
    </ProtectedRoute>
  );
}
