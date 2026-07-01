import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

let toastEmitter = null;

export function useToast() {
  return {
    success: (msg, dur) => toastEmitter?.('success', msg, dur),
    error:   (msg, dur) => toastEmitter?.('error',   msg, dur),
    info:    (msg, dur) => toastEmitter?.('info',    msg, dur),
    warning: (msg, dur) => toastEmitter?.('warning', msg, dur),
  };
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastEmitter = (type, message, duration = 3500) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, type, message }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    };
    return () => { toastEmitter = null; };
  }, []);

  const icons = {
    success: <CheckCircle size={15} className="text-emerald-400" />,
    error:   <XCircle    size={15} className="text-red-400"   />,
    info:    <Info       size={15} className="text-sky-400"  />,
    warning: <AlertTriangle size={15} className="text-amber-400" />,
  };

  const borders = {
    success: 'border-emerald-500/20 bg-zinc-950/85',
    error:   'border-red-500/20 bg-zinc-950/85',
    info:    'border-sky-500/20 bg-zinc-950/85',
    warning: 'border-amber-500/20 bg-zinc-950/85',
  };

  return (
    <div className="fixed top-12 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border backdrop-blur-md text-xs font-bold text-white pointer-events-auto shadow-2xl min-w-[220px] max-w-[340px] ${borders[t.type]}`}
          >
            {icons[t.type]}
            <span className="flex-1 truncate">{t.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="ml-1 opacity-60 hover:opacity-100 transition-opacity p-0.5"
            >
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
