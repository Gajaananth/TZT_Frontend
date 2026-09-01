import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedImageProps {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fallbackText?: string;
  aspectRatio?: 'square' | 'portrait' | 'card';
  showWatermark?: boolean;
}

export const ProtectedImage: React.FC<ProtectedImageProps> = ({
  src,
  alt = 'Profile Photo',
  className = '',
  fallbackText = '?',
  aspectRatio = 'square',
  showWatermark = true,
}) => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const roleName = user?.userRoles?.[0]?.role?.name || '';
  const isAdminOrSuperAdmin = roleName === 'Admin' || roleName === 'SuperAdmin';

  // Draw image to Canvas for anti-scraping / anti-download protection for non-admins
  useEffect(() => {
    if (!src) {
      setLoadError(true);
      return;
    }

    setLoadError(false);
    setImageLoaded(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.naturalWidth || 400;
      canvas.height = img.naturalHeight || 400;

      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Add subtle watermark pattern if not admin
      if (!isAdminOrSuperAdmin && showWatermark) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.font = `bold ${Math.max(14, Math.floor(canvas.width / 18))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Repeated subtle diagonal security stamps
        const stepY = canvas.height / 3;
        for (let y = stepY / 2; y < canvas.height; y += stepY) {
          ctx.fillText('TZIT SECURE ID', canvas.width / 2, y);
        }
        ctx.restore();
      }

      setImageLoaded(true);
    };

    img.onerror = () => {
      setLoadError(true);
    };
  }, [src, isAdminOrSuperAdmin, showWatermark]);

  // Global deterrents: Prevent printscreen/ctrl+s/ctrl+p when hovering over protected images
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isAdminOrSuperAdmin) return;
    if (
      (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'c')) ||
      e.key === 'PrintScreen'
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isAdminOrSuperAdmin) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!isAdminOrSuperAdmin) {
      e.preventDefault();
    }
  };

  const aspectClass =
    aspectRatio === 'portrait'
      ? 'aspect-[3/4]'
      : aspectRatio === 'card'
      ? 'aspect-[4/5]'
      : 'aspect-square';

  if (!src || loadError) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 font-bold border border-indigo-500/30 select-none ${aspectClass} ${className}`}
      >
        <span className="text-2xl">{fallbackText}</span>
      </div>
    );
  }

  return (
    <div
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="img"
      aria-label={alt}
      title={alt}
      className={`relative overflow-hidden select-none outline-none group ${aspectClass} ${className}`}
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {/* Canvas-rendered image (renders without accessible DOM <img> tag for copy-protection) */}
      <canvas
        ref={canvasRef}
        className={`h-full w-full object-cover transition-all duration-200 pointer-events-none ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          filter: !isAdminOrSuperAdmin ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' : 'none',
        }}
      />

      {/* Loading Skeleton */}
      {!imageLoaded && !loadError && (
        <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-700/80" />
      )}

      {/* Anti-Snip / Anti-Download Interactive Shield Overlay for Non-Admins */}
      {!isAdminOrSuperAdmin && (
        <div
          className="absolute inset-0 z-20 cursor-default bg-transparent"
          title="Protected Identity Photo"
          onContextMenu={(e) => e.preventDefault()}
        />
      )}

      {/* Admin indicator tag */}
      {isAdminOrSuperAdmin && (
        <div className="absolute top-1 right-1 z-30 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 backdrop-blur-sm">
          Admin View
        </div>
      )}
    </div>
  );
};
