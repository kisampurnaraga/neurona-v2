import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'ai-studio-bd97f99d-b1b8-4902-ac5c-be804aaceda1';
const FIREBASE_STORAGE_BUCKET = process.env.VITE_FIREBASE_STORAGE_BUCKET || `${FIREBASE_PROJECT_ID}.appspot.com`;

// Initialize Firebase Admin SDK safely
if (!getApps().length) {
  try {
    initializeApp({
      projectId: FIREBASE_PROJECT_ID,
      storageBucket: FIREBASE_STORAGE_BUCKET
    });
  } catch (e) {
    initializeApp({
      projectId: FIREBASE_PROJECT_ID,
      storageBucket: FIREBASE_STORAGE_BUCKET
    });
  }
}

// Middleware to verify Firebase ID Token server-side
async function verifyFirebaseToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization Bearer Token' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    (req as any).user = decodedToken;
    next();
  } catch (error: any) {
    console.error('Firebase Token verification failed:', error.message);
    return res.status(403).json({ error: 'Forbidden: Invalid or expired Firebase ID Token' });
  }
}

// Middleware to verify Admin Role server-side
async function verifyAdminToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  await verifyFirebaseToken(req, res, async () => {
    const user = (req as any).user;
    const email = user?.email || '';
    const isHardcodedAdmin = email === 'ia.asep12@gmail.com' || email === 'admin@neuronan.com';
    const hasAdminClaim = user?.admin === true || user?.role === 'admin';

    if (isHardcodedAdmin || hasAdminClaim) {
      return next();
    }

    // Secondary check: verify role directly in Firestore users collection
    try {
      const db = getFirestore();
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists && userDoc.data()?.role === 'admin') {
        return next();
      }
    } catch (e) {
      console.warn('Admin firestore check error:', e);
    }

    return res.status(403).json({ error: 'Forbidden: Requiring Administrator privilege' });
  });
}

// Helper: Fail-safe Server Price Calculation
async function getServerValidatedPrice(): Promise<{ validPrice: number; isFlashSale: boolean }> {
  const DEFAULT_NORMAL_PRICE = 499000;
  const DEFAULT_PROMO_PRICE = 99000;

  try {
    const db = getFirestore();
    const priceDoc = await db.collection('settings').doc('price').get();

    if (!priceDoc.exists) {
      return { validPrice: DEFAULT_NORMAL_PRICE, isFlashSale: false };
    }

    const data = priceDoc.data();
    const normalPrice = typeof data?.normalPrice === 'number' && data.normalPrice > 0 ? data.normalPrice : DEFAULT_NORMAL_PRICE;
    const promoPrice = typeof data?.promoPrice === 'number' && data.promoPrice > 0 ? data.promoPrice : DEFAULT_PROMO_PRICE;
    const flashSaleEnabled = data?.flashSaleEnabled === true;
    const endTimeRaw = data?.endTime;

    // Check endTime presence (non-null, non-empty string)
    const hasEndTime = endTimeRaw !== null && endTimeRaw !== undefined && String(endTimeRaw).trim() !== '';
    if (!hasEndTime) {
      // Never consider flash sale active without endTime!
      return { validPrice: normalPrice, isFlashSale: false };
    }

    const endTimeMs = new Date(endTimeRaw).getTime();
    const isEndTimeValid = !isNaN(endTimeMs);
    const isEndTimeInFuture = isEndTimeValid && endTimeMs > Date.now();

    const isFlashSaleActive = flashSaleEnabled && hasEndTime && isEndTimeInFuture;

    return {
      validPrice: isFlashSaleActive ? promoPrice : normalPrice,
      isFlashSale: isFlashSaleActive
    };
  } catch (err) {
    console.error('getServerValidatedPrice Firestore error:', err);
    // CRITICAL: On Firestore read error, NEVER fallback to promo price! Fail-safe to normalPrice.
    return { validPrice: DEFAULT_NORMAL_PRICE, isFlashSale: false };
  }
}

