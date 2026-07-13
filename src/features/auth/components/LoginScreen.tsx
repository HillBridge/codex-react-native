import { StyleSheet, Text, View } from 'react-native';

import { useLoginForm } from '@/features/auth/hooks';
import { colors, spacing } from '@/shared/constants/theme';
import { AppButton, FormTextInput, Screen } from '@/shared/package';

export function LoginScreen() {
  const { canSubmit, errors, form, isSubmitting, submit, updateField } = useLoginForm();

  return (
    <Screen centered>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Expo Starter</Text>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.description}>A feature-sliced React Native foundation.</Text>
        </View>

        <View style={styles.form}>
          <FormTextInput
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
            keyboardType="email-address"
            label="Email"
            onChangeText={(value) => updateField('email', value)}
            placeholder="name@example.com"
            textContentType="emailAddress"
            value={form.email}
          />

          <FormTextInput
            autoCapitalize="none"
            error={errors.password}
            label="Password"
            onChangeText={(value) => updateField('password', value)}
            placeholder="At least 6 characters"
            secureTextEntry
            textContentType="password"
            value={form.password}
          />

          {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

          <AppButton disabled={!canSubmit} loading={isSubmitting} onPress={submit}>
            Sign in
          </AppButton>
        </View>
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
  form: {
    gap: spacing.md,
  },
  formError: {
    color: colors.danger,
    fontSize: 14,
  },
});
