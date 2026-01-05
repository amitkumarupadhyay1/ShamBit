'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fill = false,
  sizes,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Generate blur placeholder for better UX
  const generateBlurDataURL = (w: number, h: number) => {
    return `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect width="100%" height="100%" fill="url(#gradient)"/>
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#e5e7eb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f9fafb;stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>`
    ).toString('base64')}`;
  };

  if (hasError) {
    return (
      <div className={`bg-neutral-100 flex items-center justify-center ${className}`}>
        <span className="material-symbols-outlined text-neutral-400 text-2xl">image</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-100 animate-pulse flex items-center justify-center">
          <span className="material-symbols-outlined text-neutral-300 text-2xl">image</span>
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL || (width && height ? generateBlurDataURL(width, height) : undefined)}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        quality={85}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
}

// Preset configurations for common use cases
export function ProductImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={300}
      height={300}
      className={`w-full h-full object-cover ${className}`}
      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
      placeholder="blur"
    />
  );
}

export function CategoryImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={120}
      height={120}
      className={`w-full h-full object-cover ${className}`}
      sizes="(max-width: 768px) 25vw, 120px"
      placeholder="blur"
    />
  );
}

export function HeroImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={800}
      height={600}
      className={`w-full h-full object-cover ${className}`}
      sizes="(max-width: 768px) 100vw, 50vw"
      priority
      placeholder="blur"
    />
  );
}