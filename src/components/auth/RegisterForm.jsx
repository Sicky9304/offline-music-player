import { useState } from 'react';
import { UserPlus, KeyRound, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { ipc } from '../../utils/ipc.js';
import { useToast } from '../ui/Toast.jsx';

export default function RegisterForm({ onRegisterSuccess, onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const u = username.trim();
    if (!u || !password || !confirmPassword) {
      toast.warning('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 4) {
      toast.warning('Password must be at least 4 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await ipc.auth.register(u, password);
      if (res && res.ok) {
        toast.success('Registration successful! Please sign in.');
        onRegisterSuccess();
      } else {
        toast.error(res?.error || 'Registration failed. Try a different username.');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-black text-white font-display">Sign Up</h2>
        <p className="text-xs text-zinc-400 font-semibold">
          Create an account to unlock online streaming and Spotify search
        </p>
      </div>

      <div className="space-y-4">
        {/* Username */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <UserIcon size={16} />
          </div>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose Username"
            className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 focus:bg-white/[0.06] transition-all duration-300 font-semibold"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <KeyRound size={16} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 4 chars)"
            className="w-full pl-10 pr-10 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 focus:bg-white/[0.06] transition-all duration-300 font-semibold"
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <KeyRound size={16} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            className="w-full pl-10 pr-10 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 focus:bg-white/[0.06] transition-all duration-300 font-semibold"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-2xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-98 gradient-button flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
        ) : (
          <>
            <UserPlus size={14} /> Create Account
          </>
        )}
      </button>

      <div className="text-center pt-2">
        <p className="text-xs text-zinc-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold text-cyan-400 hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </form>
  );
}
