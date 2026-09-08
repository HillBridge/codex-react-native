import { useMemo, useState } from 'react';

import { login } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/store';
import { authTokenStorage } from '@/features/auth/utils/authTokenStorage';
import { APP_ROUTES, useAppNavigation } from '@/shared/routing';

type Form = { email: string; password: string };
type Errors = Partial<Record<keyof Form | 'form', string>>;
const initialForm: Form = { email: 'demo@example.com', password: 'nuxt-demo' };

export function useLoginForm() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useAppNavigation();
  const setSession = useAuthStore((state) => state.setSession);
  const canSubmit = useMemo(
    () => Boolean(form.email && form.password && !isSubmitting),
    [form, isSubmitting],
  );

  function updateField(name: keyof Form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, form: undefined }));
  }

  async function submit() {
    const nextErrors: Errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = '请输入有效邮箱。';
    if (!form.password) nextErrors.password = '请输入密码。';
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);
    setIsSubmitting(true);
    try {
      const credentials = await login({ email: form.email.trim(), password: form.password });
      await authTokenStorage.setRefreshToken(credentials.refreshToken);
      setSession(credentials.session);
      navigation.replace(APP_ROUTES.home);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : '登录失败，请稍后重试。' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return { canSubmit, errors, form, isSubmitting, submit, updateField };
}
