import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { getProduct } from '@/features/products/api/productsApi';
import type { ProductDetail } from '@/features/products/types';
import { triggerHapticFeedback } from '@/shared/device/feedback/expoHapticFeedback';
import { Screen } from '@/shared/package';
export function ProductDetailScreen({ slug }: { slug: string }) {
  const [item, setItem] = useState<ProductDetail | null>(null);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  useEffect(() => {
    getProduct(slug)
      .then(setItem)
      .catch(() => setError('商品不存在或加载失败。'));
  }, [slug]);
  return (
    <Screen>
      <ScrollView>
        {error ? (
          <Text>{error}</Text>
        ) : item ? (
          <>
            <Text>
              {item.category} / {item.series}
            </Text>
            <Text style={{ fontSize: 30, fontWeight: '800' }}>{item.name}</Text>
            <Text>{item.description}</Text>
            <Text>
              ¥{item.price} · 库存 {item.stock}
            </Text>
            <Pressable
              accessibilityLabel={isFavorite ? '取消收藏商品' : '收藏商品'}
              accessibilityRole="button"
              onPress={() => {
                const nextIsFavorite = !isFavorite;
                setIsFavorite(nextIsFavorite);
                if (nextIsFavorite) {
                  void triggerHapticFeedback('success');
                }
              }}
            >
              <Text>{isFavorite ? '已收藏' : '收藏商品'}</Text>
            </Pressable>
            {item.highlights.map((x) => (
              <Text key={x}>• {x}</Text>
            ))}
          </>
        ) : (
          <Text>加载中…</Text>
        )}
      </ScrollView>
    </Screen>
  );
}
