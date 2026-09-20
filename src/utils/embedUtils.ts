export type VideoSourceType = 'youtube' | 'tiktok' | 'direct' | 'unknown';

export interface VideoInfo {
  type: VideoSourceType;
  embedUrl?: string;
  videoId?: string;
  thumbnailUrl?: string;
  originalUrl: string;
}

export function parseVideoUrl(url: string): VideoInfo {
  if (!url || typeof url !== 'string') {
    return { type: 'unknown', originalUrl: '' };
  }

  const cleanUrl = url.trim();

  // 1. Check YouTube
  // Patterns: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, youtube.com/embed/ID
  const youtubeMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/i);
  if (youtubeMatch && youtubeMatch[1]) {
    const videoId = youtubeMatch[1];
    return {
      type: 'youtube',
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      originalUrl: cleanUrl
    };
  }

  // 2. Check TikTok
  // Full video URL: tiktok.com/@user/video/1234567890123456789
  const tiktokMatch = cleanUrl.match(/\/video\/(\d+)/i) || cleanUrl.match(/\/v\/(\d+)/i);
  if (tiktokMatch && tiktokMatch[1]) {
    const videoId = tiktokMatch[1];
    return {
      type: 'tiktok',
      videoId,
      embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
      originalUrl: cleanUrl
    };
  }

  // Short TikTok link (vt.tiktok.com / vm.tiktok.com)
  if (cleanUrl.includes('tiktok.com')) {
    return {
      type: 'tiktok',
      embedUrl: cleanUrl,
      originalUrl: cleanUrl
    };
  }

  // 3. Direct video file or uploaded Firebase Storage / Cloud Run URL
  return {
    type: 'direct',
    embedUrl: cleanUrl,
    originalUrl: cleanUrl
  };
}
