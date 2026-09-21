export type CreatorEntitlementStatus = 'LOCKED' | 'ACTIVE' | 'EXPIRED';

export interface CreatorProfile {
  userId: string;
  entitlementStatus: CreatorEntitlementStatus;
  channelName?: string;
  channelId?: string;
  niche?: string;
  targetAudience?: string;
  subscriberCount?: number;
  totalViews?: number;
  totalShorts?: number;
  monetized?: boolean;
  youtubeConnected?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type OpportunityPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ContentOpportunity {
  id: string;
  userId: string;
  topic: string;
  niche: string;
  hook: string;
  angle: string;
  targetAudience: string;
  titleIdeas: string[];
  contentFormat: string;
  estimatedOpportunity: string; // e.g. "Probability High - 85% Engagement Match"
  monetizationAngle: string;
  priority: OpportunityPriority;
  source: string; // e.g. "Astra Trend Intelligence"
  createdAt: string;
}

export interface ContentPlan {
  id: string;
  userId: string;
  opportunityId?: string;
  title: string;
  hook0to3s: string;
  scriptDirection: string;
  cta: string;
  description: string;
  hashtags: string[];
  contentAngle: string;
  storyboardBrief: string;
  productionInstructions: string;
  status: 'PLANNED' | 'SENT_TO_WORKSPACE' | 'IN_PRODUCTION' | 'PUBLISHED';
  createdAt: string;
  updatedAt?: string;
}

export interface PublishedContent {
  id: string;
  userId: string;
  planId?: string;
  title: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  status: 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
  scheduledTime?: string;
  publishedTime?: string;
  views: number;
  likes: number;
  comments: number;
  subscribersGained: number;
  retentionRate?: number; // e.g. 78 (%)
  topic: string;
  hook: string;
  durationSeconds: number;
  cta: string;
  contentFormat: string;
  createdAt: string;
}

export interface LearningPattern {
  winningPatterns: string[];
  weakPatterns: string[];
  recommendedNextTopics: string[];
  recommendedHooks: string[];
  recommendedPublishingStrategy: string;
  updatedAt: string;
}

export interface MonetizationIntelligenceData {
  youtubePartnerProgress: {
    subscriberCount: number;
    subscriberTarget: number; // 1000
    shortsViews: number;
    shortsViewsTarget: number; // 10,000,000
    watchHours: number;
    watchHoursTarget: number; // 4000
    isEligible: boolean;
  };
  affiliateOpportunities: Array<{
    title: string;
    category: string;
    estimatedCommission: string;
    fitScore: string;
  }>;
  sponsorshipOpportunities: Array<{
    brandCategory: string;
    recommendedRate: string;
    pitchAngle: string;
  }>;
  digitalProductIdeas: Array<{
    productType: string;
    title: string;
    targetPrice: string;
  }>;
}

export interface AstraConfig {
  enabled: boolean;
  model: string; // e.g. "gpt-6-astra", "gpt-4o", "gpt-4o-mini"
  apiKey: string; // Masked on client GET
  maxTokens: number;
  monthlyUsageLimit: number;
  hasApiKey?: boolean;
}

export interface AstraUsageRecord {
  id: string;
  userId: string;
  userEmail?: string;
  feature: string;
  requestCount: number;
  estimatedTokens: number;
  timestamp: string;
}

export type AstraUsageLog = AstraUsageRecord;

export interface YouTubeChannelInfo {
  connected: boolean;
  channelId?: string;
  title?: string;
  customUrl?: string;
  subscriberCount?: number;
  videoCount?: number;
  viewCount?: number;
  thumbnailUrl?: string;
}
