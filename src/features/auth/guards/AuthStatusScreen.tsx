import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/shared/constants/theme';
import { Screen } from '@/shared/package';

type AuthStatusScreenProps = {
  description: string;
  title: string;
};

export function AuthStatusScreen({ description, title }: AuthStatusScreenProps) {
  return (
    <Screen centered>
      <View style={styles.panel}>
        <Text style={styles.kicker}>Session</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.sm,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  kicker: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  description: {
    color: colors.mutedText,
    fontSize: 16,
    lineHeight: 24,
  },
});
