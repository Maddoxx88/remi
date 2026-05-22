import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '../services/theme';

type MdiName = keyof typeof MaterialCommunityIcons.glyphMap;

const TABS: Record<string, { label: string; icon: MdiName; iconActive: MdiName }> = {
  index: { label: 'Home', icon: 'home-outline', iconActive: 'home' },
  history: { label: 'History', icon: 'clock-outline', iconActive: 'clock' },
};

export default function MaterialTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tab = TABS[route.name] ?? {
          label: route.name,
          icon: 'circle-outline' as MdiName,
          iconActive: 'circle' as MdiName,
        };

        return (
          <Pressable
            key={route.key}
            style={styles.tab}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
          >
            <View style={styles.iconSlot}>
              <MaterialCommunityIcons
                name={focused ? tab.iconActive : tab.icon}
                size={24}
                color={focused ? Colors.tabActive : Colors.tabInactive}
              />
            </View>
            <Text style={[styles.label, focused && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  iconSlot: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.tabInactive,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  labelActive: {
    color: Colors.tabActive,
  },
});
