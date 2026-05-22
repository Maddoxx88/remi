import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '../services/theme';

interface Props {
  message: string;
  onDismiss: () => void;
}

export default function ProcessErrorCard({ message, onDismiss }: Props) {
  return (
    <View style={styles.card} accessibilityRole="alert">
      <View style={styles.iconWrap}>
        <Ionicons name="alert-circle" size={22} color={Colors.high} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Couldn't organize your dump</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      <TouchableOpacity
        onPress={onDismiss}
        style={styles.dismissBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Dismiss error"
      >
        <Ionicons name="close" size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.highSoft,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#FF5A5A30',
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  iconWrap: {
    marginTop: 2,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: Colors.text,
  },
  message: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
  },
  dismissBtn: {
    padding: 2,
  },
});
