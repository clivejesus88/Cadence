import { useNavigate } from 'react-router-dom';
import { CrownIcon, XIcon } from 'lucide-react';
import { FeatureKey, FEATURE_COPY } from '../../utils/premium';
import { Modal } from '../ui/Modal';

interface UpgradeSheetProps {
  feature: FeatureKey | null;
  onClose: () => void;
}

export function UpgradeSheet({ feature, onClose }: UpgradeSheetProps) {
  const navigate = useNavigate();
  const copy = feature ? FEATURE_COPY[feature] : null;

  return (
    <Modal open={!!copy} onClose={onClose} variant="sheet" contentClassName="text-center">
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-neutral-300 transition-colors hover:text-white">
        <XIcon className="h-4 w-4" />
      </button>

      <div className="mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ember-400 to-ember-600 ring-1 ring-white/20">
        <CrownIcon className="h-8 w-8 text-white" />
      </div>

      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-ember-300">Cadence Pro</p>
      <h2 className="font-display mt-1.5 text-2xl text-white">{copy?.title}</h2>
      <p className="mx-auto mt-2.5 max-w-[270px] text-sm leading-6 text-neutral-400">{copy?.desc}</p>

      <div className="modal-divider mx-auto mt-6 h-px w-full" />

      <button
        onClick={() => {
          onClose();
          navigate('/?paywall=1');
        }}
        className="mt-6 w-full rounded-full bg-gradient-to-r from-ember-500 via-ember-600 to-orange-600 py-4 text-[15px] font-bold text-white transition-transform active:scale-[0.98]">
        Upgrade to Unlock
      </button>
      <button onClick={onClose} className="mt-3 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-300">
        Maybe later
      </button>
    </Modal>
  );
}
