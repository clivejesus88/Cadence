import { Text, View } from 'react-native';
import { CheckIcon } from 'lucide-react-native';
import { Glass } from '../ui/Glass';

const rows = [
  { title: 'Problem Set 4', done: true },
  { title: 'Read Chapter 7', done: false },
  { title: 'Outline Essay', done: false },
];

export function PlannerVisual() {
  return (
    <View className="w-full max-w-[260px]">
      <Glass variant="strong" className="rounded-3xl p-5">
        <View className="gap-2.5">
          {rows.map((r, i) => (
            <Glass key={i} variant="inset" className="flex-row items-center gap-3 rounded-xl px-3 py-2.5">
              <View
                className={`h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  r.done ? 'border-ember-500 bg-ember-500' : 'border-neutral-500'
                }`}>
                {r.done && <CheckIcon size={12} color="#0a0d10" />}
              </View>
              <Text className={`text-sm ${r.done ? 'text-neutral-500 line-through' : 'text-white'}`}>
                {r.title}
              </Text>
            </Glass>
          ))}
        </View>
      </Glass>
    </View>
  );
}
