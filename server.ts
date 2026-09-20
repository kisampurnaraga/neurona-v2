import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '150mb' }));
  app.use(express.urlencoded({ extended: true, limit: '150mb' }));

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

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

  // Showcase File Upload Endpoint (fail-safe for Firebase Storage unauthorized errors)
  app.post("/api/upload-showcase", async (req, res) => {
    try {
      const { filename, base64Data, contentType } = req.body;
      if (!base64Data || !filename) {
        return res.status(400).json({ error: "Filename and base64Data are required" });
      }

      const ext = path.extname(filename) || '.mp4';
      const safeFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
      const filePath = path.join(uploadsDir, safeFilename);

      // Clean base64 header if present (e.g. data:video/mp4;base64,...)
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      await fs.promises.writeFile(filePath, buffer);

      const fileUrl = `/uploads/${safeFilename}`;
      res.json({ url: fileUrl, filename: safeFilename });
    } catch (error: any) {
      console.error("Upload showcase error:", error);
      res.status(500).json({ error: error.message || "Failed to upload showcase file" });
    }
  });

  app.delete("/api/delete-showcase-file", async (req, res) => {
    try {
      const { fileUrl } = req.body;
      if (fileUrl && typeof fileUrl === 'string' && fileUrl.startsWith('/uploads/')) {
        const filename = path.basename(fileUrl);
        const filePath = path.join(uploadsDir, filename);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath).catch(() => {});
        }
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete file" });
    }
  });

  // Fetch video metadata (e.g. TikTok oEmbed thumbnail)
  app.get("/api/video-metadata", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      if (url.includes("tiktok.com")) {
        try {
          const oembedRes = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });
          if (oembedRes.ok) {
            const data: any = await oembedRes.json();
            return res.json({
              thumbnailUrl: data.thumbnail_url || '',
              title: data.title || '',
              author: data.author_name || ''
            });
          }
        } catch (err) {
          console.warn("TikTok oembed fetch error:", err);
        }
      }

      res.json({ thumbnailUrl: '' });
    } catch (e: any) {
      res.json({ thumbnailUrl: '' });
    }
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
        prompt = `Buatkan 1 sinopsis/caption promosi singkat (ala trailer film bioskop) untuk film berjudul "${safeName}". Gunakan nada yang menegangkan, epik, atau dramatis. Sertakan hashtag #ShortFilm #Sinema #FilmIndo.`;
      } else if (studioType === 'animasi') {
        prompt = `Buatkan 1 caption cerita animasi atau kartun yang seru dan menggemaskan untuk animasi berjudul "${safeName}". Gunakan bahasa yang imajinatif dan menarik untuk penonton keluarga/anak muda. Sertakan hashtag #Animasi #3DAnimation #Kartun.`;
      } else if (studioType === 'edukasi') {
        prompt = `Buatkan 1 caption edukasi micro-learning yang ringkas, berbobot, dan menginspirasi untuk topik "${safeName}". Berikan 3 poin intisari singkat. Sertakan hashtag #Edukasi #Belajar #TipsBerguna.`;
      } else if (studioType === 'podcast') {
        prompt = `Buatkan 1 caption cuplikan podcast/talkshow yang memancing rasa penasaran untuk episode "${safeName}". Sorot kutipan (quote) menarik dari dialog. Sertakan hashtag #Podcast #Talkshow #Inspirasi.`;
      } else {
        if (mode === 'ugc') {
          prompt = `Buatkan 1 caption TikTok gaya amatir/UGC (User Generated Content) yang terlihat seperti review jujur konsumen biasa untuk produk "${safeName}". Gunakan bahasa gaul, typo sedikit tidak apa-apa, sangat natural dan terkesan 'spill' rahasia. Sertakan hashtag populer #RacunTikTok #SpillProduk.`;
        } else {
          prompt = `Buatkan 1 caption TikTok Shop / Affiliate yang sangat engaging, viral, dan persuasif untuk mempromosikan produk "${safeName}". Gunakan hook mematikan dan Call To Action beli sekarang di keranjang kuning. Sertakan hashtag #RacunTikTok #AffiliateTikTok.`;
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
        directorContext = 'You are a visionary Hollywood cinematic director creating a storyboard for an 8K widescreen movie or dramatic short film. Focus on 21:9 or 16:9 anamorphic framing, intense contrast lighting, high cinematic stakes, and Hollywood camera motion.';
      } else if (studioType === 'animasi') {
        directorContext = 'You are an acclaimed 3D/2D animation director (Pixar/Disney/Anime style) creating a character storyboard. Focus on consistent character appeal, vibrant expressive lighting, whimsical fantasy or playful cartoon elements, and clear narrative beats.';
      } else if (studioType === 'edukasi') {
        directorContext = 'You are an elite educational video producer creating a storyboard for a high-retention tutorial or micro-learning explainer. Focus on clear presenter visual aids, engaging graphic infography, step-by-step logic, and bright, clean studio lighting.';
      } else if (studioType === 'podcast') {
        directorContext = 'You are an experienced talkshow and podcast director creating a multi-camera storyboard for a deep conversation. Focus on dynamic multi-angle cuts (Host Close-Up, Guest Close-Up, Wide Studio Shot), warm cozy acoustic studio backdrop, Shure SM7B microphones, and emotionally resonant facial expressions.';
      } else {
        // affiliate & ecommerce default
        if (mode === 'ugc') {
          directorContext = 'You are a viral TikTok UGC (User Generated Content) affiliate creator making a casual, authentic, and unfiltered review video. Focus on genuine smartphone camera aesthetics, natural bedroom/office lighting, real-life unboxing, and an irresistibly relatable problem-to-solution hook.';
        } else {
          directorContext = 'You are a professional commercial e-commerce video director creating a high-converting storyboard for TikTok Shop & Shopee Affiliate. Focus on a 3-second scroll-stopping visual hook, dramatic product macro shots, sparkling highlights, and irresistible Call to Action.';
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
