import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import { ipc } from '../utils/ipc.js';
import { useLibrary } from '../hooks/useLibrary.jsx';
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

    // Filter files by extension manually instead of relying on browser MIME types
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

    // Read metadata for each file
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

  // Remove browser-level 'accept' constraint so Windows files without mime-type mapping are not blocked
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
          className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed"
          style={{ background: 'rgba(0,0,0,0.85)', borderColor: 'var(--accent)' }}
        >
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <Upload size={48} style={{ color: 'var(--accent)' }} />
          </motion.div>
          <p className="mt-4 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Drop media here</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Supports audio and video files</p>
        </motion.div>
      )}
    </div>
  );
}
