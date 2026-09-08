import { ProtectedRoute } from '@/features/auth';
import { ProductListScreen } from '@/features/products';
export default function ProductsRoute() {
  return (
    <ProtectedRoute>
      <ProductListScreen />
    </ProtectedRoute>
  );
}
