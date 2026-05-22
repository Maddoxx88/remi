import { Image, StyleSheet } from 'react-native';

const logoSource = require('../assets/remi-logo.png');

interface RemiLogoProps {
  size?: number;
}

export default function RemiLogo({ size = 40 }: RemiLogoProps) {
  return (
    <Image
      source={logoSource}
      style={[styles.logo, { width: size, height: size }]}
      resizeMode="contain"
      accessibilityLabel="Remi logo"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    backgroundColor: 'transparent',
  },
});
