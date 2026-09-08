export const demoUser = {
  email: 'demo@example.com',
  id: 'user_demo_001',
  name: 'Nuxt Pilot',
  password: 'nuxt-demo',
  points: 12880,
  preference: '低延迟购物体验',
  tier: 'Pro',
};

export function getDemoUserByEmail(email) {
  return email === demoUser.email ? demoUser : undefined;
}

export function toUserProfile(user) {
  return {
    email: user.email,
    id: user.id,
    name: user.name,
    points: user.points,
    preference: user.preference,
    tier: user.tier,
  };
}
