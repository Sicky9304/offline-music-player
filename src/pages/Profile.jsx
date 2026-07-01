import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Save, Cloud, WifiOff } from 'lucide-react';
import { ipc } from '../utils/ipc.js';
import { useToast } from '../components/Toast.jsx';
import { getInitials } from '../utils/formatters.js';

export default function Profile() {
  const toast = useToast();
  const [profile, setProfile]   = useState({ name: 'User', email: '', bio: '', avatar: null });
  const [form, setForm]         = useState({ name: '', email: '', bio: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await ipc.profile.get();
        if (p) {
          setProfile(p);
          setForm({ name: p.name || '', email: p.email || '', bio: p.bio || '' });
        }
      } catch (e) { console.error(e); }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await ipc.profile.update({ name: form.name, email: form.email, bio: form.bio });
      setProfile(updated);
      toast.success('Profile saved!');
    } catch (e) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async () => {
    setUploading(true);
    try {
      const result = await ipc.profile.uploadAvatar();
      if (result.ok) {
        setProfile(prev => ({ ...prev, avatar: result.avatar, avatarCloudinaryUrl: result.cloudUrl }));
        if (result.cloudUrl) toast.success('Avatar uploaded to Cloudinary');
        else toast.info('Avatar saved locally (offline)');
      } else if (result.reason !== 'cancelled') {
        toast.error('Upload failed');
      }
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <User size={22} style={{ color: 'var(--text-secondary)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>Profile</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center border-4 shadow-2xl"
                style={{ background: 'var(--accent)', borderColor: 'var(--border)', boxShadow: '0 0 30px var(--accent)44' }}
              >
                {profile.avatar
                  ? <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  : <span className="text-4xl font-bold text-white">{getInitials(profile.name)}</span>
                }
              </motion.div>
              <button
                id="upload-avatar-btn"
                onClick={handleAvatarUpload}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center border-2 shadow-lg transition-all hover:scale-105"
                style={{ background: 'var(--accent)', borderColor: 'var(--bg-primary)' }}
              >
                {uploading
                  ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" />
                  : <Camera size={16} className="text-white" />
                }
              </button>
            </div>
            <div className="text-center">
              <p className="text-xs flex items-center gap-1.5 justify-center" style={{ color: 'var(--text-muted)' }}>
                {profile.avatarCloudinaryUrl
                  ? <><Cloud size={12} className="text-blue-400" /> Synced to Cloudinary</>
                  : <><WifiOff size={12} /> Stored locally</>
                }
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Cloudinary is only used for profile images, not media files
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Display Name</label>
              <input
                id="profile-name"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-colors focus:border-[var(--accent)]"
                style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input
                id="profile-email"
                type="email"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-colors focus:border-[var(--accent)]"
                style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Bio</label>
              <textarea
                id="profile-bio"
                value={form.bio}
                onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none transition-colors focus:border-[var(--accent)]"
                style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                placeholder="A short bio…"
              />
            </div>
            <button
              id="save-profile-btn"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
            >
              {saving ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" /> : <Save size={15} />}
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
