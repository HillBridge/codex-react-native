import { useMemo, useState } from 'react';

import { login } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/store';
import { authTokenStorage } from '@/features/auth/utils/authTokenStorage';
import { APP_ROUTES, useAppNavigation } from '@/shared/routing';

type LoginForm = {
  areaCode: string;
  googleCode: string;
  mobile: string;
  password: string;
};

type LoginFormErrors = Partial<Record<keyof LoginForm | 'form', string>>;

const initialForm: LoginForm = {
  areaCode: '55',
  googleCode: '',
  mobile: '(11) 91234-5678',
  password: 'qCO*5Mmx0e',
};

type LoginPhase = 'credentials' | 'mfa';

type LoginNotice = {
  message: string;
  type: 'info' | 'warning';
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function validateForm(form: LoginForm, phase: LoginPhase): LoginFormErrors {
  const errors: LoginFormErrors = {};
  const areaCodeDigits = onlyDigits(form.areaCode);
  const mobileDigits = onlyDigits(form.mobile);
  const googleCodeDigits = onlyDigits(form.googleCode);

  if (!form.areaCode.trim()) {
    errors.areaCode = 'Area code is required.';
  } else if (areaCodeDigits.length !== form.areaCode.trim().length) {
    errors.areaCode = 'Area code must contain digits only.';
  }

  if (!form.mobile.trim()) {
    errors.mobile = 'Mobile number is required.';
  } else if (mobileDigits.length < 8) {
    errors.mobile = 'Enter a valid mobile number.';
  }

  if (!form.password) {
    errors.password = 'Password is required.';
  } else if (form.password.length < 6) {
    errors.password = 'Use at least 6 characters.';
  }

  if (phase === 'mfa' && !form.googleCode.trim()) {
    errors.googleCode = 'Google Auth code is required.';
  } else if (phase === 'mfa' && googleCodeDigits.length !== 6) {
    errors.googleCode = 'Google Auth code must be 6 digits.';
  }

  return errors;
}

function validateCredentialsStep(form: LoginForm) {
  return validateForm(form, 'credentials');
}

function validateMfaStep(form: LoginForm) {
  return validateForm(form, 'mfa');
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
    setForm((current) => ({ ...current, googleCode: '' }));
    setNotice(null);
    setErrors({});
  }

  function submitCredentialsStep() {
    const nextErrors = validateCredentialsStep(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setNotice({ message: 'Enter your Google Auth code to continue.', type: 'info' });
    setPhase('mfa');
  }

  async function submitMfaStep() {
    const nextErrors = validateMfaStep(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login({
        areaCode: onlyDigits(form.areaCode),
        googleCode: onlyDigits(form.googleCode),
        mobile: onlyDigits(form.mobile),
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

  function submit() {
    if (phase === 'credentials') {
      submitCredentialsStep();
      return;
    }

    void submitMfaStep();
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
