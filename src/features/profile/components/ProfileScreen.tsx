import { Image, StyleSheet, Text, View } from 'react-native';

import { useAuthStore, useSignOut } from '@/features/auth';
import { useProfileMedia } from '@/features/profile/hooks/useProfileMedia';
import { colors, spacing } from '@/shared/constants/theme';
import { AppButton, Screen } from '@/shared/package';

export function ProfileScreen() {
  const user = useAuthStore((state) => state.session?.user);
  const signOut = useSignOut();
  const {
    attachment,
    avatarUri,
    isProcessingAvatar,
    needsSettings,
    notice,
    openSystemSettings,
    pickAvatar,
    pickOrderAttachment,
    shareAttachment,
    takeAvatarPhoto,
  } = useProfileMedia();

  return (
    <Screen scrollable>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatarRow}>
            {avatarUri ? (
              <Image
                accessibilityLabel="本地头像预览"
                source={{ uri: avatarUri }}
                style={styles.avatar}
              />
            ) : (
              <View accessibilityLabel="默认头像" style={styles.avatarFallback}>
                <Text style={styles.avatarLabel}>{(user?.name || '会').slice(0, 1)}</Text>
              </View>
            )}
            <View style={styles.headerText}>
              <Text style={styles.kicker}>账户</Text>
              <Text style={styles.title}>{user?.name || '会员'}</Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
          </View>
        </View>
        <View style={styles.card}>
          <Row label="会员等级" value={user?.tier || '-'} />
          <Row label="积分" value={user?.points?.toLocaleString('zh-CN') || '-'} />
          <Row label="偏好" value={user?.preference || '-'} />
        </View>
        <View style={styles.practiceCard}>
          <Text style={styles.cardTitle}>头像练习</Text>
          <Text style={styles.description}>选择或拍摄后，头像会本地裁剪并压缩为 512 × 512。</Text>
          <AppButton
            accessibilityLabel="从照片库选择头像"
            disabled={isProcessingAvatar}
            loading={isProcessingAvatar}
            onPress={pickAvatar}
            variant="secondary"
          >
            从照片库选择头像
          </AppButton>
          <AppButton
            accessibilityLabel="拍摄头像"
            disabled={isProcessingAvatar}
            onPress={takeAvatarPhoto}
            variant="secondary"
          >
            拍摄头像
          </AppButton>
        </View>
        <View style={styles.practiceCard}>
          <Text style={styles.cardTitle}>订单附件练习</Text>
          <Text style={styles.description}>只展示名称、类型和大小，不读取或保存文件内容。</Text>
          {attachment ? (
            <View style={styles.attachment}>
              <Text style={styles.attachmentName}>{attachment.name}</Text>
              <Text style={styles.attachmentMeta}>
                {attachment.mimeType} · {attachment.displaySize}
              </Text>
            </View>
          ) : null}
          <AppButton
            accessibilityLabel="选择订单附件"
            onPress={pickOrderAttachment}
            variant="secondary"
          >
            选择订单附件
          </AppButton>
          <AppButton
            accessibilityLabel="分享已选择的订单附件"
            disabled={!attachment}
            onPress={shareAttachment}
            variant="secondary"
          >
            分享附件
          </AppButton>
        </View>
        {notice ? (
          <View
            accessibilityLiveRegion="polite"
            style={[styles.notice, notice.tone === 'error' && styles.noticeError]}
          >
            <Text style={[styles.noticeText, notice.tone === 'error' && styles.noticeErrorText]}>
              {notice.message}
            </Text>
          </View>
        ) : null}
        {needsSettings ? (
          <AppButton
            accessibilityLabel="打开系统设置"
            onPress={openSystemSettings}
            variant="secondary"
          >
            打开系统设置
          </AppButton>
        ) : null}
        <AppButton accessibilityLabel="退出登录" variant="secondary" onPress={signOut}>
          退出登录
        </AppButton>
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { alignSelf: 'center', maxWidth: 640, width: '100%' },
  header: { gap: spacing.xs, marginBottom: spacing.lg },
  avatarRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  avatar: { borderRadius: 40, height: 80, width: 80 },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  avatarLabel: { color: colors.primary, fontSize: 30, fontWeight: '800' },
  headerText: { flex: 1, gap: spacing.xs },
  kicker: { color: colors.primary, fontWeight: '700' },
  title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  email: { color: colors.mutedText },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  row: { gap: spacing.xs },
  label: { color: colors.mutedText, fontSize: 13 },
  value: { color: colors.text, fontSize: 17, fontWeight: '700' },
  practiceCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  description: { color: colors.mutedText, fontSize: 14, lineHeight: 20 },
  attachment: {
    backgroundColor: colors.background,
    borderRadius: 8,
    gap: spacing.xs,
    padding: spacing.md,
  },
  attachmentName: { color: colors.text, fontWeight: '700' },
  attachmentMeta: { color: colors.mutedText, fontSize: 13 },
  notice: {
    backgroundColor: '#ECFDF3',
    borderColor: '#A7F3D0',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  noticeError: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  noticeText: { color: colors.success, fontSize: 14, lineHeight: 20 },
  noticeErrorText: { color: colors.danger },
});
