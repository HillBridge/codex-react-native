export function getAuthRequestMessage(status: number | undefined) {
  if (status === 401) {
    return '邮箱或密码不正确。';
  }

  if (status === 422) {
    return '登录信息格式不正确。';
  }

  if (status === 429) {
    return '登录尝试过于频繁，请稍后再试。';
  }

  return '服务暂时不可用，请稍后重试。';
}
