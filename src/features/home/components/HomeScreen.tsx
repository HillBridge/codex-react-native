import { StyleSheet, Text, View } from 'react-native';

import { useSignOut, useAuthStore } from '@/features/auth';
import { colors, spacing } from '@/shared/constants/theme';
import { AppButton, Screen } from '@/shared/package';

export function HomeScreen() {
  const signOut = useSignOut();
  const user = useAuthStore((state) => state.session?.user);

  return (
    <Screen centered>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Home</Text>
          <Text style={styles.title}>Welcome{user?.name ? `, ${user.name}` : ''}</Text>
          <Text style={styles.description}>You are signed in and viewing a protected route.</Text>
        </View>

        <AppButton variant="secondary" onPress={signOut}>
          Sign out
        </AppButton>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.lg,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  kicker: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  description: {
    color: colors.mutedText,
    fontSize: 16,
    lineHeight: 24,
  },
});
