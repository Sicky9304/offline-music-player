import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Save, Cloud, WifiOff } from 'lucide-react';
import { useToast } from '../components/ui/Toast.jsx';
import { useProfile } from '../hooks/useProfile.jsx';
import { getInitials } from '../utils/formatters.js';
import { ipc } from '../utils/ipc.js';
import SectionHeader from '../components/ui/SectionHeader.jsx';
import GlassButton from '../components/ui/GlassButton.jsx';

export default function Profile() {
  const toast = useToast();
  const { profile, updateProfile } = useProfile();
  
  const [form, setForm] = useState({ name: '', email: '', bio: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync form values on profile load
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    const updated = await updateProfile({ name: form.name, email: form.email, bio: form.bio });
    setSaving(false);
    if (updated) {
      toast.success('Profile saved!');
    } else {
      toast.error('Failed to save profile');
    }
  };

  const handleAvatarUpload = async () => {
    setUploading(true);
    try {
      const result = await ipc.profile.uploadAvatar();
      if (result.ok) {
        // Sync custom profile state
        await updateProfile({ ...profile, avatar: result.avatar, avatarCloudinaryUrl: result.cloudUrl });
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
    <div className="flex flex-col h-full page-enter">
      {/* Header bar */}
      <div className="flex-shrink-0 px-6 py-5 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <SectionHeader
          title="Profile"
          badge="Identity"
          icon={User}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg mx-auto space-y-6">
          
          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center border-4 shadow-2xl relative"
                style={{ 
                  background: 'var(--accent)', 
                  borderColor: 'var(--glass-border)', 
                  boxShadow: '0 0 30px rgba(var(--accent-hsl) / 0.25)' 
                }}
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold font-brand text-white">{getInitials(profile.name)}</span>
                )}
              </motion.div>
              <button
                id="upload-avatar-btn"
                onClick={handleAvatarUpload}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center border-2 border-zinc-950 shadow-lg transition-all hover:scale-105 active:scale-95 bg-white text-zinc-950"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-zinc-950" />
                ) : (
                  <Camera size={16} />
                )}
              </button>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-semibold flex items-center gap-1.5 justify-center text-zinc-400">
                {profile.avatarCloudinaryUrl ? (
                  <><Cloud size={12} className="text-sky-400" /> Synced to Cloudinary</>
                ) : (
                  <><WifiOff size={12} /> Stored offline</>
                )}
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border p-5 space-y-4 glass" style={{ borderColor: 'var(--glass-border)' }}>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Display Name</label>
              <input
                id="profile-name"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="glass-input"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Email</label>
              <input
                id="profile-email"
                type="email"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="glass-input"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Bio</label>
              <textarea
                id="profile-bio"
                value={form.bio}
                onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
                className="glass-input resize-none"
                placeholder="A short biography…"
              />
            </div>
            <GlassButton
              id="save-profile-btn"
              onClick={handleSave}
              loading={saving}
              leftIcon={<Save size={14} />}
              className="px-5 py-2.5 rounded-xl text-xs bg-gradient-to-r from-violet-600 to-cyan-600 font-bold"
            >
              Save Changes
            </GlassButton>
          </div>

        </div>
      </div>
    </div>
  );
}
