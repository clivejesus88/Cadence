import { Tabs } from 'expo-router';
import { TabBarLayout } from '../../../components/layout/TabBarLayout';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      layout={(props) => <TabBarLayout {...props} />}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="focus" options={{ title: 'Focus' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
      <Tabs.Screen name="planner" options={{ title: 'Planner' }} />
    </Tabs>
  );
}
