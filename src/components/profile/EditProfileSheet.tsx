import React, { useRef, useState } from 'react';
import { CameraIcon, CheckIcon } from 'lucide-react';
import { UserProfile } from '../../types/user';
import { useSettings } from '../../contexts/SettingsContext';
import { Modal, ModalHeader } from '../ui/Modal';
import { Avatar } from './Avatar';
import { avatarPresets, presetAvatarValue, resolveAvatar, PRESET_PREFIX } from '../../data/avatars';

const AVATAR_SIZE = 256;

interface EditProfileSheetProps {
  profile: UserProfile;
  onClose: () => void;
}

export function EditProfileSheet({ profile, onClose }: EditProfileSheetProps) {
  const { updateProfile } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile.name);
  const [school, setSchool] = useState(profile.school);
  const [email, setEmail] = useState(profile.email);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);

  const canSave = name.trim().length > 0;
  const activePreset = resolveAvatar(avatarUrl).preset;
  const isCustomAvatar = !avatarUrl.trim().startsWith(PRESET_PREFIX);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = AVATAR_SIZE;
        canvas.height = AVATAR_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setAvatarUrl(src);
          return;
        }
        const scale = Math.max(AVATAR_SIZE / img.width, AVATAR_SIZE / img.height);
        const w = AVATAR_SIZE / scale;
        const h = AVATAR_SIZE / scale;
        ctx.fillStyle = '#181c22';
        ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
        ctx.drawImage(img, (AVATAR_SIZE - w) / 2, (AVATAR_SIZE - h) / 2, w, h);
        setAvatarUrl(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!canSave) return;
    updateProfile({
      name: name.trim(),
      school: school.trim(),
      email: email.trim(),
      avatarUrl: avatarUrl.trim() || presetAvatarValue('beam-ember')
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} variant="center">
      <ModalHeader
      eyebrow="Profile"
      title="Edit profile"
      subtitle="Update your details and avatar."
      onClose={onClose} />

      <div className="modal-divider my-5 h-px" />

        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar value={avatarUrl} className="h-24 w-24 ring-2 ring-white/20" alt="Avatar preview" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Upload a photo"
              className="hit-slop absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-ember-500 text-ink-950 ring-4 ring-[#20252c] transition-transform active:scale-90">
              <CameraIcon className="h-4 w-4" />
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="mt-3 text-xs font-medium text-neutral-500">
            {isCustomAvatar ? 'Using your uploaded photo' : 'Pick an avatar below'}
          </p>
        </div>

        <div className="mt-5">
          <div className="grid grid-cols-4 gap-3">
            {avatarPresets.map((a) => {
              const selected = !isCustomAvatar && activePreset?.id === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  aria-label={a.name}
                  aria-pressed={selected}
                  onClick={() => setAvatarUrl(presetAvatarValue(a.id))}
                  className={`relative aspect-square rounded-full transition-transform active:scale-90 ${
                    selected ? 'ring-2 ring-ember-400 ring-offset-2 ring-offset-[#20252c]' : 'ring-1 ring-white/10'
                  }`}>
                  <Avatar value={presetAvatarValue(a.id)} className="h-full w-full" alt={a.name} />
                  {selected && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-ember-500 text-ink-950 ring-2 ring-[#20252c]">
                      <CheckIcon className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="edit-name" className="mb-1.5 block text-xs font-medium text-neutral-400">Name</label>
            <input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="glass-inset w-full rounded-2xl px-3.5 py-3 text-base text-white placeholder:text-neutral-500 focus:outline-none focus:border-ember-400" />
            
          </div>
          <div>
            <label htmlFor="edit-school" className="mb-1.5 block text-xs font-medium text-neutral-400">School</label>
            <input
              id="edit-school"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="e.g. Second year · Biology"
              className="glass-inset w-full rounded-2xl px-3.5 py-3 text-base text-white placeholder:text-neutral-500 focus:outline-none focus:border-ember-400" />
            
          </div>
          <div>
            <label htmlFor="edit-email" className="mb-1.5 block text-xs font-medium text-neutral-400">Email</label>
            <input
              id="edit-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@university.edu"
              className="glass-inset w-full rounded-2xl px-3.5 py-3 text-base text-white placeholder:text-neutral-500 focus:outline-none focus:border-ember-400" />
            
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="glass rounded-full px-6 py-4 text-[15px] font-semibold text-neutral-300 transition-colors hover:text-white active:scale-[0.98]">
            
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={`flex-1 rounded-full py-4 text-[15px] font-bold transition-transform active:scale-[0.98] ${
            canSave ? 'bg-gradient-to-r from-ember-500 via-ember-600 to-orange-600 text-white' : 'bg-white/10 text-neutral-500'}`
            }>
            
              Save changes
            </button>
        </div>
    </Modal>);

}
