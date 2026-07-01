import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, size = 'md', className = '' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Frosted Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          {/* Modal Container */}
          <motion.div
            className={`relative w-full ${sizes[size]} rounded-2xl border shadow-2xl glass-panel-premium overflow-hidden z-10 ${className}`}
            style={{
              borderColor: 'var(--glass-border)',
            }}
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                <h2 className="text-base font-bold font-brand text-white">{title}</h2>
                <button
                  id="modal-close-btn"
                  onClick={onClose}
                  className="p-1.5 rounded-xl glass-button text-zinc-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {/* Content */}
            <div className="p-5 overflow-y-auto max-h-[75vh]">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
