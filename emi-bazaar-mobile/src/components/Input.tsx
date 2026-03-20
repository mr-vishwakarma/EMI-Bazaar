import React from 'react';
import { TextInput, Text, StyleSheet, View, TextInputProps } from 'react-native';
import { Theme } from '../theme/Theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: any;
}

export const Input = ({ label, error, containerStyle, style, ...props }: Props) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.errorInput, style]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={Theme.colors.mutedForeground}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    height: 56,
    borderRadius: Theme.radius,
    backgroundColor: Theme.colors.secondary,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Theme.colors.foreground,
    padding: 0,
  },
  errorInput: {
    borderColor: Theme.colors.destructive,
  },
  errorText: {
    color: Theme.colors.destructive,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
