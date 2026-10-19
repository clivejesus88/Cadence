import { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  variant?: 'center' | 'sheet';
  dismissOnBackdrop?: boolean;
  contentClassName?: string;
  children: ReactNode;
}

export function Modal({
  open,
  onClose,
  variant = 'center',
  dismissOnBackdrop = true,
  contentClassName = '',
  children
}: ModalProps) {
  const isSheet = variant === 'sheet';

  return (
    <AnimatePresence>
      {open &&
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`fixed inset-0 z-[60] flex justify-center ${
          isSheet
            ? 'items-end px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]'
            : 'items-center px-5 py-10'}`
        }>
        
        <div
          aria-hidden="true"
          onClick={dismissOnBackdrop ? onClose : undefined}
          className="absolute inset-0 bg-ink-950/85 backdrop-blur-md" />
        
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, y: isSheet ? 70 : 20, scale: isSheet ? 1 : 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isSheet ? 70 : 16, scale: isSheet ? 1 : 0.97 }}
          transition={{ type: 'spring', damping: 32, stiffness: 360, mass: 0.9 }}
          className={`modal-card w-full rounded-[30px] ${isSheet ? 'max-w-sm' : 'max-w-md'}`}>
          
          {isSheet && <div className="modal-grabber" />}
          <div
            className={`no-scrollbar overflow-y-auto rounded-b-[30px] ${
              isSheet ? 'px-5 pb-6 pt-1' : 'px-6 pb-6 pt-6'} ${contentClassName}`}>
            
            {children}
          </div>
        </motion.div>
      </motion.div>
      }
    </AnimatePresence>
  );
}

interface ModalHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export function ModalHeader({ eyebrow, title, subtitle, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow &&
        <p className="text-[11px] font-bold uppercase tracking-widest text-ember-400">{eyebrow}</p>
        }
        <p className={`font-display text-xl text-white ${eyebrow ? 'mt-1' : ''}`}>{title}</p>
        {subtitle &&
        <p className="mt-1 text-xs text-neutral-400">{subtitle}</p>
        }
      </div>
      <button
        onClick={onClose}
        aria-label="Close"
        className="glass-inset flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:text-white">
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
