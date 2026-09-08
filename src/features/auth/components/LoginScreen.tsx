import { StyleSheet, Text, View } from 'react-native';

import { useLoginForm } from '@/features/auth/hooks';
import { colors, spacing } from '@/shared/constants/theme';
import { AppButton, FormTextInput, Screen } from '@/shared/package';

export function LoginScreen() {
  const { canSubmit, errors, form, isSubmitting, submit, updateField } = useLoginForm();
  return (
    <Screen centered>
      <View style={styles.panel}>
        <Text style={styles.kicker}>RN Mall</Text>
        <Text style={styles.title}>登录商城</Text>
        <Text style={styles.description}>使用 Nuxt 商城演示账号进入移动端。</Text>
        <FormTextInput
          autoCapitalize="none"
          autoComplete="email"
          error={errors.email}
          keyboardType="email-address"
          label="邮箱"
          onChangeText={(value) => updateField('email', value)}
          value={form.email}
        />
        <FormTextInput
          autoComplete="password"
          error={errors.password}
          label="密码"
          onChangeText={(value) => updateField('password', value)}
          secureTextEntry
          value={form.password}
        />
        {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}
        <AppButton disabled={!canSubmit} loading={isSubmitting} onPress={submit}>
          登录
        </AppButton>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 420,
    padding: spacing.lg,
    width: '100%',
  },
  kicker: { color: colors.primary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  description: { color: colors.mutedText, fontSize: 15, lineHeight: 22 },
  error: { color: colors.danger, fontSize: 14 },
});
