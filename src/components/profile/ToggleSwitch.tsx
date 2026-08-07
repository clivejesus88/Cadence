import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}

export function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex h-6 w-11 flex-shrink-0 items-center rounded-full px-0.5 transition-colors duration-300 ${
      checked ? 'bg-ember-500 justify-end' : 'bg-white/10 justify-start'}`
      }>
      
      <span className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300" />
    </button>);

}