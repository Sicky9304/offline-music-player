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
    success: <CheckCircle size={16} className="text-green-400" />,
    error:   <XCircle    size={16} className="text-red-400"   />,
    info:    <Info       size={16} className="text-blue-400"  />,
    warning: <AlertTriangle size={16} className="text-yellow-400" />,
  };

  const colors = {
    success: 'border-green-500/30  bg-green-950/80',
    error:   'border-red-500/30    bg-red-950/80',
    info:    'border-blue-500/30   bg-blue-950/80',
    warning: 'border-yellow-500/30 bg-yellow-950/80',
  };

  return (
    <div className="fixed top-16 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border backdrop-blur-md text-sm font-medium text-white pointer-events-auto shadow-2xl min-w-[240px] max-w-[360px] ${colors[t.type]}`}
          >
            {icons[t.type]}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
