import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useAuthStore } from '@/features/auth';
import { getProducts } from '@/features/products/api/productsApi';
import { canLoadProductImage } from '@/features/products/productImage';
import { createProductRequestAbortController } from '@/features/products/productRequestAbortController';
import { createProductRequestGate } from '@/features/products/productRequestGate';
import type { ProductSummary } from '@/features/products/types';
import { colors, spacing } from '@/shared/constants/theme';
import { Screen } from '@/shared/package';
import { APP_ROUTES } from '@/shared/routing/routes';
import { markNavigationDispatched, startNavigationTiming } from '@/shared/routing/navigationTiming';

const categories = ['全部', '家居', '户外', '数码', '穿搭'];
const SEARCH_DEBOUNCE_MS = 300;

type LoadOptions = {
  refreshing?: boolean;
  showFullScreen?: boolean;
};

type ProductListHeaderProps = {
  category: string;
  featured: boolean;
  isSignedIn: boolean;
  onAccountPress: () => void;
  onCategoryChange: (category: string) => void;
  onProductsPress: () => void;
  onQueryChange: (query: string) => void;
  q: string;
};

function ProductListHeader({
  category,
  featured,
  isSignedIn,
  onAccountPress,
  onCategoryChange,
  onProductsPress,
  onQueryChange,
  q,
}: ProductListHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{featured ? '精选商品' : '商品流'}</Text>
        <View style={styles.actions}>
          {featured ? (
            <Pressable
              accessibilityLabel="查看全部商品"
              accessibilityRole="button"
              onPress={onProductsPress}
              style={({ pressed }) => [pressed && styles.actionPressed]}
            >
              <Text style={styles.profile}>全部商品</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityLabel={isSignedIn ? '打开账户资料' : '前往登录'}
            accessibilityRole="button"
            onPress={onAccountPress}
            style={({ pressed }) => [pressed && styles.actionPressed]}
          >
            <Text style={styles.profile}>{isSignedIn ? '账户' : '登录'}</Text>
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
          onChangeText={onQueryChange}
        />
      ) : null}
      <View style={styles.tabs}>
        {categories.map((item) => {
          const value = item === '全部' ? '' : item;
          return (
            <Pressable
              key={item}
              accessibilityLabel={`筛选${item}商品`}
              accessibilityRole="button"
              accessibilityState={{ selected: category === value }}
              onPress={() => onCategoryChange(value)}
              style={({ pressed }) => [pressed && styles.actionPressed]}
            >
              <Text style={category === value ? styles.active : styles.tab}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ProductListEmptyState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <View style={styles.state}>
      <Text style={styles.stateTitle}>{error ? '商品加载失败' : '没有找到商品'}</Text>
      <Text style={styles.stateDescription}>{error || '换个关键词或分类，再看看其他商品。'}</Text>
      {error ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>重新加载</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ProductListFooter({ error, onRetry }: { error: string; onRetry: () => void }) {
  if (!error) {
    return null;
  }

  return (
    <View style={styles.footerError}>
      <Text style={styles.errorText}>{error}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry}>
        <Text style={styles.retryText}>重试</Text>
      </Pressable>
    </View>
  );
}

function ProductCard({ item, onPress }: { item: ProductSummary; onPress: () => void }) {
  const [imageUnavailable, setImageUnavailable] = useState(false);

  return (
    <Pressable
      accessibilityLabel={`查看${item.name}，价格${item.price}元`}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {!canLoadProductImage(item.image) || imageUnavailable ? (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>图片暂时无法加载</Text>
        </View>
      ) : (
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          onError={() => setImageUnavailable(true)}
        />
      )}
      <Text style={styles.kicker}>
        {item.category} / {item.series}
      </Text>
      <Text style={styles.name}>{item.name}</Text>
      <Text>{item.summary}</Text>
      <Text style={styles.price}>¥{item.price}</Text>
    </Pressable>
  );
}

export function ProductListScreen({ featured = false }: { featured?: boolean }) {
  const [items, setItems] = useState<ProductSummary[]>([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestGate = useRef(createProductRequestGate());
  const requestAbortController = useRef(createProductRequestAbortController());
  const hasLoadedOnce = useRef(false);
  const router = useRouter();
  const session = useAuthStore((state) => state.session);

  const openAccount = useCallback(() => {
    const target = session ? APP_ROUTES.profile : APP_ROUTES.login;

    startNavigationTiming(target);
    router.push(target);
    markNavigationDispatched(target);
  }, [router, session]);

  const loadProducts = useCallback(
    async (requestId: number, { refreshing = false, showFullScreen = false }: LoadOptions = {}) => {
      if (refreshing) {
        setIsRefreshing(true);
      }
      if (showFullScreen) {
        setIsInitialLoading(true);
      }
      setError('');

      try {
        const nextItems = await getProducts(
          { category, featured, q: q.trim() },
          { signal: requestAbortController.current.begin() },
        );
        if (!requestGate.current.isCurrent(requestId)) {
          return;
        }
        setItems(nextItems);
        hasLoadedOnce.current = true;
      } catch {
        if (!requestGate.current.isCurrent(requestId)) {
          return;
        }
        setError('商品加载失败，请稍后重试。');
      } finally {
        if (requestGate.current.isCurrent(requestId)) {
          setIsInitialLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [category, featured, q],
  );

  useEffect(() => {
    const requestId = requestGate.current.begin();
    const timeout = setTimeout(() => {
      void loadProducts(requestId, { showFullScreen: !hasLoadedOnce.current });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [loadProducts]);

  useEffect(() => {
    const gate = requestGate.current;
    const abortController = requestAbortController.current;

    return () => {
      gate.invalidate();
      abortController.cancel();
    };
  }, []);

  const reloadNow = useCallback(
    (refreshing = false) => {
      const requestId = requestGate.current.begin();
      void loadProducts(requestId, { refreshing, showFullScreen: !hasLoadedOnce.current });
    },
    [loadProducts],
  );

  if (isInitialLoading) {
    return (
      <Screen centered>
        <View accessibilityLabel="正在加载商品" style={styles.loadingState}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.stateDescription}>正在加载商品…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen dismissKeyboardOnPress={false}>
      <FlatList
        contentContainerStyle={styles.content}
        data={items}
        keyExtractor={(item) => item.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<ProductListEmptyState error={error} onRetry={() => reloadNow()} />}
        ListFooterComponent={
          items.length > 0 ? <ProductListFooter error={error} onRetry={() => reloadNow()} /> : null
        }
        ListHeaderComponent={
          <ProductListHeader
            category={category}
            featured={featured}
            isSignedIn={Boolean(session)}
            onAccountPress={openAccount}
            onCategoryChange={setCategory}
            onProductsPress={() => router.push(APP_ROUTES.products)}
            onQueryChange={setQ}
            q={q}
          />
        }
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            refreshing={isRefreshing}
            tintColor={colors.primary}
            onRefresh={() => reloadNow(true)}
          />
        }
        renderItem={({ item }) => (
          <ProductCard item={item} onPress={() => router.push(`/products/${item.slug}`)} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  header: { gap: spacing.md },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: spacing.md },
  actionPressed: { opacity: 0.68 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
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
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.border,
    borderRadius: 8,
    height: 180,
    justifyContent: 'center',
  },
  imagePlaceholderText: { color: colors.mutedText },
  loadingState: { alignItems: 'center', gap: spacing.md },
  state: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  stateTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  stateDescription: { color: colors.mutedText, textAlign: 'center' },
  footerError: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  errorText: { color: colors.danger },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryButtonText: { color: colors.surface, fontWeight: '800' },
  retryText: { color: colors.primary, fontWeight: '800' },
});
