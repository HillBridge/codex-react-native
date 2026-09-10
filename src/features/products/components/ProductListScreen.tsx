import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getProducts } from '@/features/products/api/productsApi';
import type { ProductSummary } from '@/features/products/types';
import { colors, spacing } from '@/shared/constants/theme';
import { Screen } from '@/shared/package';
const categories = ['全部', '家居', '户外', '数码', '穿搭'];
export function ProductListScreen({ featured = false }: { featured?: boolean }) {
  const [items, setItems] = useState<ProductSummary[]>([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  useEffect(() => {
    const id = setTimeout(() => {
      getProducts({ featured, q, category })
        .then(setItems)
        .catch(() => setError('商品加载失败，请稍后重试。'));
    }, 250);
    return () => clearTimeout(id);
  }, [category, featured, q]);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title}>{featured ? '精选商品' : '商品流'}</Text>
          <View style={styles.actions}>
            {featured ? (
              <Pressable
                accessibilityLabel="查看全部商品"
                accessibilityRole="button"
                onPress={() => router.push('/products')}
                style={({ pressed }) => [pressed && styles.actionPressed]}
              >
                <Text style={styles.profile}>全部商品</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityLabel="打开账户资料"
              accessibilityRole="button"
              onPress={() => router.push('/profile')}
              style={({ pressed }) => [pressed && styles.actionPressed]}
            >
              <Text style={styles.profile}>账户</Text>
            </Pressable>
          </View>
        </View>
        {!featured ? (
          <TextInput
            accessibilityLabel="搜索商品"
            autoCorrect={false}
            placeholder="搜索商品"
            placeholderTextColor={colors.mutedText}
            style={styles.input}
            value={q}
            onChangeText={setQ}
          />
        ) : null}
        <View style={styles.tabs}>
          {categories.map((item) => (
            <Pressable
              key={item}
              accessibilityLabel={`筛选${item}商品`}
              accessibilityRole="button"
              accessibilityState={{ selected: category === (item === '全部' ? '' : item) }}
              onPress={() => setCategory(item === '全部' ? '' : item)}
              style={({ pressed }) => [pressed && styles.actionPressed]}
            >
              <Text style={category === (item === '全部' ? '' : item) ? styles.active : styles.tab}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
        {error ? (
          <Text>{error}</Text>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              accessibilityLabel={`查看${item.name}，价格${item.price}元`}
              accessibilityRole="button"
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(`/products/${item.slug}`)}
            >
              <Image source={{ uri: item.image }} style={styles.image} />
              <Text style={styles.kicker}>
                {item.category} / {item.series}
              </Text>
              <Text style={styles.name}>{item.name}</Text>
              <Text>{item.summary}</Text>
              <Text style={styles.price}>¥{item.price}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: spacing.md },
  actionPressed: { opacity: 0.68 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
  },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tab: { color: colors.mutedText, padding: spacing.sm },
  active: { color: colors.primary, fontWeight: '800', padding: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  cardPressed: { backgroundColor: colors.background, opacity: 0.86 },
  kicker: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  name: { color: colors.text, fontSize: 18, fontWeight: '800' },
  price: { color: colors.text, fontSize: 17, fontWeight: '800' },
  profile: { color: colors.primary, fontWeight: '700' },
  image: { backgroundColor: colors.border, borderRadius: 8, height: 180, width: '100%' },
});
