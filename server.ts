import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Initialize Gemini AI
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || 'dummy_key_for_build', // Fallback for build phase
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/generate-caption", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY environment variable is required');
      }
      const { productName, mode, studioType } = req.body;
      const safeName = productName || 'Produk';
      
      let prompt = '';
      if (studioType === 'film') {
        prompt = `Buatkan 1 sinopsis/caption promosi singkat (ala trailer film) untuk film pendek berjudul "${safeName}". Gunakan nada yang menegangkan atau dramatis, tergantung judulnya. Sertakan hashtag #ShortFilm #Sinema.`;
      } else if (studioType === 'education') {
        prompt = `Buatkan 1 caption edukatif yang menginspirasi untuk materi/kursus berjudul "${safeName}". Gunakan nada yang profesional namun ramah. Sertakan hashtag #Edukasi #Belajar.`;
      } else if (studioType === 'ads') {
        prompt = `Buatkan 1 script copywriting iklan (Ads) hard-selling untuk produk "${safeName}". Fokus pada hook, pain points, dan Call to Action. Sertakan hashtag yang relevan.`;
      } else {
        if (mode === 'ugc') {
          prompt = `Buatkan 1 caption TikTok gaya amatir/UGC (User Generated Content) yang terlihat seperti review jujur konsumen biasa untuk produk "${safeName}". Gunakan bahasa gaul, typo sedikit tidak apa-apa, sangat natural dan terkesan 'spill' rahasia. Sertakan hashtag populer.`;
        } else {
          prompt = `Buatkan 1 caption TikTok yang sangat engaging, viral, dan persuasif bergaya kreator profesional untuk mempromosikan produk "${safeName}". Gunakan bahasa gaul Indonesia yang natural. Sertakan hashtag seperti #RacunTikTok dan hashtag produk. Jangan gunakan tanda kutip di awal/akhir kalimat.`;
        }
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          temperature: 0.8,
        }
      });

      res.json({ caption: response.text?.trim() });
    } catch (error: any) {
      console.error('Caption generation error:', error);
      const msg = error.message || String(error);
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('credits are depleted') || msg.includes('429')) {
        res.status(429).json({ error: 'Kredit API Gemini Anda telah habis. Silakan perbarui billing atau ganti API Key di Google AI Studio (Settings > API Keys).' });
      } else {
        res.status(500).json({ error: msg });
      }
    }
  });

  app.post("/api/generate-storyboard", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY environment variable is required');
      }
      
      const { 
        productName, 
        productImages, 
        modelImage, 
        shotType, 
        cameraType, 
        clothesType, 
        interaction, 
        count,
        mode,
        studioType
      } = req.body;

      const safeName = productName || 'Produk';
      const numScenes = count || 1;

      let directorContext = '';
      if (studioType === 'film') {
        directorContext = 'You are a visionary film director creating a storyboard for a cinematic short film or trailer. Focus on dramatic lighting, narrative tension, and cinematic composition.';
      } else if (studioType === 'education') {
        directorContext = 'You are an educational video producer creating a storyboard for a professional course or tutorial. Focus on clear visibility, engaging presenter framing, and clean studio lighting.';
      } else if (studioType === 'ads') {
        directorContext = 'You are a high-end commercial director creating a storyboard for a premium video ad. Focus on product hero shots, aspirational lifestyle, and high-conversion visual hooks.';
      } else {
        if (mode === 'ugc') {
          directorContext = 'You are a TikTok UGC (User Generated Content) creator making a casual, authentic, and slightly amateurish review video. Focus on shaky handheld smartphone shots, natural everyday lighting, and a highly relatable, non-staged aesthetic.';
        } else {
          directorContext = 'You are a professional commercial video director creating a storyboard for a high-quality TikTok/Reels product promotion. Focus on polished aesthetics, professional lighting, and strong product focus.';
        }
      }

      // 1. Generate Scene Descriptions and Prompts using Text Model
      const textPrompt = `${directorContext}
      
      Create a ${numScenes}-scene storyboard based on the title/subject: "${safeName}".
      
      Constraints:
      - Camera Type: ${cameraType}
      - Shot Type preference: ${shotType}
      - Clothes: ${clothesType}
      - Action/Interaction: ${interaction}

      Provide the response in JSON format. Generate an array of scene objects. Each object MUST have:
      1. sceneNumber: number
      2. description: string (A brief director's note in Indonesian, e.g. "Kamera perlahan mendekat...")
      3. prompt: string (A highly detailed English prompt for an AI Image Generator to render this exact frame. Must include photorealistic, lighting conditions, shot type, clothes, action, and the subject "${safeName}". ${mode === 'ugc' ? 'Make the prompt style amateur smartphone photo, slight motion blur, casual.' : 'Make it cinematic and high quality.'})
      4. duration: number (Estimated seconds, e.g. 2 or 3)
      `;

      const textResponse = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: textPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.INTEGER },
                description: { type: Type.STRING },
                prompt: { type: Type.STRING },
                duration: { type: Type.INTEGER }
              },
              required: ["sceneNumber", "description", "prompt", "duration"]
            }
          }
        }
      });

      const scenesText = textResponse.text || "[]";
      let scenesData: any[] = [];
      try {
        scenesData = JSON.parse(scenesText);
      } catch (e) {
        console.error("Failed to parse scenes JSON:", scenesText);
        scenesData = [];
      }

      // 2. Generate Images for each scene
      // Using Promise.all to generate images concurrently using gemini-3.1-flash-lite-image
      const imagePromises = scenesData.map(async (scene) => {
        try {
          const imagePrompt = scene.prompt;
          
          let parts: any[] = [{ text: imagePrompt }];

          // If there's a product image, we can optionally use it for image-to-image or context.
          // gemini-3.1-flash-lite-image can take text. If we want it to edit an image we pass inlineData.
          // For now, let's just pass the text prompt to generate a fresh image, as product mockups 
          // usually need to be generated cleanly unless we do a full edit flow.
          // The instructions say: "To edit images using the model, you can prompt with text, images or a combination of both."
          // But to just GENERATE an image based on the prompt:
          
          if (productImages && productImages.length > 0 && productImages[0]) {
             // We can provide the product image as context if we want.
             // But wait, the standard way to just generate an image from text is:
          }

          const imgRes = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: { parts: [{ text: imagePrompt }] },
            config: {
              // Note: responseMimeType is NOT supported for image generation models
            }
          });
          
          let imageUrl = '';
          if (imgRes.candidates && imgRes.candidates.length > 0) {
            const parts = imgRes.candidates[0].content.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData) {
                  const base64Data = part.inlineData.data;
                  imageUrl = `data:image/jpeg;base64,${base64Data}`;
                  break;
                }
              }
            }
          }
          
          // Fallback if image generation fails or returns empty
          if (!imageUrl) {
            imageUrl = 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&auto=format&fit=crop&q=80'; // Fallback mockup just in case
          }

          return {
            id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sceneNumber: scene.sceneNumber,
            description: scene.description,
            prompt: scene.prompt,
            duration: scene.duration,
            imageUrl: imageUrl
          };
        } catch (imgErr) {
          console.error(`Failed to generate image for scene ${scene.sceneNumber}:`, imgErr);
          return {
            id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sceneNumber: scene.sceneNumber,
            description: scene.description,
            prompt: scene.prompt,
            duration: scene.duration,
            imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&auto=format&fit=crop&q=80' // Fallback
          };
        }
      });

      const generatedScenes = await Promise.all(imagePromises);
      res.json({ scenes: generatedScenes });

    } catch (error: any) {
      console.error('Storyboard generation error:', error);
      const msg = error.message || String(error);
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('credits are depleted') || msg.includes('429')) {
        res.status(429).json({ error: 'Kredit API Gemini Anda telah habis. Silakan perbarui billing di Google AI Studio (Settings > API Keys).' });
      } else {
        res.status(500).json({ error: msg });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
