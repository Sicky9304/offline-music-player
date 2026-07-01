import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLibrary } from '../../hooks/useLibrary.jsx';
import { ipc } from '../../utils/ipc.js';
import { useToast } from './Toast.jsx';

const SUPPORTED_EXTENSIONS = new Set([
  // Audio
  '.mp3', '.flac', '.wav', '.aac', '.m4a', '.ogg', '.opus', '.wma', '.aiff', '.ape', '.alac',
  // Video
  '.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv', '.m4v', '.ts', '.3gp', '.mpeg', '.mpg'
]);

export default function DropZone({ className = '', children }) {
  const { importDropped } = useLibrary();
  const toast = useToast();

  const onDrop = useCallback(async (allFiles) => {
    if (!allFiles?.length) return;

    const validFiles = allFiles.filter(f => {
      const ext = f.name ? f.name.substring(f.name.lastIndexOf('.')).toLowerCase() : '';
      return SUPPORTED_EXTENSIONS.has(ext);
    });

    if (!validFiles.length) {
      toast.warning('No supported media files found');
      return;
    }

    const filePaths = validFiles.map(f => f.path || f.name);
    toast.info(`Scanning ${validFiles.length} file(s)…`);

    const items = [];
    for (const fp of filePaths) {
      const meta = await ipc.media.getMetadata(fp);
      if (meta) items.push(meta);
    }

    if (items.length) {
      await importDropped(items);
      toast.success(`Added ${items.length} file(s) to library`);
    } else {
      toast.warning('Failed to extract metadata for dropped files');
    }
  }, [importDropped, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
  });

  return (
    <div {...getRootProps()} className={`relative ${className}`}>
      <input {...getInputProps()} />
      {children}

      {/* Drop overlay */}
      {isDragActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-[200] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed backdrop-blur-xl transition-all"
          style={{
            background: 'rgba(9, 9, 11, 0.85)',
            borderColor: 'var(--accent)',
            boxShadow: '0 0 40px rgba(var(--accent-hsl) / 0.25)'
          }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-lg"
          >
            <Upload size={32} style={{ color: 'var(--accent)' }} />
          </motion.div>
          <p className="mt-4 text-lg font-black font-brand text-white">Drop media here</p>
          <p className="text-xs text-zinc-400 mt-1.5 font-medium">Supports audio and video catalog formats</p>
        </motion.div>
      )}
    </div>
  );
}
