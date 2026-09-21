import { useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { UserProfile } from '../../types/user';
import { useSettings } from '../../contexts/SettingsContext';

const DEFAULT_AVATAR = '/41934678-ca28-4660-a31a-3e5350bae9d7.jpg';

interface EditProfileSheetProps {
  profile: UserProfile;
  onClose: () => void;
}

export function EditProfileSheet({ profile, onClose }: EditProfileSheetProps) {
  const { updateProfile } = useSettings();
  const [name, setName] = useState(profile.name);
  const [school, setSchool] = useState(profile.school);
  const [email, setEmail] = useState(profile.email);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    updateProfile({
      name: name.trim(),
      school: school.trim(),
      email: email.trim(),
      avatarUrl: avatarUrl.trim() || DEFAULT_AVATAR
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-5 py-10">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="glass-strong relative w-full max-w-md max-h-[85vh] overflow-y-auto no-scrollbar rounded-3xl px-5 pt-5 pb-6">
        
        <div className="flex items-center justify-between mb-5">
          <p className="font-display text-lg text-white">Edit profile</p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="glass-inset w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
            
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative">
            <img src={avatarUrl || DEFAULT_AVATAR} alt="Avatar preview" className="h-20 w-20 rounded-full object-cover ring-2 ring-white/20" />
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="glass-inset w-full rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-ember-400" />
            
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">School</label>
            <input
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="e.g. Second year · Biology"
              className="glass-inset w-full rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-ember-400" />
            
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@university.edu"
              className="glass-inset w-full rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-ember-400" />
            
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Avatar URL</label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder={DEFAULT_AVATAR}
              className="glass-inset w-full rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-ember-400" />
            
            <p className="mt-1.5 text-[11px] text-neutral-600">Paste a link to an image (JPG/PNG).</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`w-full mt-6 py-4 rounded-full font-semibold text-[15px] transition-transform active:scale-[0.98] ${
          canSave ? 'bg-gradient-to-r from-ember-500 via-ember-600 to-orange-600 text-white' : 'bg-white/10 text-neutral-500'}`
          }>
          
            Save changes
          </button>
      </motion.div>
    </div>);
}