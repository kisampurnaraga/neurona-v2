import OpenAI from 'openai';
import { ContentOpportunity, ContentPlan, LearningPattern, MonetizationIntelligenceData, YouTubeChannelInfo } from '../types/creatorAutopilot.js';
import { FounderService } from './founderService.js';
import { YouTubeService, YouTubeTokenData } from './youtubeService.js';

export interface AstraResearchParams {
  niche: string;
  targetAudience?: string;
  seedTopic?: string;
  monetizationGoal?: string;
  tokens?: YouTubeTokenData;
}

class AstraServiceClass {
  private getOpenAIClient(): { openai: OpenAI | null; model: string; enabled: boolean } {
    const config = FounderService.getAstraConfig();
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY || '';
    const enabled = config.enabled !== false;
    const model = config.model || 'gpt-6-astra';

    if (!enabled || !apiKey) {
      return { openai: null, model, enabled: false };
    }

    try {
      const openai = new OpenAI({ apiKey });
      return { openai, model, enabled: true };
    } catch (e) {
      console.warn('Failed to initialize OpenAI client for Astra:', e);
      return { openai: null, model, enabled: false };
    }
  }

  public async research(params: AstraResearchParams, userId: string): Promise<{
    status: 'SUCCESS' | 'RESEARCH_UNAVAILABLE';
    opportunities: ContentOpportunity[];
  }> {
    const { openai, model, enabled } = this.getOpenAIClient();
    const niche = params.niche || 'Digital Product & AI Tools';
    const audience = params.targetAudience || 'Creators & Online Entrepreneurs';
    const seed = params.seedTopic || 'Affiliate Marketing & Monetization';

    if (!enabled || !openai) {
      throw new Error('Astra AI Engine belum aktif atau API Key belum diset. Silakan atur API Key di menu Admin Astra Settings.');
    }

    // Search YouTube Data API for real-time evidence
    const youtubeEvidence = await YouTubeService.searchTrendingEvidence(`${niche} ${seed}`, params.tokens);
    const timestampStr = youtubeEvidence.timestamp || new Date().toISOString();
    const isAvailable = youtubeEvidence.status === 'SUCCESS' && Boolean(youtubeEvidence.evidenceText);

    try {
      const evidenceInstruction = isAvailable
        ? `Ground truth YouTube API search evidence: "${youtubeEvidence.evidenceText}". Sample titles found: ${JSON.stringify(youtubeEvidence.sampleTitles)}. Base opportunity confidence and evidence directly on these actual search results.`
        : `YouTube Data API search evidence: UNAVAILABLE (Data penelitian tidak tersedia dari API). CRITICAL CONSTRAINT: Do NOT fabricate or hallucinate any fake video counts, fake view numbers, fake API evidence text, or fake confidence percentages. Set evidence to null and confidence to null.`;

      const prompt = `You are GPT Astra, the AI Content & Growth Intelligence Engine for YouTube Shorts.
Conduct trend research for niche: "${niche}", target audience: "${audience}", seed topic: "${seed}".
${evidenceInstruction}

Generate 3 distinct YouTube Shorts Content Opportunities in JSON format.

Constraints:
- Use realistic probability language ("Probability High - 80% Engagement Match", "High Engagement Opportunity").
- NEVER guarantee fake exact viral views or fake revenue numbers.
- Each opportunity MUST contain:
  - topic (string)
  - niche (string)
  - hook (0-3 second hook idea, string)
  - angle (psychological framing, string)
  - targetAudience (string)
  - titleIdeas (array of 3 punchy titles)
  - contentFormat (string)
  - estimatedOpportunity (string)
  - monetizationAngle (string)
  - priority ("HIGH" | "MEDIUM" | "LOW")
  - source ("YouTube Data API v3")
  - evidence (${isAvailable ? 'factual evidence string referencing YouTube search results' : 'MUST be null'})
  - confidence (${isAvailable ? 'realistic confidence string' : 'MUST be null'})

Return ONLY a valid JSON array of 3 objects with those exact keys.`;

      const response = await openai.chat.completions.create({
        model: model || 'gpt-6-astra',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const text = response.choices[0]?.message?.content || '';
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);

      if (Array.isArray(parsed) && parsed.length > 0) {
        const opportunities: ContentOpportunity[] = parsed.map((item, idx) => ({
          id: `opp-${Date.now()}-${idx}`,
          userId,
          topic: item.topic || seed,
          niche: item.niche || niche,
          hook: item.hook || '3 Detik Pertama Scroll Stopper',
          angle: item.angle || 'Curiosity & Value Framing',
          targetAudience: item.targetAudience || audience,
          titleIdeas: Array.isArray(item.titleIdeas) ? item.titleIdeas : [item.topic],
          contentFormat: item.contentFormat || 'Talking Head + B-Roll',
          estimatedOpportunity: item.estimatedOpportunity || 'High Potential Reach',
          monetizationAngle: item.monetizationAngle || 'Affiliate Link / Description',
          priority: (['HIGH', 'MEDIUM', 'LOW'].includes(item.priority) ? item.priority : 'HIGH') as 'HIGH' | 'MEDIUM' | 'LOW',
          source: 'YouTube Data API v3',
          status: isAvailable ? 'SUCCESS' : 'RESEARCH_UNAVAILABLE',
          evidence: isAvailable ? (item.evidence || youtubeEvidence.evidenceText) : null,
          timestamp: timestampStr,
          confidence: isAvailable ? (item.confidence || 'Analisis Berdasarkan Data API') : null,
          createdAt: timestampStr,
        }));

        return {
          status: isAvailable ? 'SUCCESS' : 'RESEARCH_UNAVAILABLE',
          opportunities,
        };
      }

      throw new Error('Respon dari Astra AI tidak sesuai format JSON.');
    } catch (err: any) {
      console.error('Astra OpenAI research error:', err);
      throw new Error(err.message || 'Gagal memproses Astra Research.');
    }
  }

  public async generateContentPlan(opportunity: Partial<ContentOpportunity>, userId: string): Promise<ContentPlan> {
    const { openai, model, enabled } = this.getOpenAIClient();
    const topic = opportunity.topic || 'Konten Viral YouTube Shorts';
    const hook = opportunity.hook || 'Gunakan Hook 3 Detik Scroll Stopper';
    const niche = opportunity.niche || 'Umum';

    if (!enabled || !openai) {
      throw new Error('Astra AI Engine belum aktif atau API Key belum diset. Silakan atur API Key di menu Admin Astra Settings.');
    }

    try {
      const prompt = `You are GPT Astra, AI Content Strategist. Create a complete YouTube Shorts Content Plan based on this opportunity:
Topic: ${topic}
Hook: ${hook}
Niche: ${niche}

Generate JSON with fields:
- title
- hook0to3s
- scriptDirection (detailed 30-60 sec script outline)
- cta (clear call to action)
- description (optimized for YouTube Shorts SEO)
- hashtags (array of 5 hashtags with #)
- contentAngle
- storyboardBrief (brief prompt to feed into Storyboard Engine)
- productionInstructions (camera type, aspect ratio 9:16, audio style)

Return ONLY JSON object.`;

      const response = await openai.chat.completions.create({
        model: model || 'gpt-6-astra',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const text = response.choices[0]?.message?.content || '';
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);

      return {
        id: `plan-${Date.now()}`,
        userId,
        opportunityId: opportunity.id,
        title: parsed.title || topic,
        hook0to3s: parsed.hook0to3s || hook,
        scriptDirection: parsed.scriptDirection || '0-3s: Hook visual, 3-20s: Penjelasan masalah, 20-50s: Solusi praktis, 50-60s: CTA.',
        cta: parsed.cta || 'Klik link di bio / deskripsi untuk dapatkan panduan lengkap!',
        description: parsed.description || `${topic} #Shorts #${niche.replace(/\s+/g, '')}`,
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['#Shorts', '#CreatorAutopilot', '#AstraAI'],
        contentAngle: parsed.contentAngle || opportunity.angle || 'Informative & Actionable',
        storyboardBrief: parsed.storyboardBrief || `Visual sinematik 9:16 tentang ${topic}. Frame 1: Hook dramatis. Frame 2: Demonstrasi produk/solusi. Frame 3: CTA penutup.`,
        productionInstructions: parsed.productionInstructions || 'Aspect Ratio 9:16, Vertical Format, High Dynamic Range, Upbeat Voiceover BGM.',
        status: 'PLANNED',
        createdAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('Astra Content Plan OpenAI error:', err);
      throw new Error(err.message || 'Gagal menghasilkan Content Plan.');
    }
  }

  public async analyzePerformance(userId: string, history: any[]): Promise<LearningPattern> {
    if (!history || history.length === 0) {
      return {
        winningPatterns: [],
        weakPatterns: [],
        recommendedNextTopics: [],
        recommendedHooks: [],
        recommendedPublishingStrategy: 'Belum ada data histori konten publikasi untuk menganalisis Virality Loop. Silakan publikasikan Shorts terlebih dahulu.',
        updatedAt: new Date().toISOString(),
      };
    }

    const { openai, model, enabled } = this.getOpenAIClient();
    if (enabled && openai) {
      try {
        const prompt = `You are GPT Astra Virality Learning Engine. Analyze this ACTUAL published YouTube Shorts performance history:
${JSON.stringify(history)}

Generate a JSON object with keys:
- winningPatterns (array of string observations based strictly on higher views/likes/retention)
- weakPatterns (array of string observations based strictly on lower performance)
- recommendedNextTopics (array of 3 strings for next content)
- recommendedHooks (array of 3 strings for next hooks)
- recommendedPublishingStrategy (string analysis based strictly on actual data)

Return ONLY JSON object.`;

        const response = await openai.chat.completions.create({
          model: model || 'gpt-6-astra',
          messages: [{ role: 'system', content: prompt }],
          temperature: 0.7,
          max_tokens: 1000,
        });

        const text = response.choices[0]?.message?.content || '';
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanText);

        return {
          winningPatterns: Array.isArray(parsed.winningPatterns) ? parsed.winningPatterns : [],
          weakPatterns: Array.isArray(parsed.weakPatterns) ? parsed.weakPatterns : [],
          recommendedNextTopics: Array.isArray(parsed.recommendedNextTopics) ? parsed.recommendedNextTopics : [],
          recommendedHooks: Array.isArray(parsed.recommendedHooks) ? parsed.recommendedHooks : [],
          recommendedPublishingStrategy: parsed.recommendedPublishingStrategy || 'Gunakan analisis performa riil.',
          updatedAt: new Date().toISOString(),
        };
      } catch (e) {
        console.warn('Learning analysis API error:', e);
      }
    }

    return {
      winningPatterns: [],
      weakPatterns: [],
      recommendedNextTopics: [],
      recommendedHooks: [],
      recommendedPublishingStrategy: 'Aktifkan Astra AI di Admin Settings untuk rekomendasi strategi mendalam.',
      updatedAt: new Date().toISOString(),
    };
  }

  public async analyzeMonetization(userId: string, channelInfo: YouTubeChannelInfo): Promise<MonetizationIntelligenceData> {
    const isConnected = Boolean(channelInfo.connected);
    const subCount = isConnected ? (channelInfo.subscriberCount || 0) : 0;
    const viewsCount = isConnected ? (channelInfo.viewCount || 0) : 0;

    const { openai, model, enabled } = this.getOpenAIClient();

    let affiliateOpportunities: Array<{ title: string; category: string; estimatedCommission: string; fitScore: string }> = [];
    let sponsorshipOpportunities: Array<{ brandCategory: string; recommendedRate: string; pitchAngle: string }> = [];
    let digitalProductIdeas: Array<{ productType: string; title: string; targetPrice: string }> = [];

    if (isConnected && enabled && openai) {
      try {
        const prompt = `You are GPT Astra Monetization Engine. Analyze YouTube Channel stats:
Subscriber Count: ${subCount}
Total Views: ${viewsCount}
Channel Title: ${channelInfo.title || 'N/A'}

Generate JSON with:
- affiliateOpportunities: array of objects { title, category, estimatedCommission, fitScore }
- sponsorshipOpportunities: array of objects { brandCategory, recommendedRate, pitchAngle }
- digitalProductIdeas: array of objects { productType, title, targetPrice }

Base rate recommendations explicitly as "ESTIMATE" or "RECOMMENDATION". Return ONLY JSON object.`;

        const response = await openai.chat.completions.create({
          model: model || 'gpt-6-astra',
          messages: [{ role: 'system', content: prompt }],
          temperature: 0.7,
          max_tokens: 1000,
        });

        const text = response.choices[0]?.message?.content || '';
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanText);

        if (parsed.affiliateOpportunities) affiliateOpportunities = parsed.affiliateOpportunities;
        if (parsed.sponsorshipOpportunities) sponsorshipOpportunities = parsed.sponsorshipOpportunities;
        if (parsed.digitalProductIdeas) digitalProductIdeas = parsed.digitalProductIdeas;
      } catch (e) {
        console.warn('Monetization analysis AI error:', e);
      }
    }

    return {
      youtubePartnerProgress: {
        subscriberCount: subCount,
        subscriberTarget: 1000,
        shortsViews: null, // Metric Shorts 90 hari tidak tersedia dari endpoint channel stats YouTube Data API
        shortsViewsTarget: 10000000,
        watchHours: null, // Metric watch hours 365 hari tidak tersedia dari endpoint channel stats YouTube Data API (no synthetic formula)
        watchHoursTarget: 4000,
        totalChannelViews: viewsCount, // REAL ACTUAL DATA directly from YouTube API
        isEligible: isConnected && subCount >= 1000,
        shortsViewsStatus: 'N/A / Data tidak tersedia',
        watchHoursStatus: 'N/A / Data tidak tersedia',
      },
      affiliateOpportunities,
      sponsorshipOpportunities,
      digitalProductIdeas,
    };
  }
}

export const AstraService = new AstraServiceClass();

