import { useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useLoginForm } from '@/features/auth/hooks';
import { colors, spacing } from '@/shared/constants/theme';
import { AppButton, FormTextInput, Screen } from '@/shared/package';
import type { AppRoute } from '@/shared/routing';

export function LoginScreen({ returnTo }: { returnTo?: AppRoute }) {
  const { canSubmit, errors, form, isSubmitting, submit, updateField } = useLoginForm(returnTo);
  const passwordInput = useRef<TextInput>(null);

  return (
    <Screen centered scrollable>
      <View style={styles.panel}>
        <Text style={styles.kicker}>RN Mall</Text>
        <Text style={styles.title}>登录商城</Text>
        <Text style={styles.description}>使用 Nuxt 商城演示账号进入移动端。</Text>
        <FormTextInput
          accessibilityHint="输入邮箱后，按键盘下一项进入密码输入框。"
          accessibilityLabel="登录邮箱"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          blurOnSubmit={false}
          error={errors.email}
          keyboardType="email-address"
          label="邮箱"
          onChangeText={(value) => updateField('email', value)}
          onSubmitEditing={() => passwordInput.current?.focus()}
          returnKeyType="next"
          textContentType="emailAddress"
          value={form.email}
        />
        <FormTextInput
          ref={passwordInput}
          accessibilityHint="输入密码后，按键盘完成可直接登录。"
          accessibilityLabel="登录密码"
          autoComplete="password"
          error={errors.password}
          label="密码"
          onChangeText={(value) => updateField('password', value)}
          onSubmitEditing={submit}
          returnKeyType="done"
          secureTextEntry
          textContentType="password"
          value={form.password}
        />
        {errors.form ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {errors.form}
          </Text>
        ) : null}
        <AppButton
          accessibilityHint="使用演示账号登录商城。"
          accessibilityLabel="登录商城"
          disabled={!canSubmit}
          loading={isSubmitting}
          onPress={submit}
        >
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
