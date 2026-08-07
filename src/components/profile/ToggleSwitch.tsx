import { Pressable, View } from 'react-native';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}

export function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <Pressable
      role="switch"
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={() => onChange(!checked)}
      className={`flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 ${
        checked ? 'justify-end bg-ember-500' : 'justify-start bg-white/10'
      }`}>
      <View className="h-5 w-5 rounded-full bg-white" />
    </Pressable>
  );
}
