import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm.jsx';
import RegisterForm from './RegisterForm.jsx';
import { Disc } from 'lucide-react';

export default function AuthContainer({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 select-none">
      <div className="relative w-full max-w-[440px] overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.03] p-8 md:p-10 backdrop-blur-3xl shadow-2xl">
        
        {/* Glowing accents */}
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />

        {/* Decorative spinning vinyl disc */}
        <div className="flex justify-center mb-6 relative z-10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center border border-white/10 shadow-lg shadow-black/50 relative overflow-hidden group">
            <div className="absolute inset-1 rounded-full border border-zinc-700/50 border-dashed animate-spin-slow" />
            <Disc className="text-cyan-400 group-hover:scale-110 transition-transform duration-500" size={24} />
          </div>
        </div>

        {/* Animated toggle forms */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
              >
                <LoginForm
                  onSuccess={onLoginSuccess}
                  onSwitchToRegister={() => setIsLogin(false)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="register-form"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
              >
                <RegisterForm
                  onRegisterSuccess={() => setIsLogin(true)}
                  onSwitchToLogin={() => setIsLogin(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
