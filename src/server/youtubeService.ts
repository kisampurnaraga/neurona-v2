import { YouTubeChannelInfo } from '../types/creatorAutopilot.js';

export class YouTubeService {
  /**
   * Generates Google OAuth Authorization URL for YouTube Data API v3 & YouTube Upload scopes
   */
  public static getAuthUrl(redirectUri: string, state: string): string {
    const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.partner'
    ];

    if (!clientId) {
      return '';
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Get YouTube channel status for a given user
   */
  public static async getChannelInfo(userId: string, tokens?: any): Promise<YouTubeChannelInfo> {
    if (!tokens || !tokens.access_token) {
      return {
        connected: false,
      };
    }

    try {
      // Server-side call to YouTube Data API
      const res = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!res.ok) {
        return { connected: false };
      }

      const data = await res.json();
      const channel = data.items?.[0];

      if (!channel) {
        return { connected: false };
      }

      return {
        connected: true,
        channelId: channel.id,
        title: channel.snippet?.title || 'YouTube Channel',
        customUrl: channel.snippet?.customUrl || '',
        subscriberCount: parseInt(channel.statistics?.subscriberCount || '0', 10),
        videoCount: parseInt(channel.statistics?.videoCount || '0', 10),
        viewCount: parseInt(channel.statistics?.viewCount || '0', 10),
        thumbnailUrl: channel.snippet?.thumbnails?.default?.url || '',
      };
    } catch (e) {
      console.warn('YouTube API channel fetch error:', e);
      return { connected: false };
    }
  }
}
