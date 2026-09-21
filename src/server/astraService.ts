import OpenAI from 'openai';
import { ContentOpportunity, ContentPlan, LearningPattern, MonetizationIntelligenceData } from '../types/creatorAutopilot.js';
import { FounderService } from './founderService.js';

export interface AstraResearchParams {
  niche: string;
  targetAudience?: string;
  seedTopic?: string;
  monetizationGoal?: string;
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

  public async research(params: AstraResearchParams, userId: string): Promise<ContentOpportunity[]> {
    const { openai, model, enabled } = this.getOpenAIClient();
    const niche = params.niche || 'Digital Product & AI Tools';
    const audience = params.targetAudience || 'Creators & Online Entrepreneurs';
    const seed = params.seedTopic || 'Affiliate Marketing & Monetization';

    if (!enabled || !openai) {
      throw new Error('Astra AI Engine belum aktif atau API Key belum diset. Silakan atur API Key di menu Admin Astra Settings.');
    }

    try {
      const prompt = `You are GPT Astra, the AI Content & Growth Intelligence Engine for YouTube Shorts.
Conduct deep trend research for niche: "${niche}", target audience: "${audience}", seed topic: "${seed}".
Generate 3 distinct YouTube Shorts Content Opportunities in JSON format.

Constraints:
- Use realistic probability language ("Probability High - 80% Match", "High Engagement Opportunity").
- NEVER guarantee exact viral views or revenue numbers.
- Each opportunity must contain:
  - topic
  - niche
  - hook (0-3 second hook idea)
  - angle (psychological framing)
  - targetAudience
  - titleIdeas (array of 3 punchy titles)
  - contentFormat (e.g. "Pov / Screen Demo", "AIDA Unboxing", "Talking Head + Visual B-Roll")
  - estimatedOpportunity (e.g. "Estimated Opportunity: High Virality Index")
  - monetizationAngle (e.g. "Affiliate Product Link in Bio", "Sponsorship Pitch", "Digital Course Upsell")
  - priority ("HIGH" | "MEDIUM" | "LOW")
  - source (e.g. "Astra Trend & Competitor Analysis")

Return ONLY a valid JSON array of 3 objects with those keys. No markdown codeblock wrapper if possible.`;

      // Use the model configured by Admin without forcefully mapping gpt-6-astra to gpt-4o
      const modelToUse = model || 'gpt-6-astra';

      const response = await openai.chat.completions.create({
        model: modelToUse,
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const text = response.choices[0]?.message?.content || '';
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          id: `opp-${Date.now()}-${idx}`,
          userId,
          topic: item.topic || seed,
          niche: item.niche || niche,
          hook: item.hook || '3 Detik Pertama Yang Memikat',
          angle: item.angle || 'Curiosity & Value Framing',
          targetAudience: item.targetAudience || audience,
          titleIdeas: Array.isArray(item.titleIdeas) ? item.titleIdeas : [item.topic],
          contentFormat: item.contentFormat || 'Talking Head + B-Roll',
          estimatedOpportunity: item.estimatedOpportunity || 'High Potential Reach',
          monetizationAngle: item.monetizationAngle || 'Affiliate Link / Bio',
          priority: (['HIGH', 'MEDIUM', 'LOW'].includes(item.priority) ? item.priority : 'HIGH') as 'HIGH' | 'MEDIUM' | 'LOW',
          source: item.source || 'Astra Growth Intelligence',
          createdAt: new Date().toISOString(),
        }));
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
        recommendedPublishingStrategy: 'Belum ada data histori konten untuk menganalisis Virality Loop. Silakan publikasikan Shorts terlebih dahulu.',
        updatedAt: new Date().toISOString(),
      };
    }

    const { openai, model, enabled } = this.getOpenAIClient();
    if (enabled && openai) {
      try {
        const prompt = `You are GPT Astra Virality Learning Engine. Analyze this YouTube Shorts history:
${JSON.stringify(history)}

Generate a JSON object with keys:
- winningPatterns (array of string observations)
- weakPatterns (array of string observations)
- recommendedNextTopics (array of 3 strings)
- recommendedHooks (array of 3 strings)
- recommendedPublishingStrategy (string)

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
          winningPatterns: parsed.winningPatterns || [],
          weakPatterns: parsed.weakPatterns || [],
          recommendedNextTopics: parsed.recommendedNextTopics || [],
          recommendedHooks: parsed.recommendedHooks || [],
          recommendedPublishingStrategy: parsed.recommendedPublishingStrategy || 'Gunakan jadwal konsisten.',
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
      recommendedPublishingStrategy: 'Publikasikan lebih banyak konten untuk membuka Virality Learning Loop.',
      updatedAt: new Date().toISOString(),
    };
  }

  public async analyzeMonetization(userId: string, profile: any): Promise<MonetizationIntelligenceData> {
    const subCount = profile?.subscriberCount || 0;
    const viewsCount = profile?.totalViews || profile?.viewCount || 0;

    return {
      youtubePartnerProgress: {
        subscriberCount: subCount,
        subscriberTarget: 1000,
        shortsViews: viewsCount,
        shortsViewsTarget: 10000000,
        watchHours: Math.round(viewsCount * 0.012),
        watchHoursTarget: 4000,
        isEligible: subCount >= 1000 && viewsCount >= 10000000,
      },
      affiliateOpportunities: [
        {
          title: 'NEURONA AI Studio Affiliate Program',
          category: 'Digital Product & SaaS',
          estimatedCommission: 'Komisi 40% per penjualan',
          fitScore: 'Program Resmi NEURONA',
        }
      ],
      sponsorshipOpportunities: [
        {
          brandCategory: 'Aplikasi AI & Productivity Tools',
          recommendedRate: subCount > 0 ? `Estimasi berbasis ${subCount} subscriber` : 'Hubungkan YouTube untuk melihat estimasi rate',
          pitchAngle: 'Demonstrasi workflow produktivitas instan dengan fitur nyata',
        }
      ],
      digitalProductIdeas: [
        {
          productType: 'Digital Template',
          title: 'Template Prompt YouTube Shorts High-Engagement',
          targetPrice: 'Rp 49.000',
        }
      ]
    };
  }
}

export const AstraService = new AstraServiceClass();
