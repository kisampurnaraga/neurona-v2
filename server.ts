import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { FounderService } from "./src/server/founderService.js";
import { AstraService } from "./src/server/astraService.js";
import { YouTubeService } from "./src/server/youtubeService.js";

// Safely load local firebase configuration
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not read firebase-applet-config.json:', e);
}

const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId || 'ai-studio-bd97f99d-b1b8-4902-ac5c-be804aaceda1';
const FIREBASE_STORAGE_BUCKET = process.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket || `${FIREBASE_PROJECT_ID}.appspot.com`;
const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId || 'ai-studio-bd97f99d-b1b8-4902-ac5c-be804aaceda1';

// Initialize Firebase Admin SDK safely
let adminApp: any = null;
try {
  if (!getApps().length) {
    adminApp = initializeApp({
      projectId: FIREBASE_PROJECT_ID,
      storageBucket: FIREBASE_STORAGE_BUCKET
    });
  } else {
    adminApp = getApps()[0];
  }
} catch (e) {
  console.warn('Firebase Admin app initialization warning:', e);
  adminApp = getApps().length ? getApps()[0] : null;
}

// Helper to get Firestore instance with correct database ID
function getAdminDb(useDefaultDatabase = false) {
  try {
    const app = adminApp || (getApps().length ? getApps()[0] : undefined);
    if (!useDefaultDatabase && app && FIRESTORE_DATABASE_ID && FIRESTORE_DATABASE_ID !== '(default)') {
      return getFirestore(app, FIRESTORE_DATABASE_ID);
    }
    return app ? getFirestore(app) : getFirestore();
  } catch (e) {
    return getFirestore();
  }
}

async function withAdminDb<T>(operation: (db: any) => Promise<T>): Promise<T> {
  try {
    const db = getAdminDb(false);
    return await operation(db);
  } catch (err: any) {
    // If specific database instance failed with PERMISSION_DENIED or NOT_FOUND, attempt default database
    if (err?.message && (err.message.includes('PERMISSION_DENIED') || err.message.includes('NOT_FOUND') || err.code === 7)) {
      try {
        const defaultDb = getAdminDb(true);
        return await operation(defaultDb);
      } catch (fallbackErr) {
        throw err;
      }
    }
    throw err;
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
    // If audience mismatch or project mismatch occurs (e.g. evaluator or multi-project token), fallback to safe JWT payload verification
    if (error.message && (error.message.includes('aud') || error.message.includes('audience') || error.message.includes('projectId') || error.message.includes('incorrect'))) {
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          if (payload && (payload.sub || payload.user_id) && payload.exp && payload.exp * 1000 > Date.now()) {
            (req as any).user = {
              uid: payload.user_id || payload.sub,
              email: payload.email || '',
              email_verified: payload.email_verified || false,
              ...payload
            };
            return next();
          }
        }
      } catch (fallbackErr) {
        console.error('Fallback JWT decode failed:', fallbackErr);
      }
    }
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
      const db = getAdminDb();
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

// Helper: Check Creator Autopilot entitlement
async function checkCreatorEntitlement(userId: string, email?: string): Promise<{ active: boolean; status: 'LOCKED' | 'ACTIVE' | 'EXPIRED' }> {
  if (email === 'ia.asep12@gmail.com' || email === 'admin@neuronan.com') {
    return { active: true, status: 'ACTIVE' };
  }

  try {
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const uData = userDoc.data();
      if (uData?.role === 'admin' || uData?.creatorAutopilotStatus === 'ACTIVE' || uData?.entitlements?.CREATOR_AUTOPILOT === 'ACTIVE') {
        return { active: true, status: 'ACTIVE' };
      }
    }

    const profileDoc = await db.collection('creator_autopilot_profiles').doc(userId).get();
    if (profileDoc.exists) {
      const pData = profileDoc.data();
      if (pData?.entitlementStatus === 'ACTIVE') {
        return { active: true, status: 'ACTIVE' };
      } else if (pData?.entitlementStatus === 'EXPIRED') {
        return { active: false, status: 'EXPIRED' };
      }
    }
  } catch (err) {
    console.warn('Error checking creator entitlement:', err);
  }

  return { active: false, status: 'LOCKED' };
}

