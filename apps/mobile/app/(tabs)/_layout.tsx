import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RemiLogo from '../../components/RemiLogo';
import { Colors, Fonts } from '../../services/theme';

function TabIcon({ name, focused }: { name: any; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconActive]}>
      <Ionicons name={name} size={20} color={focused ? Colors.text : Colors.textDim} />
    </View>
  );
}

function HomeTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconActive]}>
      <RemiLogo size={22} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.text,
        tabBarInactiveTintColor: Colors.textDim,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dump',
          tabBarIcon: ({ focused }) => <HomeTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'time' : 'time-outline'} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.bg,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  iconWrap: {
    width: 40,
    height: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 10,
  },
  iconActive: {
    backgroundColor: Colors.accent,
  },
});