import { forwardRef } from 'react';
import type { TextInputProps } from 'react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, spacing } from '@/shared/constants/theme';

type FormTextInputProps = TextInputProps & {
  error?: string;
  label: string;
};

export const FormTextInput = forwardRef<TextInput, FormTextInputProps>(function FormTextInput(
  { accessibilityHint, accessibilityLabel, error, label, style, ...inputProps },
  ref,
) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        ref={ref}
        accessibilityHint={error || accessibilityHint}
        accessibilityLabel={accessibilityLabel || label}
        placeholderTextColor={colors.mutedText}
        style={[styles.input, error ? styles.inputError : null, style]}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

FormTextInput.displayName = 'FormTextInput';

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.md,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
});