const ALLOWED_SHOWCASE_MIMES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov'
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '150mb' }));
  app.use(express.urlencoded({ extended: true, limit: '150mb' }));

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

  // Protected Payment Price Validation Endpoint (Anti-price manipulation)
  app.post("/api/checkout/validate-price", verifyFirebaseToken, async (req, res) => {
    try {
      const priceResult = await getServerValidatedPrice();
      res.json({
        validPrice: priceResult.validPrice,
        isFlashSale: priceResult.isFlashSale,
        currency: 'IDR',
        productName: 'Akses Lifetime Storyboard AI (5 Studio)'
      });
    } catch (err: any) {
      res.json({
        validPrice: 499000,
        isFlashSale: false,
        currency: 'IDR',
        productName: 'Akses Lifetime Storyboard AI (5 Studio)'
      });
    }
  });

  // Protected Showcase File Upload Endpoint (Firebase Admin Storage production upload)
  app.post("/api/upload-showcase", verifyAdminToken, async (req, res) => {
    try {
      const { base64Data, contentType } = req.body;
      if (!base64Data) {
        return res.status(400).json({ error: "base64Data is required" });
      }

      // 1. Validasi MIME type wajib ada & termasuk daftar yang diizinkan
      if (!contentType || typeof contentType !== 'string' || !contentType.trim()) {
        return res.status(400).json({ error: "Missing or empty contentType (MIME type)" });
      }

      const cleanMime = contentType.trim().toLowerCase();
      const ext = ALLOWED_SHOWCASE_MIMES[cleanMime];

      if (!ext) {
        return res.status(400).json({ 
          error: `Unsupported file type '${contentType}'. Allowed types: image/jpeg, image/png, image/webp, image/gif, video/mp4, video/webm, video/quicktime` 
        });
      }

      // 2. Decode base64 payload
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      // 3. Size limit <= 50MB
      if (buffer.length > 50 * 1024 * 1024) {
        return res.status(400).json({ error: "File size exceeds 50MB limit." });
      }

      // 4. Generate random filename pada server (tanpa mengandalkan extension/nama dari user)
      const randomHash = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      const safeFilename = `showcase-${randomHash}${ext}`;
      const storagePath = `showcases/${safeFilename}`;

      // 5. Upload ke Firebase Storage via Firebase Admin Storage SDK
      const bucket = getStorage().bucket(FIREBASE_STORAGE_BUCKET);
      const fileRef = bucket.file(storagePath);

      await fileRef.save(buffer, {
        metadata: {
          contentType: cleanMime,
        },
        public: true,
      });

      try {
        await fileRef.makePublic();
      } catch (e) {
        console.warn("fileRef.makePublic note:", e);
      }

      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

      res.json({ url: publicUrl, filename: safeFilename, path: storagePath });
    } catch (error: any) {
      console.error("Upload showcase error:", error);
      res.status(500).json({ error: error.message || "Failed to upload showcase file to Firebase Storage" });
    }
  });

  // Protected Showcase File Deletion Endpoint (Firebase Admin Storage)
  app.delete("/api/delete-showcase-file", verifyAdminToken, async (req, res) => {
    try {
      const { fileUrl } = req.body;
      if (fileUrl && typeof fileUrl === 'string') {
        let fileName = '';
        if (fileUrl.includes('/showcases/')) {
          const parts = fileUrl.split('/showcases/');
          fileName = parts[parts.length - 1].split('?')[0];
        } else if (fileUrl.includes('showcases%2F')) {
          const parts = fileUrl.split('showcases%2F');
          fileName = parts[parts.length - 1].split('?')[0];
        }

        if (fileName) {
          const decodedFileName = decodeURIComponent(fileName);
          const bucket = getStorage().bucket(FIREBASE_STORAGE_BUCKET);
          await bucket.file(`showcases/${decodedFileName}`).delete().catch(() => {});
        }
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete file from Firebase Storage" });
    }
  });

  // Protected Server-Side Referral Creation Endpoint (Anti-commission manipulation)
  app.post("/api/affiliates/create-referral", verifyFirebaseToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const { refCode, buyerName, buyerEmail } = req.body;

      if (!refCode) {
        return res.status(400).json({ error: "Referral code is required" });
      }

      const priceResult = await getServerValidatedPrice();
      const serverProductPrice = priceResult.validPrice;
      const db = getFirestore();

      // Fixed Server Commission Rate: 40%
      const serverCommissionRate = 40;
      const serverCommissionAmount = Math.round((serverProductPrice * serverCommissionRate) / 100);

      // Find affiliate record server-side
      const affSnap = await db.collection('affiliates').where('referralCode', '==', refCode.toUpperCase()).get();
      if (affSnap.empty) {
        return res.status(404).json({ error: "Affiliate referral code not found" });
      }

      const affDoc = affSnap.docs[0];
      const affData = affDoc.data();

      const referralRef = db.collection('affiliate_referrals').doc();
      const newReferral = {
        id: referralRef.id,
        affiliateId: affData.userId || affDoc.id,
        affiliateCode: refCode.toUpperCase(),
        buyerUserId: user.uid,
        buyerId: user.uid,
        buyerName: buyerName || user.name || 'User',
        buyerEmail: buyerEmail || user.email || '',
        productPrice: serverProductPrice,
        commissionRate: serverCommissionRate,
        commissionAmount: serverCommissionAmount,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await referralRef.set(newReferral);

      // Update affiliate stats
      const currentPending = affData.pendingEarnings || 0;
      const currentClicks = affData.totalClicks || 0;
      await affDoc.ref.update({
        pendingEarnings: currentPending + serverCommissionAmount,
        totalClicks: currentClicks + 1
      });

      res.json({ success: true, referral: newReferral });
    } catch (e: any) {
      console.error("Create referral error:", e);
      res.status(500).json({ error: e.message || "Failed to create referral" });
    }
  });

  // Protected Video Metadata Endpoint
  app.get("/api/video-metadata", verifyFirebaseToken, async (req, res) => {
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

  app.post("/api/generate-caption", verifyFirebaseToken, async (req, res) => {
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

  app.post("/api/generate-storyboard", verifyFirebaseToken, async (req, res) => {
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
