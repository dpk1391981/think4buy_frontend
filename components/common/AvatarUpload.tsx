'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import OptimizedImage from '@/components/common/OptimizedImage';
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface AvatarUploadProps {
  size?: number; // diameter in px, default 80
  onSuccess?: (avatarUrl: string) => void;
}

export default function AvatarUpload({ size = 80, onSuccess }: AvatarUploadProps) {
  const { user, refresh } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // For agents: show pendingAvatar (uploaded but awaiting admin approval) as the display src
  // For others: approved avatar is used immediately
  const avatarSrc = preview || user?.avatar || user?.pendingAvatar || null;
  const isPending = !preview && !user?.avatar && !!user?.pendingAvatar;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError('Image must be under 3 MB'); return; }
    setError('');
    // Instant local preview
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const res = await authApi.uploadAvatar(file);
      await refresh();
      onSuccess?.(res.data?.avatar || '');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Upload failed. Please try again.');
      setPreview(null);
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative group focus:outline-none"
        style={{ width: size, height: size }}
        aria-label="Change profile photo"
      >
        {/* Avatar circle */}
        <div
          className="relative w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold overflow-hidden ring-4 ring-white shadow-lg"
          style={{ fontSize: size * 0.28 }}
        >
          {avatarSrc ? (
            <OptimizedImage
              src={avatarSrc}
              alt={user?.name || 'Avatar'}
              fill
              className="object-cover"
              sizes={`${size}px`}
              priority
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* Camera overlay */}
        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
          {uploading ? (
            <Loader2 className="text-white animate-spin" style={{ width: size * 0.3, height: size * 0.3 }} />
          ) : (
            <Camera className="text-white" style={{ width: size * 0.3, height: size * 0.3 }} />
          )}
        </div>

        {/* Small camera badge (always visible) */}
        <span className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
          <Camera className="w-3.5 h-3.5 text-white" />
        </span>
      </button>

      {isPending
        ? <p className="text-xs text-amber-600 text-center max-w-[160px]">⏳ Pending admin approval</p>
        : <p className="text-xs text-gray-400">Tap to change photo</p>
      }

      {error && (
        <p className="text-xs text-red-500 text-center max-w-[160px]">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