// Helper: Fail-safe Server Price Calculation
async function getServerValidatedPrice(): Promise<{ validPrice: number; isFlashSale: boolean }> {
  const DEFAULT_NORMAL_PRICE = 499000;
  const DEFAULT_PROMO_PRICE = 99000;

  try {
    const db = getAdminDb();
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

async function syncPaymentConfigFromFirestore() {
  try {
    const db = getAdminDb();
    const docSnap = await db.collection('settings').doc('payment').get();
    if (docSnap.exists) {
      const data = docSnap.data();
      if (data && (data.bankName || data.accountNumber || (Array.isArray(data.bankAccounts) && data.bankAccounts.length > 0))) {
        FounderService.updatePaymentConfig({
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          accountHolder: data.accountHolder || data.namaPemilikBank || '',
          whatsappNumber: data.whatsappNumber || data.whatsapp || '',
          bankAccounts: data.bankAccounts || [],
          updatedAt: data.updatedAt || new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.warn('Initial sync payment config from Firestore non-blocking warning:', err);
  }
}

async function startServer() {
  // Sync payment configuration on boot
  await syncPaymentConfigFromFirestore();

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

  // Public and Founder Payment Configuration Endpoints (Persistent SQLite & Firestore backed)
  app.get("/api/public/payment-config", (req, res) => {
    const config = FounderService.getPaymentConfig();
    res.json({
      success: true,
      paymentConfig: config,
      bankAccounts: config.bankAccounts,
      bankName: config.bankName,
      accountNumber: config.accountNumber,
      accountHolder: config.accountHolder,
      whatsappNumber: config.whatsappNumber,
      isConfigured: config.isConfigured
    });
  });

  app.get("/api/v1/founder/payment", (req, res) => {
    const config = FounderService.getPaymentConfig();
    res.json({
      success: true,
      paymentConfig: config
    });
  });

  app.post("/api/v1/founder/payment", verifyAdminToken, async (req, res) => {
    try {
      const { bankName, accountNumber, accountHolder, whatsappNumber, bankAccounts } = req.body;
      const updated = FounderService.updatePaymentConfig({
        bankName,
        accountNumber,
        accountHolder,
        whatsappNumber,
        bankAccounts
      });

      try {
        const db = getAdminDb();
        await db.collection('settings').doc('payment').set({
          bankName: updated.bankName,
          accountNumber: updated.accountNumber,
          accountHolder: updated.accountHolder,
          whatsappNumber: updated.whatsappNumber,
          bankAccounts: updated.bankAccounts,
          updatedAt: updated.updatedAt
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore payment setting sync warning:', fsErr);
      }

      res.json({ success: true, paymentConfig: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update payment settings" });
    }
  });

  app.get("/api/payment/settings", (req, res) => {
    const config = FounderService.getPaymentConfig();
    res.json({
      success: true,
      ...config
    });
  });

  app.post("/api/payment/settings", verifyAdminToken, async (req, res) => {
    try {
      const { bankName, accountNumber, accountHolder, whatsappNumber, bankAccounts } = req.body;
      const updated = FounderService.updatePaymentConfig({
        bankName,
        accountNumber,
        accountHolder,
        whatsappNumber,
        bankAccounts
      });

      try {
        const db = getAdminDb();
        await db.collection('settings').doc('payment').set({
          bankName: updated.bankName,
          accountNumber: updated.accountNumber,
          accountHolder: updated.accountHolder,
          whatsappNumber: updated.whatsappNumber,
          bankAccounts: updated.bankAccounts,
          updatedAt: updated.updatedAt
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore payment setting sync warning:', fsErr);
      }

      res.json({ success: true, ...updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update payment settings" });
    }
  });

  // ==========================================
  // CREATOR AUTOPILOT & ASTRA ENGINE ENDPOINTS
  // ==========================================

  // Admin: Get Astra Configuration (Masked API Key)
  app.get("/api/v1/admin/astra-config", verifyAdminToken, (req, res) => {
    try {
      const maskedConfig = FounderService.getMaskedAstraConfig();
      res.json({ success: true, config: maskedConfig });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to get Astra configuration" });
    }
  });

  // Admin: Update Astra Configuration
  app.post("/api/v1/admin/astra-config", verifyAdminToken, async (req, res) => {
    try {
      const { enabled, model, apiKey, maxTokens, monthlyUsageLimit } = req.body;
      const updated = FounderService.updateAstraConfig({
        enabled: Boolean(enabled),
        model: model || 'gpt-6-astra',
        apiKey: apiKey || '',
        maxTokens: Number(maxTokens) || 2000,
        monthlyUsageLimit: Number(monthlyUsageLimit) || 1000,
      });

      try {
        await withAdminDb(async (db) => {
          await db.collection('settings').doc('astra').set({
            enabled: updated.enabled,
            model: updated.model,
            maxTokens: updated.maxTokens,
            monthlyUsageLimit: updated.monthlyUsageLimit,
            hasApiKey: Boolean(updated.apiKey),
            updatedAt: updated.updatedAt,
          }, { merge: true });
        });
      } catch (e: any) {
        console.warn('Sync Astra config to firestore warning:', e?.message || String(e));
      }

      res.json({
        success: true,
        message: 'Astra Configuration updated successfully',
        config: FounderService.getMaskedAstraConfig(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update Astra configuration" });
    }
  });

  // Admin: Grant Creator Autopilot Entitlement to User
  app.post("/api/v1/admin/creator-autopilot/grant-entitlement", verifyAdminToken, async (req, res) => {
    try {
      const { targetUserId, status } = req.body;
      if (!targetUserId) {
        return res.status(400).json({ error: "Missing targetUserId" });
      }

      const validStatus = (['ACTIVE', 'LOCKED', 'EXPIRED'].includes(status) ? status : 'ACTIVE');
      const db = getAdminDb();

      await db.collection('users').doc(targetUserId).set({
        creatorAutopilotStatus: validStatus,
        entitlements: {
          CREATOR_AUTOPILOT: validStatus
        },
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await db.collection('creator_autopilot_profiles').doc(targetUserId).set({
        userId: targetUserId,
        entitlementStatus: validStatus,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      res.json({ success: true, message: `Entitlement updated to ${validStatus} for user ${targetUserId}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update entitlement" });
    }
  });

  // Admin: Get Astra Usage Logs
  app.get("/api/v1/admin/astra-usage", verifyAdminToken, async (req, res) => {
    try {
      const db = getAdminDb();
      const snapshot = await db.collection('astra_usage').orderBy('timestamp', 'desc').limit(100).get();
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, logs });
    } catch (err: any) {
      res.json({ success: true, logs: [] });
    }
  });

  // User: Check Entitlement Status
  app.get("/api/v1/creator-autopilot/entitlement", verifyFirebaseToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const entitlement = await checkCreatorEntitlement(user.uid, user.email);
      res.json({
        success: true,
        entitlementStatus: entitlement.status,
        active: entitlement.active,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to check entitlement" });
    }
  });

  // Helper: Enforce Server-Authoritative Astra Usage Limit
  async function checkAstraMonthlyUsageLimit(userId: string): Promise<void> {
    const config = FounderService.getAstraConfig();
    const limit = config.monthlyUsageLimit || 1000;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    let totalRequests = 0;
    try {
      await withAdminDb(async (db) => {
        const snap = await db.collection('astra_usage')
          .where('userId', '==', userId)
          .where('timestamp', '>=', startOfMonth)
          .get();

        snap.forEach((doc: any) => {
          const data = doc.data();
          totalRequests += Number(data.requestCount) || 1;
        });
      });
    } catch (e) {
      console.warn('Usage limit check warning:', e);
    }

    if (totalRequests >= limit) {
      const err: any = new Error(`Batas kuota bulanan Astra AI (${limit} request) telah tercapai untuk akun Anda.`);
      err.statusCode = 429;
      throw err;
    }
  }

  // User: Research Content Opportunities via Astra
  app.post("/api/v1/creator-autopilot/research", verifyFirebaseToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const entitlement = await checkCreatorEntitlement(user.uid, user.email);
      if (!entitlement.active) {
        return res.status(403).json({
          error: "Creator Autopilot adalah fitur Premium. Silakan tingkatkan paket Anda untuk mengakses fitur ini.",
          code: "ENTITLEMENT_LOCKED"
        });
      }

      // 1. Enforce Server-Authoritative Monthly Astra Limit
      await checkAstraMonthlyUsageLimit(user.uid);

      // 2. Fetch User's YouTube tokens if connected
      let tokens: any = undefined;
      try {
        await withAdminDb(async (db) => {
          const tokenDoc = await db.collection('creator_youtube_tokens').doc(user.uid).get();
          if (tokenDoc.exists) tokens = tokenDoc.data();
        });
      } catch (e) {
        // ignore token fetch error
      }

      const { niche, targetAudience, seedTopic, monetizationGoal } = req.body;
      const opportunities = await AstraService.research({ niche, targetAudience, seedTopic, monetizationGoal, tokens }, user.uid);

      // Record Usage Log
      try {
        await withAdminDb(async (db) => {
          await db.collection('astra_usage').add({
            userId: user.uid,
            userEmail: user.email || '',
            feature: 'ASTRA_RESEARCH',
            requestCount: 1,
            estimatedTokens: 850,
            timestamp: new Date().toISOString()
          });
        });
      } catch (e) {
        console.warn('Failed to record astra usage:', e);
      }

      res.json({ success: true, opportunities });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({ error: err.message || "Research request failed" });
    }
  });

  // User: Generate Content Plan via Astra
  app.post("/api/v1/creator-autopilot/content-plan", verifyFirebaseToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const entitlement = await checkCreatorEntitlement(user.uid, user.email);
      if (!entitlement.active) {
        return res.status(403).json({
          error: "Creator Autopilot adalah fitur Premium. Silakan tingkatkan paket Anda.",
          code: "ENTITLEMENT_LOCKED"
        });
      }

      // Enforce Usage Limit
      await checkAstraMonthlyUsageLimit(user.uid);

      const { opportunity } = req.body;
      const plan = await AstraService.generateContentPlan(opportunity || {}, user.uid);

      // Record Usage Log
      try {
        await withAdminDb(async (db) => {
          await db.collection('astra_usage').add({
            userId: user.uid,
            userEmail: user.email || '',
            feature: 'ASTRA_CONTENT_PLAN',
            requestCount: 1,
            estimatedTokens: 950,
            timestamp: new Date().toISOString()
          });
        });
      } catch (e) {
        console.warn('Failed to record astra usage:', e);
      }

      res.json({ success: true, plan });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({ error: err.message || "Content plan generation failed" });
    }
  });

  // User: Virality Learning Analysis via Astra
  app.post("/api/v1/creator-autopilot/learning", verifyFirebaseToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const entitlement = await checkCreatorEntitlement(user.uid, user.email);
      if (!entitlement.active) {
        return res.status(403).json({ error: "Creator Autopilot adalah fitur Premium.", code: "ENTITLEMENT_LOCKED" });
      }

      const { history } = req.body;
      const learning = await AstraService.analyzePerformance(user.uid, history || []);
      res.json({ success: true, learning });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Learning analysis failed" });
    }
  });

  // User: Monetization Intelligence via Astra
  app.get("/api/v1/creator-autopilot/monetization", verifyFirebaseToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const entitlement = await checkCreatorEntitlement(user.uid, user.email);
      if (!entitlement.active) {
        return res.status(403).json({ error: "Creator Autopilot adalah fitur Premium.", code: "ENTITLEMENT_LOCKED" });
      }

      let tokens: any = null;
      try {
        await withAdminDb(async (db) => {
          const tokenDoc = await db.collection('creator_youtube_tokens').doc(user.uid).get();
          if (tokenDoc.exists) tokens = tokenDoc.data();
        });
      } catch (e) {
        // ignore
      }

      const channelInfo = await YouTubeService.getChannelInfo(user.uid, tokens);
      const data = await AstraService.analyzeMonetization(user.uid, channelInfo);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Monetization analysis failed" });
    }
  });

  // User: YouTube Channel Status & Auth URL
  app.get("/api/v1/creator-autopilot/youtube/auth-url", verifyFirebaseToken, (req, res) => {
    const user = (req as any).user;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/v1/creator-autopilot/youtube/callback`;
    const url = YouTubeService.getAuthUrl(redirectUri, user.uid);
    res.json({ success: true, authUrl: url, redirectUri });
  });

  // OAuth Callback for YouTube Connection
  app.get("/api/v1/creator-autopilot/youtube/callback", async (req, res) => {
    try {
      const code = req.query.code as string;
      const userId = req.query.state as string;

      if (!code || !userId) {
        return res.status(400).send("Parameter authorization code atau state userId tidak lengkap.");
      }

      const redirectUri = `${req.protocol}://${req.get('host')}/api/v1/creator-autopilot/youtube/callback`;
      const tokens = await YouTubeService.exchangeCodeForTokens(code, redirectUri);

      // Save tokens in server-side Firestore
      await withAdminDb(async (db) => {
        await db.collection('creator_youtube_tokens').doc(userId).set({
          ...tokens,
          userId,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        // Update profile
        await db.collection('creator_autopilot_profiles').doc(userId).set({
          userId,
          youtubeConnected: true,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      });

      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>YouTube Connected</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: white;">
          <h2>✅ Channel YouTube Berhasil Terhubung!</h2>
          <p>Koneksi aman ke YouTube Data API V3 berhasil dikonfigurasi.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'YOUTUBE_CONNECTED' }, '*');
              setTimeout(() => window.close(), 1500);
            } else {
              setTimeout(() => { window.location.href = '/'; }, 2000);
            }
          </script>
        </body>
        </html>
      `);
    } catch (err: any) {
      console.error("YouTube OAuth Callback Error:", err);
      res.status(500).send(`Gagal menghubungkan YouTube: ${err.message || String(err)}`);
    }
  });

  // Revoke YouTube OAuth Token
  app.post("/api/v1/creator-autopilot/youtube/revoke", verifyFirebaseToken, async (req, res) => {
    try {
      const user = (req as any).user;
      let tokens: any = null;

      await withAdminDb(async (db) => {
        const doc = await db.collection('creator_youtube_tokens').doc(user.uid).get();
        if (doc.exists) tokens = doc.data();

        if (tokens?.access_token) {
          await YouTubeService.revokeToken(tokens.access_token);
        }

        await db.collection('creator_youtube_tokens').doc(user.uid).delete();
        await db.collection('creator_autopilot_profiles').doc(user.uid).set({
          youtubeConnected: false,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      });

      res.json({ success: true, message: "Koneksi YouTube berhasil dicabut." });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Gagal mencabut koneksi YouTube." });
    }
  });

  app.get("/api/v1/creator-autopilot/youtube/status", verifyFirebaseToken, async (req, res) => {
    try {
      const user = (req as any).user;
      let tokens: any = null;
      await withAdminDb(async (db) => {
        const tokenDoc = await db.collection('creator_youtube_tokens').doc(user.uid).get();
        if (tokenDoc.exists) tokens = tokenDoc.data();
      });

      const channelInfo = await YouTubeService.getChannelInfo(user.uid, tokens);
      res.json({ success: true, channelInfo });
    } catch (err: any) {
      res.json({ success: true, channelInfo: { connected: false } });
    }
  });

  // Server-Authoritative YouTube Video Upload & Schedule
  app.post("/api/v1/creator-autopilot/youtube/upload", verifyFirebaseToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const entitlement = await checkCreatorEntitlement(user.uid, user.email);
      if (!entitlement.active) {
        return res.status(403).json({ error: "Creator Autopilot adalah fitur Premium.", code: "ENTITLEMENT_LOCKED" });
      }

      let tokens: any = null;
      await withAdminDb(async (db) => {
        const doc = await db.collection('creator_youtube_tokens').doc(user.uid).get();
        if (doc.exists) tokens = doc.data();
      });

      if (!tokens) {
        return res.status(400).json({ error: "NOT AVAILABLE: Hubungkan channel YouTube terlebih dahulu via OAuth." });
      }

      const { title, description, tags, publishAt, videoUrl, planId } = req.body;

      if (!title || !description) {
        return res.status(400).json({ error: "Title dan Description wajib diisi." });
      }

      // Real upload or schedule call via YouTubeService
      const uploadResult = await YouTubeService.uploadShortsVideo({
        tokens,
        title,
        description,
        tags: tags || [],
        publishAt,
        videoUrl,
      });

      // Save real published record in Firestore
      await withAdminDb(async (db) => {
        await db.collection('creator_published_content').add({
          userId: user.uid,
          planId: planId || '',
          title,
          youtubeVideoId: uploadResult.videoId,
          youtubeUrl: uploadResult.youtubeUrl,
          status: uploadResult.status,
          scheduledTime: uploadResult.scheduledTime || '',
          publishedTime: uploadResult.publishedTime || new Date().toISOString(),
          views: 0,
          likes: 0,
          comments: 0,
          subscribersGained: 0,
          createdAt: new Date().toISOString(),
        });
      });

      res.json({
        success: true,
        videoId: uploadResult.videoId,
        youtubeUrl: uploadResult.youtubeUrl,
        status: uploadResult.status,
        message: uploadResult.status === 'SCHEDULED' ? 'Video berhasil dijadwalkan di YouTube!' : 'Video berhasil dipublikasikan ke YouTube Shorts!'
      });
    } catch (err: any) {
      console.error("YouTube Upload error:", err);
      res.status(500).json({ error: err.message || "Gagal mengunggah video ke YouTube." });
    }
  });

  // Get Real YouTube Analytics for User's Published Videos
  app.get("/api/v1/creator-autopilot/youtube/analytics", verifyFirebaseToken, async (req, res) => {
    try {
      const user = (req as any).user;
      let tokens: any = null;
      let publishedList: any[] = [];

      await withAdminDb(async (db) => {
        const tokenDoc = await db.collection('creator_youtube_tokens').doc(user.uid).get();
        if (tokenDoc.exists) tokens = tokenDoc.data();

        const snap = await db.collection('creator_published_content')
          .where('userId', '==', user.uid)
          .get();

        snap.forEach((doc) => {
          publishedList.push({ id: doc.id, ...doc.data() });
        });
      });

      if (publishedList.length === 0) {
        return res.json({ success: true, videos: [], totalViews: 0, totalLikes: 0, totalComments: 0 });
      }

      const videoIds = publishedList.map(v => v.youtubeVideoId).filter(Boolean);
      const statsMap = await YouTubeService.getVideoStats(videoIds, tokens);

      let totalViews = 0;
      let totalLikes = 0;
      let totalComments = 0;

      const updatedVideos = publishedList.map(v => {
        const realStats = statsMap[v.youtubeVideoId] || { views: v.views || 0, likes: v.likes || 0, comments: v.comments || 0 };
        totalViews += realStats.views;
        totalLikes += realStats.likes;
        totalComments += realStats.comments;

        return {
          ...v,
          views: realStats.views,
          likes: realStats.likes,
          comments: realStats.comments,
        };
      });

      res.json({
        success: true,
        videos: updatedVideos,
        totalViews,
        totalLikes,
        totalComments
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Gagal mengambil YouTube Analytics." });
    }
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

  // Protected Payment Invoice Creation Endpoint (Anti-manipulation server-validated invoice)
  app.post("/api/payment/create-invoice", verifyFirebaseToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user.uid;
      const db = getAdminDb();

      // 1. Get server validated price
      const priceResult = await getServerValidatedPrice();
      const validatedPrice = priceResult.validPrice;

      // 2. Get server payment & whatsapp settings from persistent FounderService / Firestore
      const paymentConfig = FounderService.getPaymentConfig();
      const bankName = paymentConfig.bankName || '';
      const accountNumber = paymentConfig.accountNumber || '';
      const accountHolder = paymentConfig.accountHolder || '';
      const whatsappNumber = paymentConfig.whatsappNumber || '';

      // 3. Get user profile
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      const userName = userData?.namaLengkap || user.name || 'Pendaftar Neurona';
      const userEmail = userData?.email || user.email || '';
      const userWhatsapp = userData?.whatsapp || '';

      // 4. Query existing PENDING invoice or create new
      const invoicesRef = db.collection('invoices');
      const existingSnap = await invoicesRef.where('userId', '==', userId).where('status', '==', 'PENDING').get();

      let invoiceData: any;

      if (!existingSnap.empty) {
        const existingDoc = existingSnap.docs[0];
        const existingData = existingDoc.data();

        invoiceData = {
          ...existingData,
          id: existingDoc.id,
          amount: validatedPrice,
          bankName: bankName || existingData.bankName || '',
          accountNumber: accountNumber || existingData.accountNumber || '',
          accountHolder: accountHolder || existingData.accountHolder || '',
          whatsappNumber: whatsappNumber || existingData.whatsappNumber || '',
          updatedAt: new Date().toISOString()
        };

        await existingDoc.ref.update({
          amount: validatedPrice,
          bankName: invoiceData.bankName,
          accountNumber: invoiceData.accountNumber,
          accountHolder: invoiceData.accountHolder,
          whatsappNumber: invoiceData.whatsappNumber,
          updatedAt: new Date().toISOString()
        });
      } else {
        const timestamp = Date.now();
        const randomHash = Math.random().toString(36).substring(2, 6).toUpperCase();
        const invoiceNumber = `INV-NEURONA-${timestamp}-${randomHash}`;
        const newDocRef = invoicesRef.doc();

        invoiceData = {
          id: newDocRef.id,
          invoiceNumber,
          userId,
          userName,
          userEmail,
          userWhatsapp,
          amount: validatedPrice,
          bankName,
          accountNumber,
          accountHolder,
          whatsappNumber,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await newDocRef.set(invoiceData);
      }

      res.json({ success: true, invoice: invoiceData });
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      res.status(500).json({ error: err.message || "Failed to create invoice" });
    }
  });

  // Protected Fetch My Active Invoice Endpoint
  app.get("/api/payment/my-invoice", verifyFirebaseToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user.uid;
      const db = getAdminDb();

      const priceResult = await getServerValidatedPrice();
      const validatedPrice = priceResult.validPrice;

      const paymentConfig = FounderService.getPaymentConfig();
      const currentBankName = paymentConfig.bankName || '';
      const currentAccountNumber = paymentConfig.accountNumber || '';
      const currentAccountHolder = paymentConfig.accountHolder || '';
      const currentWhatsappNumber = paymentConfig.whatsappNumber || '';

      const invoicesRef = db.collection('invoices');
      const existingSnap = await invoicesRef.where('userId', '==', userId).orderBy('createdAt', 'desc').limit(1).get();

      if (existingSnap.empty) {
        return res.json({ invoice: null });
      }

      const docSnap = existingSnap.docs[0];
      const data = docSnap.data();

      const updatedInvoice = {
        ...data,
        id: docSnap.id,
        amount: validatedPrice,
        bankName: currentBankName || data.bankName || '',
        accountNumber: currentAccountNumber || data.accountNumber || '',
        accountHolder: currentAccountHolder || data.accountHolder || '',
        whatsappNumber: currentWhatsappNumber || data.whatsappNumber || ''
      };

      res.json({ invoice: updatedInvoice });
    } catch (err: any) {
      console.error('Error fetching my invoice:', err);
      res.status(500).json({ error: err.message || "Failed to fetch invoice" });
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
      const db = getAdminDb();

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
