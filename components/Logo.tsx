import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'light' | 'dark';
  showText?: boolean;
  style?: ViewStyle;
}

export function Logo({ size = 'medium', variant = 'dark', showText = true, style }: LogoProps) {
  const sizeStyles = {
    small: { width: 120, height: 36 },
    medium: { width: 160, height: 48 },
    large: { width: 220, height: 66 },
  };

  const currentSize = sizeStyles[size];

  // Use the blue logo on transparent background for all variants
  // The logo itself has the branding color
  const logoSource = require('../assets/hommie-logo.png');

  return (
    <View style={[styles.container, style]}>
      <Image
        source={logoSource}
        style={[styles.logo, { width: currentSize.width, height: currentSize.height }]}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    resizeMode: 'contain',
  },
});
