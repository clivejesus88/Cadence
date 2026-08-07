import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { XIcon } from 'lucide-react-native';
import { format } from 'date-fns';
import { useAppData } from '../../contexts/AppDataContext';
import { Glass } from '../ui/Glass';
import { GradientButton } from '../ui/GradientButton';

interface AddTaskSheetProps {
  onClose: () => void;
}

export function AddTaskSheet({ onClose }: AddTaskSheetProps) {
  const { addTask } = useAppData();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [pomodoros, setPomodoros] = useState(2);

  const handleSubmit = () => {
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      subject: subject.trim() || 'General',
      estimatedPomodoros: pomodoros,
      dueDate: format(new Date(), 'yyyy-MM-dd'),
    });
    onClose();
  };

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white';

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable onPress={onClose} className="absolute inset-0 bg-black/50" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Glass variant="strong" className="w-full rounded-t-3xl px-5 pb-8 pt-5">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="font-display text-lg text-white">New Task</Text>
              <Pressable
                onPress={onClose}
                accessibilityLabel="Close"
                className="h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <XIcon size={16} color="#a3a3a3" />
              </Pressable>
            </View>

            <View className="gap-4">
              <View>
                <Text className="mb-1.5 block text-xs text-neutral-500">Task</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Read Chapter 5"
                  placeholderTextColor="#737373"
                  className={inputClass}
                />
              </View>
              <View>
                <Text className="mb-1.5 block text-xs text-neutral-500">Subject</Text>
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="e.g. Biology"
                  placeholderTextColor="#737373"
                  className={inputClass}
                />
              </View>
              <View>
                <Text className="mb-1.5 block text-xs text-neutral-500">Estimated sessions</Text>
                <View className="flex-row gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => setPomodoros(n)}
                      className={`flex-1 rounded-xl py-2.5 ${
                        pomodoros === n ? 'bg-ember-500' : 'border border-white/10 bg-white/5'
                      }`}>
                      <Text
                        className={`text-center text-sm font-semibold ${
                          pomodoros === n ? 'text-ink-950' : 'text-neutral-300'
                        }`}>
                        {n}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <GradientButton title="Add Task" onPress={handleSubmit} />
            </View>
          </Glass>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
