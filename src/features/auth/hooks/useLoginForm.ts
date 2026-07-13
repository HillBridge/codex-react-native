import { useMemo, useState } from 'react';

import { login } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/store';
import { authTokenStorage } from '@/features/auth/utils/authTokenStorage';
import { APP_ROUTES, useAppNavigation } from '@/shared/routing';

type LoginForm = {
  areaCode: string;
  googleCode: string;
  loginCode: string;
  mobile: string;
  password: string;
};

type LoginFormErrors = Partial<Record<keyof LoginForm | 'form', string>>;

const initialForm: LoginForm = {
  areaCode: '55',
  googleCode: '',
  loginCode: '',
  mobile: '(11) 91234-5678',
  password: 'qCO*5Mmx0e',
};

type LoginPhase = 'credentials' | 'mfa';

type LoginNotice = {
  message: string;
  type: 'info' | 'warning';
};

function validateForm(form: LoginForm, phase: LoginPhase): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!form.areaCode.trim()) {
    errors.areaCode = 'Area code is required.';
  }

  if (!form.mobile.trim()) {
    errors.mobile = 'Mobile number is required.';
  }

  if (!form.password) {
    errors.password = 'Password is required.';
  } else if (form.password.length < 6) {
    errors.password = 'Use at least 6 characters.';
  }

  if (phase === 'mfa' && !form.googleCode.trim()) {
    errors.googleCode = 'Google Auth code is required.';
  }

  return errors;
}

export function useLoginForm() {
  const [form, setForm] = useState<LoginForm>(initialForm);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<LoginNotice | null>(null);
  const [phase, setPhase] = useState<LoginPhase>('credentials');
  const navigation = useAppNavigation();
  const setSession = useAuthStore((state) => state.setSession);

  const canSubmit = useMemo(
    () =>
      form.areaCode.trim().length > 0 &&
      form.mobile.trim().length > 0 &&
      form.password.length > 0 &&
      (phase === 'credentials' || form.googleCode.trim().length > 0) &&
      !isSubmitting,
    [form.areaCode, form.googleCode, form.mobile, form.password, phase, isSubmitting],
  );

  function updateField(name: keyof LoginForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, form: undefined }));
    setNotice(null);
  }

  function resetMfa() {
    setPhase('credentials');
    setForm((current) => ({ ...current, googleCode: '', loginCode: '' }));
    setNotice(null);
    setErrors({});
  }

  async function submit() {
    const nextErrors = validateForm(form, phase);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login({
        areaCode: form.areaCode.trim(),
        googleCode: form.googleCode.trim(),
        loginCode: form.loginCode,
        mobile: form.mobile.trim(),
        password: form.password,
      });

      if (result.type === 'authenticated') {
        await authTokenStorage.setRefreshToken(result.credentials.refreshToken);
        setSession(result.credentials.session);
        setForm(initialForm);
        setPhase('credentials');
        navigation.replace(APP_ROUTES.home);
        return;
      }

      if (result.type === 'mfaRequired') {
        setPhase('mfa');
        setForm((current) => ({
          ...current,
          googleCode: '',
          loginCode: result.challenge.code ?? current.loginCode,
        }));
        setNotice({ message: result.message, type: 'info' });
        return;
      }

      if (result.type === 'mfaQrBindingRequired') {
        setNotice({
          message: `${result.message} QR data: ${result.qrCode}`,
          type: 'warning',
        });
        return;
      }

      if (result.type === 'principalSelectionRequired') {
        setNotice({
          message: `${result.message} ${result.principalOptions.length} identities returned.`,
          type: 'warning',
        });
        return;
      }

      setErrors({
        form: result.remainingTimes
          ? `${result.message}. Remaining attempts: ${result.remainingTimes}`
          : result.message,
      });
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
    notice,
    phase,
    resetMfa,
    submit,
    updateField,
  };
}
