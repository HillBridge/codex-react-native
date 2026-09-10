export type LoginForm = {
  email: string;
  password: string;
};

export type LoginFormErrors = Partial<Record<keyof LoginForm, string>>;

export function validateLoginForm({ email, password }: LoginForm): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = '请输入有效邮箱。';
  }

  if (!password) {
    errors.password = '请输入密码。';
  }

  return errors;
}
