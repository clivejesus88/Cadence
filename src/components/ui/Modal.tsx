import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { XIcon } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  variant?: 'center' | 'sheet';
  dismissOnBackdrop?: boolean;
  contentClassName?: string;
  children: ReactNode;
}

const TitleContext = createContext<{ id: string; claim: () => void } | null>(null);

let scrollLockCount = 0;

function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    scrollLockCount += 1;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      scrollLockCount -= 1;
      if (scrollLockCount <= 0) {
        scrollLockCount = 0;
        document.body.style.overflow = previous;
      }
    };
  }, [active]);
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  variant = 'center',
  dismissOnBackdrop = true,
  contentClassName = '',
  children
}: ModalProps) {
  const isSheet = variant === 'sheet';
  const titleId = useId();
  const [hasTitle, setHasTitle] = useState(false);
  const [viewport, setViewport] = useState<{ top: number; height: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const dragControls = useDragControls();

  useBodyScrollLock(open);

  const claimTitle = useCallback(() => setHasTitle(true), []);

  useEffect(() => {
    if (!open) {
      setViewport(null);
      return;
    }
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;
    const update = () => setViewport({ top: visualViewport.offsetTop, height: visualViewport.height });
    update();
    visualViewport.addEventListener('resize', update);
    return () => {
      visualViewport.removeEventListener('resize', update);
      setViewport(null);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dismissOnBackdrop) onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const card = cardRef.current;
      if (!card) return;
      const nodes = Array.from(card.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.getClientRects().length > 0
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !card.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !card.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, dismissOnBackdrop, onClose]);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() => {
      const card = cardRef.current;
      if (!card) return;
      const active = document.activeElement;
      if (active instanceof HTMLElement && card.contains(active)) return;
      const target = card.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (target ?? card).focus({ preventScroll: true });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      const previous = restoreFocusRef.current;
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [open]);

  const dialog = (
    <motion.div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={hasTitle ? titleId : undefined}
      tabIndex={-1}
      initial={{ opacity: 0, y: isSheet ? 70 : 20, scale: isSheet ? 1 : 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: isSheet ? 70 : 16, scale: isSheet ? 1 : 0.97 }}
      transition={{ type: 'spring', damping: 32, stiffness: 360, mass: 0.9 }}
      drag={isSheet ? 'y' : false}
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.5 }}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        if (info.offset.y > 110 || info.velocity.y > 700) onClose();
      }}
      className={`modal-card flex w-full flex-col rounded-[30px] ${
        isSheet ? 'max-h-full max-w-sm' : 'max-h-full max-w-md'
      }`}
    >
      {isSheet && (
        <div
          className="flex shrink-0 cursor-grab touch-none select-none justify-center py-2 active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="modal-grabber" />
        </div>
      )}
      <div
        className={`scroll-contain no-scrollbar min-h-0 flex-1 overflow-y-auto rounded-b-[30px] ${
          isSheet ? 'px-6 pb-6 pt-1' : 'px-6 pb-6 pt-6'
        } ${contentClassName}`}
      >
        <TitleContext.Provider value={{ id: titleId, claim: claimTitle }}>{children}</TitleContext.Provider>
      </div>
    </motion.div>
  );

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={viewport ? { top: viewport.top, height: viewport.height } : undefined}
          className={`fixed inset-0 z-[60] flex justify-center ${
            isSheet
              ? 'items-end px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]'
              : 'items-center px-5 py-10'
          }`}
        >
          <div
            aria-hidden="true"
            onClick={dismissOnBackdrop ? onClose : undefined}
            className="absolute inset-0 bg-ink-950/85 backdrop-blur-md"
            style={{ touchAction: 'none' }}
          />
          {dialog}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

interface ModalHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export function ModalHeader({ eyebrow, title, subtitle, onClose }: ModalHeaderProps) {
  const titleContext = useContext(TitleContext);

  useEffect(() => {
    titleContext?.claim();
  }, [titleContext]);

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-widest text-ember-400">{eyebrow}</p>
        )}
        <p id={titleContext?.id} className={`font-display text-xl text-white ${eyebrow ? 'mt-1' : ''}`}>
          {title}
        </p>
        {subtitle && <p className="mt-1 text-xs text-neutral-400">{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        aria-label="Close"
        className="hit-slop flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors active:scale-95 active:bg-white/10 hover:text-white">
        <XIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
