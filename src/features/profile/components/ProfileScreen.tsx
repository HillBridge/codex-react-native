import { StyleSheet, Text, View } from 'react-native';

import { useAuthStore, useSignOut } from '@/features/auth';
import { colors, spacing } from '@/shared/constants/theme';
import { AppButton, Screen } from '@/shared/package';

export function ProfileScreen() {
  const user = useAuthStore((state) => state.session?.user);
  const signOut = useSignOut();

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>账户</Text>
          <Text style={styles.title}>{user?.name || '会员'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        <View style={styles.card}>
          <Row label="会员等级" value={user?.tier || '-'} />
          <Row label="积分" value={user?.points?.toLocaleString('zh-CN') || '-'} />
          <Row label="偏好" value={user?.preference || '-'} />
        </View>
        <AppButton accessibilityLabel="退出登录" variant="secondary" onPress={signOut}>
          退出登录
        </AppButton>
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { alignSelf: 'center', maxWidth: 640, width: '100%' },
  header: { gap: spacing.xs, marginBottom: spacing.lg },
  kicker: { color: colors.primary, fontWeight: '700' },
  title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  email: { color: colors.mutedText },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  row: { gap: spacing.xs },
  label: { color: colors.mutedText, fontSize: 13 },
  value: { color: colors.text, fontSize: 17, fontWeight: '700' },
});
