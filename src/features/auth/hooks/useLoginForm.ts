import { useMemo, useState } from 'react';

import { login } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/store';
import { authTokenStorage } from '@/features/auth/utils/authTokenStorage';
import { APP_ROUTES, useAppNavigation } from '@/shared/routing';
import type { AppRoute } from '@/shared/routing';

import { type LoginForm, type LoginFormErrors, validateLoginForm } from './loginFormValidation';

type Errors = LoginFormErrors & { form?: string };
const initialForm: LoginForm = { email: 'demo@example.com', password: 'nuxt-demo' };

export function useLoginForm(returnTo: AppRoute = APP_ROUTES.home) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useAppNavigation();
  const setSession = useAuthStore((state) => state.setSession);
  const canSubmit = useMemo(
    () => Boolean(form.email && form.password && !isSubmitting),
    [form, isSubmitting],
  );

  function updateField(name: keyof LoginForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, form: undefined }));
  }

  async function submit() {
    const nextErrors = validateLoginForm(form);
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);
    setIsSubmitting(true);
    try {
      const credentials = await login({ email: form.email.trim(), password: form.password });
      await authTokenStorage.setRefreshToken(credentials.refreshToken);
      setSession(credentials.session);
      navigation.replace(returnTo);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : '登录失败，请稍后重试。' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return { canSubmit, errors, form, isSubmitting, submit, updateField };
}
