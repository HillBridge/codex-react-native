import { useMemo, useState } from 'react';

import { login } from '@/features/auth/api/authApi';
import { authTokenStorage } from '@/features/auth/model/authTokenStorage';
import { useAuthStore } from '@/store';

type LoginForm = {
  email: string;
  password: string;
};

type LoginFormErrors = Partial<Record<keyof LoginForm | 'form', string>>;

const initialForm: LoginForm = {
  email: '',
  password: '',
};

function validateForm(form: LoginForm): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!form.password) {
    errors.password = 'Password is required.';
  } else if (form.password.length < 6) {
    errors.password = 'Use at least 6 characters.';
  }

  return errors;
}

export function useLoginForm() {
  const [form, setForm] = useState<LoginForm>(initialForm);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clearSession = useAuthStore((state) => state.clearSession);
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);

  const canSubmit = useMemo(
    () => form.email.trim().length > 0 && form.password.length > 0 && !isSubmitting,
    [form.email, form.password, isSubmitting],
  );

  function updateField(name: keyof LoginForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, form: undefined }));
  }

  async function signOut() {
    await authTokenStorage.removeRefreshToken();
    clearSession();
  }

  async function submit() {
    const nextErrors = validateForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const credentials = await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      await authTokenStorage.setRefreshToken(credentials.refreshToken);
      setSession(credentials.session);
      setForm(initialForm);
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : 'Unable to sign in.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    canSubmit,
    errors,
    form,
    isSubmitting,
    session,
    signOut,
    submit,
    updateField,
  };
}
