import { StyleSheet, Text, View } from 'react-native';

import { useLoginForm } from '@/features/auth/hooks';
import { colors, spacing } from '@/shared/constants/theme';
import { AppButton, FormTextInput, Screen } from '@/shared/package';

export function LoginScreen() {
  const { canSubmit, errors, form, isSubmitting, notice, phase, resetMfa, submit, updateField } =
    useLoginForm();

  return (
    <Screen centered>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Banking Dashboard</Text>
          <Text style={styles.title}>Log into your account</Text>
          <Text style={styles.description}>
            Use the same merchant login flow as the web dashboard.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.phoneRow}>
            <FormTextInput
              autoCapitalize="none"
              error={errors.areaCode}
              keyboardType="phone-pad"
              label="Area Code"
              onChangeText={(value) => updateField('areaCode', value)}
              placeholder="55"
              style={styles.areaCodeInput}
              value={form.areaCode}
            />

            <View style={styles.mobileField}>
              <FormTextInput
                autoCapitalize="none"
                autoComplete="tel"
                error={errors.mobile}
                keyboardType="phone-pad"
                label="Mobile Number"
                onChangeText={(value) => updateField('mobile', value)}
                placeholder="Phone Number"
                textContentType="telephoneNumber"
                value={form.mobile}
              />
            </View>
          </View>

          <FormTextInput
            autoCapitalize="none"
            autoComplete="password"
            error={errors.password}
            label="Password"
            onChangeText={(value) => updateField('password', value)}
            placeholder="Password"
            secureTextEntry
            textContentType="password"
            value={form.password}
          />

          {phase === 'mfa' ? (
            <View style={styles.mfaBlock}>
              <FormTextInput
                autoCapitalize="none"
                error={errors.googleCode}
                keyboardType="number-pad"
                label="Google Auth Code"
                onChangeText={(value) => updateField('googleCode', value)}
                placeholder="6-digit code"
                value={form.googleCode}
              />

              <AppButton variant="secondary" onPress={resetMfa}>
                Back
              </AppButton>
            </View>
          ) : null}

          {notice ? (
            <Text style={[styles.notice, notice.type === 'warning' && styles.warningNotice]}>
              {notice.message}
            </Text>
          ) : null}

          {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

          <AppButton disabled={!canSubmit} loading={isSubmitting} onPress={submit}>
            {phase === 'mfa' ? 'Verify and sign in' : 'Login'}
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
  phoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  areaCodeInput: {
    minWidth: 88,
  },
  mobileField: {
    flex: 1,
  },
  mfaBlock: {
    gap: spacing.md,
  },
  notice: {
    color: colors.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  warningNotice: {
    color: colors.warning,
  },
  formError: {
    color: colors.danger,
    fontSize: 14,
  },
});
