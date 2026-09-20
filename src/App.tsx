import React, { useState, useEffect } from 'react';
import { 
  Video, 
  BookOpen, 
  Sparkles, 
  Settings, 
  LogOut, 
  Users, 
  CheckCircle, 
  XCircle, 
  Lock, 
  ArrowRight, 
  Clock, 
  CreditCard, 
  Plus, 
  Key, 
  ChevronRight,
  Shield,
  Loader2,
  Menu,
  X,
  Phone,
  Mail,
  User as UserIcon,
  HelpCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  BrainCircuit,
  Film,
  Megaphone,
  Presentation,
  MessageCircle,
  ShieldCheck,
  SplitSquareVertical,
  Laptop,
  Play,
  Trash2,
  Edit2,
  Zap,
  ShoppingBag,
  Mic,
  Clapperboard,
  TrendingUp,
  Award,
  Tag
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updatePassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { AffiliateStudio } from './components/AffiliateStudio';
import { VideoEditor } from './components/VideoEditor';
import { AdminShowcase } from './components/AdminShowcase';
import { ShowcaseGallery } from './components/ShowcaseGallery';
import { LandingPage } from './components/LandingPage';
import { LiveSalesNotification } from './components/LiveSalesNotification';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { UserAffiliateModal } from './components/UserAffiliateModal';
import { AdminAffiliateManager } from './components/AdminAffiliateManager';
import { PriceSetting, PaymentSetting, WhatsappSetting, AiStudioItem, StudioCategory, AffiliateProfile, AffiliateReferral } from './types';

const DEFAULT_STUDIOS: AiStudioItem[] = [
  {
    id: 'studio-affiliate',
    category: 'affiliate',
    name: 'Studio Affiliate - Video Penjualan & TikTok Shop',
    tag: 'Affiliate & E-Commerce',
    url: 'https://gemini.google.com/share/c914a0750f39?skid=ac42ba40-5fbd-49ce-a352-707a37f46227',
    note: 'Spesialis video promosi TikTok Shop, Shopee Affiliate & Reels. Formula hook AIDA, unboxing produk dramatis, dan konversi tinggi.',
    features: ['Hook 3 Detik Scroll-Stopper', 'Macro Detail & Unboxing', '1-Click Export Prompt'],
    isActive: true
  },
  {
    id: 'studio-animasi',
    category: 'animasi',
    name: 'Studio Animasi - Kartun & Karakter 3D/2D',
    tag: 'Animasi & Kartun',
    url: 'https://gemini.google.com/',
    note: 'Spesialis animasi 3D, anime jepang, dongeng fabel anak, dan karakter bersambung dengan konsistensi visual dari awal hingga akhir.',
    features: ['Konsistensi Karakter', 'Alur Cerita Fabel & Kartun', 'Prompt Kling & Luma Siap Render'],
    isActive: true
  },
  {
    id: 'studio-edukasi',
    category: 'edukasi',
    name: 'Studio Edukasi - Tutorial & Micro-Learning',
    tag: 'Edukasi & Tutorial',
    url: 'https://gemini.google.com/',
    note: 'Spesialis konten tutorial, sains, fakta unik, sejarah, dan infografis interaktif berdaya sebar tinggi yang mudah dipahami.',
    features: ['Alur Logis Hook-Fakta-Solusi', 'Visual Infografis & Diagram', 'Voiceover Script Terstruktur'],
    isActive: true
  },
  {
    id: 'studio-podcast',
    category: 'podcast',
    name: 'Studio Podcast - Talkshow & Dialog 2 Orang',
    tag: 'Podcast & Talkshow',
    url: 'https://gemini.google.com/',
    note: 'Spesialis wawancara mendalam, percakapan 2 orang inspiratif, kamera multi-angle (Host/Guest), dan ekstraksi kutipan viral.',
    features: ['Kamera Multi-Angle Dinamis', 'Warm Studio Lighting', 'Ekstraksi Punchline Dialog'],
    isActive: true
  },
  {
    id: 'studio-film',
    category: 'film',
    name: 'Studio Film - Sinematik Layar Lebar 8K',
    tag: 'Sinematik & Short Movie',
    url: 'https://gemini.google.com/',
    note: 'Spesialis skenario film laga/drama epik, pencahayaan layar lebar Hollywood 8K, framing anamorphic, dan shot sequencing profesional.',
    features: ['Lighting Sinematik 8K Anamorphic', 'Shot Sequencing Dramatis', 'Format Layar Sinema 16:9 & 21:9'],
    isActive: true
  }
];

// Interfaces based on blueprint
interface UserProfile {
  namaLengkap: string;
  email: string;
  whatsapp: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  role: 'user' | 'admin';
  createdAt: string;
}

export default function App() {
  // Navigation & Routing State
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [activeTab, setActiveTab] = useState<'landing' | 'register' | 'login' | 'payment_instructions' | 'user_dashboard'>('landing');
  const [userDashboardTab, setUserDashboardTab] = useState<'affiliate_studio' | 'overview'>('affiliate_studio');

  // Auth & Profile State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // General App State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting>({
    bankName: 'Bank BCA',
    accountNumber: '1234567890',
    accountHolder: 'Admin Neurona'
  });
  const [priceSetting, setPriceSetting] = useState<PriceSetting>({
    normalPrice: 499000,
    promoPrice: 99000,
    flashSaleHours: 4,
    flashSaleMinutes: 15
  });
  const [whatsappSetting, setWhatsappSetting] = useState<{ phoneNumber: string }>({ phoneNumber: '628123456789' });
  const [aiStudioSetting, setAiStudioSetting] = useState<{ url: string; note?: string }>({
    url: 'https://gemini.google.com/share/c914a0750f39?skid=ac42ba40-5fbd-49ce-a352-707a37f46227',
    note: 'Studio Utama Google Gemini Flow Workspace'
  });
  const [studioList, setStudioList] = useState<AiStudioItem[]>(DEFAULT_STUDIOS);
  const [memberViewMode, setMemberViewMode] = useState<'studios' | 'internal'>('studios');
  const [selectedStudioCategory, setSelectedStudioCategory] = useState<StudioCategory>('affiliate');
  const [newStudioForm, setNewStudioForm] = useState<{ name: string; url: string; tag: string; note: string }>({
    name: '',
    url: '',
    tag: 'Cabang Baru',
    note: ''
  });
  const [showAddStudioForm, setShowAddStudioForm] = useState(false);

  // Admin state
  const [adminActiveTab, setAdminActiveTab] = useState<'pendaftar' | 'affiliate' | 'harga' | 'rekening' | 'akun' | 'showcase' | 'whatsapp' | 'aistudio'>('pendaftar');
  const [usersList, setUsersList] = useState<(UserProfile & { id: string })[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [adminPasswordForm, setAdminPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [adminPriceForm, setAdminPriceForm] = useState<PriceSetting>({
    normalPrice: 499000,
    promoPrice: 99000,
    flashSaleHours: 4,
    flashSaleMinutes: 15
  });
  const [adminBankForm, setAdminBankForm] = useState<PaymentSetting>({
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  });
  const [adminWhatsappForm, setAdminWhatsappForm] = useState({ phoneNumber: '' });
  const [adminAiStudioForm, setAdminAiStudioForm] = useState({
    url: 'https://gemini.google.com/share/c914a0750f39?skid=ac42ba40-5fbd-49ce-a352-707a37f46227',
    note: 'Studio Utama Google Gemini Flow Workspace'
  });

  // Affiliate states
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  const [affiliateProfile, setAffiliateProfile] = useState<AffiliateProfile | null>(null);
  const [userReferrals, setUserReferrals] = useState<AffiliateReferral[]>([]);
  const [allAffiliatesList, setAllAffiliatesList] = useState<AffiliateProfile[]>([]);
  const [allReferralsList, setAllReferralsList] = useState<AffiliateReferral[]>([]);
  const [activeReferralCode, setActiveReferralCode] = useState<string>('');

  // Capture URL referral param
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      const cleanRef = ref.trim().toUpperCase();
      setActiveReferralCode(cleanRef);
      try {
        localStorage.setItem('neuronan_ref_code', cleanRef);
      } catch (e) {
        // ignore storage error
      }
    } else {
      try {
        const stored = localStorage.getItem('neuronan_ref_code');
        if (stored) setActiveReferralCode(stored);
      } catch (e) {}
    }
  }, []);

  // Load User's Affiliate Profile & Referrals
  useEffect(() => {
    if (!currentUser) {
      setAffiliateProfile(null);
      setUserReferrals([]);
      return;
    }

    // 1. Subscribe to own affiliate profile
    const unsubAff = onSnapshot(doc(db, 'affiliates', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setAffiliateProfile(docSnap.data() as AffiliateProfile);
      } else {
        setAffiliateProfile(null);
      }
    }, (err) => {
      console.warn('Silent read block on user affiliate doc:', err);
    });

    // 2. Subscribe to user referrals
    const refQuery = query(collection(db, 'affiliate_referrals'), orderBy('createdAt', 'desc'));
    const unsubRef = onSnapshot(refQuery, (snap) => {
      const list: AffiliateReferral[] = [];
      snap.forEach((d) => {
        const data = d.data() as AffiliateReferral;
        if (data.affiliateId === currentUser.uid) {
          list.push({ id: d.id, ...data });
        }
      });
      setUserReferrals(list);
    }, (err) => {
      console.warn('Silent read block on user referrals list:', err);
    });

    return () => {
      unsubAff();
      unsubRef();
    };
  }, [currentUser]);

  // Load All Affiliates & Referrals for Admin
  useEffect(() => {
    if (userProfile?.role === 'admin' && currentPath === '/admin') {
      const unsubAffs = onSnapshot(collection(db, 'affiliates'), (snap) => {
        const list: AffiliateProfile[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as AffiliateProfile) });
        });
        setAllAffiliatesList(list);
      }, (err) => {
        console.warn('Admin affiliates read notice:', err);
      });

      const unsubRefs = onSnapshot(query(collection(db, 'affiliate_referrals'), orderBy('createdAt', 'desc')), (snap) => {
        const list: AffiliateReferral[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as AffiliateReferral) });
        });
        setAllReferralsList(list);
      }, (err) => {
        console.warn('Admin referrals read notice:', err);
      });

      return () => {
        unsubAffs();
        unsubRefs();
      };
    }
  }, [userProfile, currentPath]);

  // Inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Password Reset states
  const [resetEmail, setResetEmail] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Studio Produksi Modal states
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [copiedStudioLink, setCopiedStudioLink] = useState(false);
  const [studioViewMode, setStudioViewMode] = useState<'tab' | 'iframe'>('tab');

  // Router sync
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  };

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Load Payment Settings on Mount
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'payment'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as PaymentSetting;
        setPaymentSettings(data);
        setAdminBankForm(data);
      }
    }, (error) => {
      console.warn('Silent read block or loading error on settings doc:', error);
    });
    return () => unsub();
  }, []);

  // Load Price Settings on Mount (Public Read for Landing Page & Checkout)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'price'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as PriceSetting;
        setPriceSetting(data);
        setAdminPriceForm(data);
      }
    }, (error) => {
      console.warn('Silent read block or loading error on price settings doc:', error);
    });
    return () => unsub();
  }, []);

  // Load Whatsapp Settings on Mount
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'whatsapp'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as { phoneNumber: string };
        setWhatsappSetting(data);
        setAdminWhatsappForm(data);
      }
    }, (error) => {
      console.warn('Silent read block or loading error on whatsapp settings doc:', error);
    });
    return () => unsub();
  }, []);

  // Load AI Studio Settings (only when user is signed in, adhering to firestore rules)
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'settings', 'aistudio'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as { url?: string; note?: string; studios?: AiStudioItem[] };
        if (data.url) {
          setAiStudioSetting({
            url: data.url,
            note: data.note || 'Studio Utama Google Gemini Flow Workspace'
          });
          setAdminAiStudioForm({
            url: data.url,
            note: data.note || 'Studio Utama Google Gemini Flow Workspace'
          });
        }
        if (data.studios && Array.isArray(data.studios) && data.studios.length > 0) {
          setStudioList(data.studios);
        }
      }
    }, (error) => {
      console.warn('Silent read block or loading error on aistudio settings doc:', error);
    });
    return () => unsub();
  }, [currentUser]);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);
          const isAdminAccount = user.email === 'ia.asep12@gmail.com' || user.email === 'admin@neuronan.com';
          
          if (userSnap.exists()) {
            let profile = userSnap.data() as UserProfile;

            // Auto-heal admin role and active status
            if (isAdminAccount && (profile.role !== 'admin' || profile.status !== 'ACTIVE')) {
              await updateDoc(userDocRef, { role: 'admin', status: 'ACTIVE' });
              profile = { ...profile, role: 'admin', status: 'ACTIVE' };
            }

            setUserProfile(profile);
            
            // Route based on role & status & path
            if (window.location.pathname === '/admin') {
              if (profile.role === 'admin') {
                // Keep in admin panel
              } else {
                showToast('Akses ditolak: Anda bukan administrator', 'error');
                signOut(auth);
                setUserProfile(null);
              }
            } else {
              // Standard User
              if (profile.status === 'ACTIVE') {
                setActiveTab('user_dashboard');
              } else {
                setActiveTab('payment_instructions');
              }
            }
          } else {
            // Check if it's the admin logging in on brand new project
            if (isAdminAccount) {
              const defaultAdminProfile: UserProfile = {
                namaLengkap: 'Admin Neurona',
                email: user.email || 'admin@neurona.com',
                whatsapp: '081234567890',
                role: 'admin',
                status: 'ACTIVE',
                createdAt: new Date().toISOString()
              };
              await setDoc(userDocRef, defaultAdminProfile);
              setUserProfile(defaultAdminProfile);
            } else {
              setUserProfile(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user profile", error);
          showToast('Gagal memuat profil pengguna', 'error');
        }
      } else {
        setUserProfile(null);
        if (window.location.pathname !== '/admin') {
          setActiveTab('landing');
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [currentPath]);

  // Read User list for Admin (Real-time update)
  useEffect(() => {
    if (userProfile?.role === 'admin' && currentPath === '/admin') {
      setUsersLoading(true);
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const list: (UserProfile & { id: string })[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as UserProfile) });
        });
        setUsersList(list);
        setUsersLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
        setUsersLoading(false);
      });
      return () => unsub();
    }
  }, [userProfile, currentPath]);

  // Handle User Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regWhatsapp.trim() || !regPassword.trim()) {
      showToast('Harap isi semua field wajib', 'error');
      return;
    }
    // Validation numbers only for whatsapp
    if (!/^[0-9]+$/.test(regWhatsapp)) {
      showToast('Nomor WhatsApp harus berupa angka saja', 'error');
      return;
    }
    if (regPassword.length < 6) {
      showToast('Password minimal 6 karakter', 'error');
      return;
    }

    setRegLoading(true);
    try {
      // 1. Create in auth
      const userCred = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      const uid = userCred.user.uid;

      // 2. Create profile in firestore
      // Special check: If user registers with default admin email, auto-promote to active admin!
      const profileData: UserProfile = {
        namaLengkap: regName,
        email: regEmail,
        whatsapp: regWhatsapp,
        status: regEmail === 'ia.asep12@gmail.com' ? 'ACTIVE' : 'PENDING',
        role: regEmail === 'ia.asep12@gmail.com' ? 'admin' : 'user',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', uid), profileData);
      setUserProfile(profileData);

      // Track referral record if user registered with a referral code
      const refCodeToUse = activeReferralCode || (typeof window !== 'undefined' ? localStorage.getItem('neuronan_ref_code') : '');
      if (refCodeToUse) {
        try {
          // Find affiliate owner of this referral code
          const affSnap = await getDocs(collection(db, 'affiliates'));
          let targetAff: (AffiliateProfile & { id: string }) | null = null;
          affSnap.forEach((d) => {
            const data = d.data() as AffiliateProfile;
            if (data.referralCode && data.referralCode.toUpperCase() === refCodeToUse.toUpperCase()) {
              targetAff = { id: d.id, ...data };
            }
          });

          if (targetAff) {
            const referralRef = doc(collection(db, 'affiliate_referrals'));
            const referralData: AffiliateReferral = {
              id: referralRef.id,
              affiliateId: (targetAff as any).userId || (targetAff as any).id,
              affiliateCode: refCodeToUse.toUpperCase(),
              buyerId: uid,
              buyerName: regName,
              buyerEmail: regEmail,
              productPrice: 99000,
              commissionRate: 40,
              commissionAmount: 39600,
              status: 'pending',
              createdAt: new Date().toISOString()
            };
            await setDoc(referralRef, referralData);

            // Update affiliate pending earnings
            const currentPending = (targetAff as any).pendingEarnings || 0;
            const currentTotalClicks = (targetAff as any).totalClicks || 0;
            await updateDoc(doc(db, 'affiliates', (targetAff as any).id), {
              pendingEarnings: currentPending + 39600,
              totalClicks: currentTotalClicks + 1
            });
          }
        } catch (refErr) {
          console.warn('Error recording affiliate referral:', refErr);
        }
      }

      showToast('Pendaftaran berhasil! Silakan lakukan pembayaran.', 'success');
      setActiveTab('payment_instructions');
    } catch (error: any) {
      const isExpected = error.code === 'auth/email-already-in-use' || error.message?.includes('email-already-in-use');
      if (!isExpected) {
        console.error(error);
      }
      if (isExpected) {
        showToast('Email sudah terdaftar. Silakan masuk.', 'error');
      } else {
        showToast('Gagal melakukan pendaftaran: ' + error.message, 'error');
      }
    } finally {
      setRegLoading(false);
    }
  };

  // Handle User Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      showToast('Harap isi email dan password', 'error');
      return;
    }

    setLoginLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const uid = userCred.user.uid;
      
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        setUserProfile(profile);

        if (profile.status === 'PENDING') {
          showToast('Akun Anda sedang menunggu konfirmasi pembayaran oleh admin', 'error');
          setActiveTab('payment_instructions');
        } else if (profile.status === 'REJECTED') {
          showToast('Akun Anda ditolak oleh admin. Hubungi admin untuk info lebih lanjut.', 'error');
          setActiveTab('payment_instructions');
        } else if (profile.status === 'ACTIVE') {
          showToast('Berhasil masuk!', 'success');
          setActiveTab('user_dashboard');
        }
      } else {
        showToast('Data akun tidak ditemukan', 'error');
      }
    } catch (error: any) {
      const isAuthError = 
        error.code === 'auth/wrong-password' || 
        error.code === 'auth/user-not-found' || 
        error.code === 'auth/invalid-credential' ||
        error.message?.includes('wrong-password') ||
        error.message?.includes('user-not-found') ||
        error.message?.includes('invalid-credential');

      if (!isAuthError) {
        console.error(error);
      }
      
      if (isAuthError) {
        showToast('Email atau password salah', 'error');
      } else {
        showToast('Gagal masuk: ' + error.message, 'error');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      showToast('Harap isi email dan password', 'error');
      return;
    }

    setAdminLoginLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const uid = userCred.user.uid;
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;

        if (profile.role === 'admin' && profile.status === 'ACTIVE') {
          setUserProfile(profile);
          showToast('Berhasil masuk sebagai Admin!', 'success');
        } else {
          showToast('Akses ditolak: Anda bukan administrator aktif', 'error');
          await signOut(auth);
          setUserProfile(null);
        }
      } else {
        showToast('Profil Admin tidak ditemukan', 'error');
        await signOut(auth);
      }
    } catch (error: any) {
      const isAuthError = 
        error.code === 'auth/wrong-password' || 
        error.code === 'auth/user-not-found' || 
        error.code === 'auth/invalid-credential' ||
        error.message?.includes('wrong-password') ||
        error.message?.includes('user-not-found') ||
        error.message?.includes('invalid-credential');

      if (!isAuthError) {
        console.error(error);
      }
      showToast('Gagal masuk Admin: Email atau password salah', 'error');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  // Handle Sign Out
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      setCurrentUser(null);
      showToast('Berhasil keluar', 'success');
      if (currentPath === '/admin') {
        // Keep in admin login view
      } else {
        setActiveTab('landing');
      }
    } catch (error: any) {
      showToast('Gagal keluar: ' + error.message, 'error');
    }
  };

  // Handle Send Password Reset Email
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      showToast('Harap isi email Anda', 'error');
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      showToast('Permintaan reset password telah dikirim ke Firebase!', 'success');
      setShowResetModal(false);
    } catch (error: any) {
      console.error(error);
      showToast('Gagal mengirim email reset: ' + error.message, 'error');
    } finally {
      setResetLoading(false);
    }
  };

  // Google Sign-In (Khusus Administrator ia.asep12@gmail.com / admin@neuronan.com)
  const handleGoogleSignIn = async (forAdmin: boolean = true) => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const res = await signInWithPopup(auth, provider);
      const user = res.user;

      const isAdminEmail = user.email === 'ia.asep12@gmail.com' || user.email === 'admin@neuronan.com';

      if (!isAdminEmail) {
        // Strict Security Guard: User biasa TIDAK BOLEH bypass pendaftaran & pembayaran via Google!
        await signOut(auth);
        showToast('Login Google hanya untuk Administrator. Pengguna silakan daftar & aktivasi akun melalui transfer.', 'error');
        return;
      }

      // Check user in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const profile = userSnap.data() as UserProfile;
        setUserProfile(profile);
      } else {
        const adminProfile: UserProfile = {
          namaLengkap: user.displayName || 'Admin Neuronan',
          email: user.email || '',
          whatsapp: '081234567890',
          role: 'admin',
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, adminProfile);
        setUserProfile(adminProfile);
      }

      showToast(`Berhasil masuk sebagai Administrator (${user.email})!`, 'success');
      navigateTo('/admin');
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("Google sign in error", error);
        showToast('Gagal masuk dengan Google: ' + error.message, 'error');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // URLs for Studio Produksi Video AI
  const STUDIO_DIRECT_URL = 'https://gemini.google.com/share/d42de0a1535e?skid=6e76b041-a8e4-4c0b-ad4c-8906ac8cc8c6';
  const STUDIO_SHORT_URL = 'https://share.gemini.google/rxUpHiJSGTCo';

  // Handler to safely open Studio Produksi (Protected for active members)
  const handleOpenStudio = (urlToOpen?: string) => {
    if (!currentUser) {
      showToast('Silakan login terlebih dahulu untuk mengakses Ruang Kerja AI Studio.', 'error');
      setActiveTab('login');
      return;
    }
    if (!userProfile || userProfile.status !== 'ACTIVE') {
      showToast('Akses dibatasi. Akun Anda masih menunggu verifikasi aktivasi oleh admin.', 'error');
      return;
    }
    const targetUrl = urlToOpen || aiStudioSetting.url || STUDIO_SHORT_URL;
    if (targetUrl === '#internal-studio') {
      setMemberViewMode('internal');
      return;
    }
    const opened = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = targetUrl;
    }
  };

  const handleCopyStudioLink = (url?: string) => {
    if (!currentUser) {
      showToast('Silakan login terlebih dahulu untuk menyalin tautan.', 'error');
      setActiveTab('login');
      return;
    }
    if (!userProfile || userProfile.status !== 'ACTIVE') {
      showToast('Akses dibatasi. Hanya member berstatus AKTIF yang dapat menyalin tautan.', 'error');
      return;
    }
    const targetUrl = url || aiStudioSetting.url || STUDIO_SHORT_URL;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(targetUrl).then(() => {
          setCopiedStudioLink(true);
          showToast('Tautan Ruang Kerja AI Studio berhasil disalin!', 'success');
          setTimeout(() => setCopiedStudioLink(false), 3000);
        }).catch(() => {
          const textarea = document.createElement('textarea');
          textarea.value = targetUrl;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          setCopiedStudioLink(true);
          showToast('Tautan Ruang Kerja AI Studio berhasil disalin!', 'success');
          setTimeout(() => setCopiedStudioLink(false), 3000);
        });
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = targetUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedStudioLink(true);
        showToast('Tautan Ruang Kerja AI Studio berhasil disalin!', 'success');
        setTimeout(() => setCopiedStudioLink(false), 3000);
      }
    } catch {
      showToast('Gagal menyalin tautan secara otomatis', 'error');
    }
  };

  // Admin Actions: Approve User
  const handleApproveUser = async (targetUid: string) => {
    try {
      await updateDoc(doc(db, 'users', targetUid), { status: 'ACTIVE' });

      // Check if there is any pending referral for this buyer
      try {
        const refQuery = query(collection(db, 'affiliate_referrals'));
        const snap = await getDocs(refQuery);
        snap.forEach(async (docSnap) => {
          const refData = docSnap.data() as AffiliateReferral;
          if ((refData.buyerId === targetUid || refData.buyerUserId === targetUid) && refData.status === 'pending') {
            await updateDoc(doc(db, 'affiliate_referrals', docSnap.id), {
              status: 'approved',
              approvedAt: new Date().toISOString()
            });

            // Credit the affiliate profile
            const affDocRef = doc(db, 'affiliates', refData.affiliateId);
            const affDoc = await getDoc(affDocRef);
            if (affDoc.exists()) {
              const affData = affDoc.data() as AffiliateProfile;
              await updateDoc(affDocRef, {
                successfulSales: (affData.successfulSales || 0) + 1,
                totalEarnings: (affData.totalEarnings || 0) + refData.commissionAmount,
                pendingEarnings: Math.max(0, (affData.pendingEarnings || 0) - refData.commissionAmount)
              });
            }
          }
        });
      } catch (refErr) {
        console.warn('Error auto-approving affiliate referral:', refErr);
      }

      showToast('Pendaftar berhasil diaktifkan!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${targetUid}`);
      showToast('Gagal mengaktifkan pendaftar', 'error');
    }
  };

  // Admin Actions: Reject User
  const handleRejectUser = async (targetUid: string) => {
    try {
      await updateDoc(doc(db, 'users', targetUid), { status: 'REJECTED' });
      showToast('Pendaftar berhasil ditolak', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${targetUid}`);
      showToast('Gagal menolak pendaftar', 'error');
    }
  };

  // Admin Actions: Delete User
  const handleDeleteUser = async (targetUid: string, userDisplayName?: string, userEmail?: string) => {
    const targetLabel = userDisplayName ? `${userDisplayName} (${userEmail || ''})` : 'akun ini';
    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus ${targetLabel}? Data akun akan dihapus permanen.`);
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'users', targetUid));
      showToast(`Akun ${userDisplayName || ''} berhasil dihapus permanen!`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${targetUid}`);
      showToast('Gagal menghapus akun pendaftar', 'error');
    }
  };

  // Admin Actions: Update Bank Info Settings
  const handleSaveBankSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminBankForm.bankName.trim() || !adminBankForm.accountNumber.trim() || !adminBankForm.accountHolder.trim()) {
      showToast('Harap lengkapi semua data rekening', 'error');
      return;
    }

    try {
      await setDoc(doc(db, 'settings', 'payment'), {
        bankName: adminBankForm.bankName,
        accountNumber: adminBankForm.accountNumber,
        accountHolder: adminBankForm.accountHolder
      });
      showToast('Rekening pembayaran berhasil diperbarui!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/payment');
      showToast('Gagal menyimpan pengaturan rekening', 'error');
    }
  };

  // Admin Actions: Update Whatsapp Settings
  const handleSaveWhatsappSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminWhatsappForm.phoneNumber.trim()) {
      showToast('Harap lengkapi nomor WhatsApp', 'error');
      return;
    }

    try {
      await setDoc(doc(db, 'settings', 'whatsapp'), {
        phoneNumber: adminWhatsappForm.phoneNumber
      });
      showToast('Nomor WhatsApp pendaftaran berhasil diperbarui!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/whatsapp');
      showToast('Gagal menyimpan pengaturan WhatsApp', 'error');
    }
  };

  // Admin Actions: Update AI Studio Direct Settings
  const handleSaveAiStudioSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminAiStudioForm.url.trim()) {
      showToast('URL Ruang Kerja AI Studio tidak boleh kosong', 'error');
      return;
    }

    try {
      await setDoc(doc(db, 'settings', 'aistudio'), {
        url: adminAiStudioForm.url.trim(),
        note: adminAiStudioForm.note || 'Google Gemini AI Studio Workspace',
        studios: studioList,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast('Link & Daftar Multi-Studio AI berhasil diperbarui!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/aistudio');
      showToast('Gagal menyimpan pengaturan AI Studio', 'error');
    }
  };

  // Admin Actions: Change Admin Password Self
  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasswordForm.new || !adminPasswordForm.confirm) {
      showToast('Harap lengkapi field password baru', 'error');
      return;
    }
    if (adminPasswordForm.new !== adminPasswordForm.confirm) {
      showToast('Password konfirmasi tidak cocok', 'error');
      return;
    }
    if (adminPasswordForm.new.length < 6) {
      showToast('Password baru minimal 6 karakter', 'error');
      return;
    }

    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, adminPasswordForm.new);
        showToast('Password berhasil diperbarui!', 'success');
        setAdminPasswordForm({ current: '', new: '', confirm: '' });
      } else {
        showToast('User tidak terdeteksi aktif', 'error');
      }
    } catch (error: any) {
      console.error(error);
      showToast('Gagal mengubah password: ' + error.message, 'error');
    }
  };

  // Render Loader when Auth is restoring session
  if (authLoading) {
    return (
      <div id="loader-screen" className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-cyan-600 animate-spin" />
        <p className="mt-4 text-slate-600 font-medium">Memuat aplikasi...</p>
      </div>
    );
  }

  // Check if current page is admin page
  const isAdminPage = currentPath === '/admin';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowResetModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Key className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Lupa Password?</h3>
              <p className="text-xs text-slate-500 mt-1">Masukkan alamat email Anda di bawah. Kami akan mengirimkan instruksi dan link untuk menyetel ulang password Anda.</p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email Terdaftar</label>
                <input 
                  type="email" 
                  required
                  placeholder="Masukkan email Anda"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm rounded-xl hover:from-blue-700 hover:to-cyan-600 transition-all flex items-center justify-center gap-2"
                >
                  {resetLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Kirim Link Reset</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Studio Produksi Video AI Modal */}
      {showStudioModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative my-8">
            <button 
              onClick={() => setShowStudioModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Studio Produksi Video AI</h3>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-200">
                    Akses Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Workspace Google Gemini khusus member berbayar Neuronan</p>
              </div>
            </div>

            {/* Method Tabs */}
            <div className="flex border-b border-slate-100 mb-6 gap-2">
              <button
                type="button"
                onClick={() => setStudioViewMode('tab')}
                className={`pb-3 px-4 text-xs font-bold transition-all relative ${
                  studioViewMode === 'tab' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Akses Tab Baru (Rekomendasi)
              </button>
              <button
                type="button"
                onClick={() => setStudioViewMode('iframe')}
                className={`pb-3 px-4 text-xs font-bold transition-all relative ${
                  studioViewMode === 'iframe' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Informasi Metode Iframe
              </button>
            </div>

            {/* Tab 1: Direct Tab Access */}
            {studioViewMode === 'tab' && (
              <div className="space-y-5">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Akses Terproteksi Member</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Workspace ini terhubung langsung ke template Studio Gemini resmi. Karena Anda telah terdaftar dan berstatus <strong className="text-emerald-600">AKTIF</strong> di Neuronan, Anda dapat langsung menggunakannya tanpa batasan.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handleOpenStudio(STUDIO_DIRECT_URL)}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2.5"
                  >
                    <span>Luncurkan Studio di Tab Baru</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenStudio(STUDIO_SHORT_URL)}
                      className="flex-1 py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <span>Gunakan Tautan Cadangan (Shortlink)</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyStudioLink(STUDIO_DIRECT_URL)}
                      className="py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {copiedStudioLink ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-700">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-slate-400" />
                          <span>Salin Tautan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 text-xs text-amber-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Tips Jika Tautan Tidak Langsung Terbuka:</span>
                  </p>
                  <p className="text-amber-700 leading-relaxed pl-5">
                    Pastikan browser Anda mengizinkan popup (pop-up blocker tidak aktif) atau gunakan tombol <strong>"Salin Tautan"</strong> lalu tempelkan langsung di tab baru browser Anda.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Iframe Explanation & Test */}
            {studioViewMode === 'iframe' && (
              <div className="space-y-4">
                <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <h4 className="font-bold text-rose-900">Mengapa Tidak Bisa Ditampilkan Menggunakan Metode Iframe?</h4>
                      <p className="text-rose-700 leading-relaxed">
                        Server <strong>Google Gemini</strong> secara otomatis mengirimkan respon header keamanan <code className="bg-rose-100 px-1.5 py-0.5 rounded font-mono text-[11px]">X-Frame-Options: SAMEORIGIN</code>.
                      </p>
                      <p className="text-rose-700 leading-relaxed">
                        Ini adalah aturan keamanan global dari Google untuk mencegah <em>clickjacking</em>. Akibatnya, semua peramban modern (Chrome, Safari, Edge, Firefox) <strong>akan menolak menampilkan halaman Gemini di dalam iframe website lain</strong> dan menampilkan error <em>"gemini.google.com refused to connect"</em>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 text-center space-y-3">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Simulasi Iframe Browser:</p>
                  <div className="w-full h-48 bg-white border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-6 text-slate-400">
                    <XCircle className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-600">Koneksi Iframe Ditolak oleh Kebijakan Google</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                      Google mewajibkan sesi chat dibuka di tab terpisah agar akun Google pengguna tetap aman dan terlindungi.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenStudio(STUDIO_DIRECT_URL)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <span>Buka Studio di Tab Baru Sekarang</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStudioModal(false)}
                className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Dynamic Toast Notifications */}
      {toast && (
        <div id="toast-notification" className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border transition-all duration-300 transform scale-100 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : toast.type === 'info'
            ? 'bg-blue-50 border-blue-100 text-blue-800'
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : toast.type === 'info' ? (
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-semibold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* Header / Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('/')}>
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent tracking-tight">
              Neurona
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAdminPage ? (
              userProfile?.role === 'admin' ? (
                <div className="flex items-center gap-4">
                  <span className="hidden sm:inline-block text-xs bg-cyan-50 border border-cyan-100 text-cyan-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Admin Panel
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors rounded-lg whitespace-nowrap"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => navigateTo('/')}
                  className="px-4 py-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Area Publik
                </button>
              )
            ) : currentUser ? (
              <div className="flex items-center gap-3.5">
                {currentUser.email === 'ia.asep12@gmail.com' && (
                  <button 
                    onClick={() => navigateTo('/admin')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors rounded-lg whitespace-nowrap"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Panel Founder Admin</span>
                  </button>
                )}
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-slate-800">{userProfile?.namaLengkap || 'User'}</p>
                  <p className="text-xs text-slate-500">{currentUser.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors rounded-lg whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    navigateTo('/');
                    setActiveTab('login');
                  }}
                  className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors whitespace-nowrap"
                >
                  Masuk
                </button>
                <button 
                  onClick={() => {
                    navigateTo('/');
                    setActiveTab('register');
                  }}
                  className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-md shadow-blue-500/10 rounded-lg transition-all hover:scale-[1.01] whitespace-nowrap"
                >
                  Daftar Sekarang
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Areas */}
      <main className="flex-1 flex flex-col">
        {isAdminPage ? (
          /* ================= ADMIN AREA ================= */
          userProfile?.role === 'admin' ? (
            /* Admin Logged-In Area */
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col md:flex-row gap-8">
              {/* Sidebar Menu */}
              <aside className="w-full md:w-64 shrink-0 flex flex-col gap-1 bg-white p-4 rounded-xl border border-slate-100 h-fit shadow-sm">
                <p className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Navigasi Admin</p>
                <button 
                  onClick={() => setAdminActiveTab('pendaftar')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    adminActiveTab === 'pendaftar' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Kelola Pendaftar</span>
                  {usersList.filter(u => u.status === 'PENDING').length > 0 && (
                    <span className="ml-auto bg-amber-500 text-white font-black text-xs px-2 py-0.5 rounded-full">
                      {usersList.filter(u => u.status === 'PENDING').length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setAdminActiveTab('affiliate')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    adminActiveTab === 'affiliate' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 shrink-0 text-blue-600" />
                  <span>Laporan Affiliate (40%)</span>
                  {allReferralsList.filter(r => r.status === 'pending').length > 0 && (
                    <span className="ml-auto bg-emerald-500 text-white font-black text-xs px-2 py-0.5 rounded-full">
                      {allReferralsList.filter(r => r.status === 'pending').length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setAdminActiveTab('harga')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    adminActiveTab === 'harga' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Tag className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>Pengaturan Harga & Flash Sale</span>
                </button>
                <button 
                  onClick={() => setAdminActiveTab('rekening')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    adminActiveTab === 'rekening' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span>Pengaturan Rekening</span>
                </button>
                <button 
                  onClick={() => setAdminActiveTab('akun')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    adminActiveTab === 'akun' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Pengaturan Akun</span>
                </button>
                <button 
                  onClick={() => setAdminActiveTab('showcase')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    adminActiveTab === 'showcase' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Video className="w-4 h-4 shrink-0" />
                  <span>Kelola Showcase</span>
                </button>
                <button 
                  onClick={() => setAdminActiveTab('whatsapp')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    adminActiveTab === 'whatsapp' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>Pengaturan WhatsApp</span>
                </button>
                <button 
                  onClick={() => setAdminActiveTab('aistudio')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    adminActiveTab === 'aistudio' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <BrainCircuit className="w-4 h-4 shrink-0" />
                  <span>Link AI Studio</span>
                </button>
              </aside>

              {/* Detail Content */}
              <div className="flex-1 bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                {adminActiveTab === 'pendaftar' && (
                  <div className="flex-1 flex flex-col">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-slate-800 tracking-tight">Daftar Pendaftar</h2>
                      <p className="text-xs text-slate-500 mt-1">Konfirmasi atau tolak transfer pendaftaran user Neuronan secara real-time</p>
                    </div>

                    {usersLoading ? (
                      <div className="flex-1 flex justify-center items-center py-20">
                        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
                      </div>
                    ) : usersList.length === 0 ? (
                      <div className="flex-1 border border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                        <Users className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="font-bold text-slate-700">Belum Ada Pendaftar</p>
                        <p className="text-xs text-slate-400 mt-1">Akun yang mendaftar akan otomatis muncul di tabel ini.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto -mx-6 md:mx-0">
                        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                          <thead className="bg-slate-50/50">
                            <tr>
                              <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Nama & Kontak</th>
                              <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Email</th>
                              <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Tanggal Daftar</th>
                              <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                              <th className="px-6 py-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {usersList.map((usr) => (
                              <tr key={usr.id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="px-6 py-4">
                                  <div>
                                    <div className="font-bold text-slate-800">{usr.namaLengkap}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      <span>{usr.whatsapp}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 font-medium">
                                  {usr.email}
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-xs">
                                  {usr.createdAt ? new Date(usr.createdAt).toLocaleString('id-ID', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : '-'}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${
                                    usr.status === 'ACTIVE' 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                      : usr.status === 'REJECTED' 
                                        ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                        : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                                  }`}>
                                    {usr.status === 'ACTIVE' ? 'Aktif' : usr.status === 'REJECTED' ? 'Ditolak' : 'Pending'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center gap-1.5 justify-end">
                                    {usr.status === 'PENDING' ? (
                                      <>
                                        <button 
                                          onClick={() => handleRejectUser(usr.id)}
                                          className="px-2.5 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-lg transition-colors whitespace-nowrap"
                                        >
                                          Tolak
                                        </button>
                                        <button 
                                          onClick={() => handleApproveUser(usr.id)}
                                          className="px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white font-bold text-xs rounded-lg shadow-sm transition-opacity whitespace-nowrap"
                                        >
                                          Aktifkan
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        {/* Allow toggling back if made a mistake */}
                                        {usr.status === 'ACTIVE' ? (
                                          <button 
                                            onClick={() => handleRejectUser(usr.id)}
                                            className="px-2 py-1 text-xs text-slate-400 hover:text-rose-600 font-medium transition-colors"
                                          >
                                            Tolak
                                          </button>
                                        ) : (
                                          <button 
                                            onClick={() => handleApproveUser(usr.id)}
                                            className="px-2 py-1 text-xs text-slate-400 hover:text-emerald-600 font-medium transition-colors"
                                          >
                                            Aktifkan
                                          </button>
                                        )}
                                      </>
                                    )}

                                    {/* Tombol Hapus Akun */}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(usr.id, usr.namaLengkap, usr.email)}
                                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ml-1"
                                      title={`Hapus Akun ${usr.namaLengkap}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                      <span>Hapus</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {adminActiveTab === 'harga' && (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <Tag className="w-5 h-5 text-amber-500" />
                        <span>Pengaturan Harga & Flash Sale Landing Page</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Atur harga normal, harga promo promo peluncuran, dan timer hitung mundur Flash Sale secara real-time.
                      </p>
                    </div>

                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                          await setDoc(doc(db, 'settings', 'price'), {
                            normalPrice: Number(adminPriceForm.normalPrice) || 499000,
                            promoPrice: Number(adminPriceForm.promoPrice) || 99000,
                            flashSaleHours: Number(adminPriceForm.flashSaleHours) || 4,
                            flashSaleMinutes: Number(adminPriceForm.flashSaleMinutes) || 15,
                            updatedAt: new Date().toISOString()
                          }, { merge: true });
                          showToast('Pengaturan harga & timer Flash Sale berhasil diperbarui!', 'success');
                        } catch (err) {
                          showToast('Gagal menyimpan pengaturan harga', 'error');
                        }
                      }} 
                      className="space-y-5 max-w-lg"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Harga Normal (Dicoret)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                            <input 
                              type="number" 
                              placeholder="499000" 
                              value={adminPriceForm.normalPrice || ''}
                              onChange={(e) => setAdminPriceForm({...adminPriceForm, normalPrice: Number(e.target.value)})}
                              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm font-bold text-slate-500 line-through"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Harga Promo Flash Sale (Bayar)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-xs font-bold text-amber-500">Rp</span>
                            <input 
                              type="number" 
                              placeholder="99000" 
                              value={adminPriceForm.promoPrice || ''}
                              onChange={(e) => setAdminPriceForm({...adminPriceForm, promoPrice: Number(e.target.value)})}
                              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm font-black text-amber-600"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-3">
                        <h4 className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Atur Sisa Waktu Timer Flash Sale</span>
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 block mb-1">Durasi Jam (Hours)</label>
                            <input 
                              type="number" 
                              min="0"
                              max="48"
                              value={adminPriceForm.flashSaleHours ?? 4}
                              onChange={(e) => setAdminPriceForm({...adminPriceForm, flashSaleHours: Number(e.target.value)})}
                              className="w-full px-3 py-2 bg-white rounded-xl border border-amber-200 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 block mb-1">Durasi Menit (Minutes)</label>
                            <input 
                              type="number" 
                              min="0"
                              max="59"
                              value={adminPriceForm.flashSaleMinutes ?? 15}
                              onChange={(e) => setAdminPriceForm({...adminPriceForm, flashSaleMinutes: Number(e.target.value)})}
                              className="w-full px-3 py-2 bg-white rounded-xl border border-amber-200 text-xs font-bold"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-amber-700 leading-relaxed">
                          Timer ini berjalan otomatis di Landing Page & Banner Atas untuk menciptakan persepsi kelangkaan (*urgency*) bagi calon pembeli.
                        </p>
                      </div>

                      <button 
                        type="submit"
                        className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Simpan Pengaturan Harga & Flash Sale</span>
                      </button>
                    </form>
                  </div>
                )}

                {adminActiveTab === 'rekening' && (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-slate-800 tracking-tight">Atur Rekening Pembayaran</h2>
                      <p className="text-xs text-slate-500 mt-1">Data rekening ini akan tampil otomatis di halaman instruksi pembayaran pendaftaran user</p>
                    </div>

                    <form onSubmit={handleSaveBankSettings} className="space-y-5 max-w-lg">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Nama Bank / E-Wallet</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: Bank BCA, Bank Mandiri, GoPay" 
                          value={adminBankForm.bankName}
                          onChange={(e) => setAdminBankForm({...adminBankForm, bankName: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Nomor Rekening</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: 8223940128" 
                          value={adminBankForm.accountNumber}
                          onChange={(e) => setAdminBankForm({...adminBankForm, accountNumber: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Atas Nama (A/N)</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: PT Neuronan Teknologi" 
                          value={adminBankForm.accountHolder}
                          onChange={(e) => setAdminBankForm({...adminBankForm, accountHolder: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/10 transition-all hover:scale-[1.01]"
                      >
                        Simpan Rekening
                      </button>
                    </form>
                  </div>
                )}

                {adminActiveTab === 'akun' && (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-slate-800 tracking-tight">Pengaturan Akun Admin</h2>
                      <p className="text-xs text-slate-500 mt-1">Kelola data keamanan akun administrator Anda</p>
                    </div>

                    <form onSubmit={handleChangeAdminPassword} className="space-y-5 max-w-lg">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Email Administrator</label>
                        <input 
                          type="email" 
                          disabled 
                          value={currentUser?.email || ''} 
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed text-sm"
                        />
                        <span className="text-xs text-slate-400">Email admin default tidak dapat diubah</span>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Password Baru</label>
                        <input 
                          type="password" 
                          placeholder="Minimal 6 karakter"
                          value={adminPasswordForm.new}
                          onChange={(e) => setAdminPasswordForm({...adminPasswordForm, new: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Konfirmasi Password Baru</label>
                        <input 
                          type="password" 
                          placeholder="Masukkan kembali password baru"
                          value={adminPasswordForm.confirm}
                          onChange={(e) => setAdminPasswordForm({...adminPasswordForm, confirm: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/10 transition-all hover:scale-[1.01]"
                      >
                        Ubah Password
                      </button>
                    </form>
                  </div>
                )}

                {adminActiveTab === 'showcase' && (
                  <AdminShowcase showToast={showToast} />
                )}

                {adminActiveTab === 'whatsapp' && (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-slate-800 tracking-tight">Pengaturan WhatsApp Pendaftaran</h2>
                      <p className="text-xs text-slate-500 mt-1">Nomor WhatsApp ini digunakan untuk tombol bantuan dan konfirmasi di Landing Page</p>
                    </div>

                    <form onSubmit={handleSaveWhatsappSettings} className="space-y-5 max-w-lg">
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Nomor WhatsApp</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: 628123456789 (gunakan format 62)" 
                          value={adminWhatsappForm.phoneNumber}
                          onChange={(e) => setAdminWhatsappForm({...adminWhatsappForm, phoneNumber: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm"
                        />
                        <p className="text-xs text-slate-400 mt-1">Gunakan format internasional tanpa tanda + (contoh: 628...)</p>
                      </div>

                      <button 
                        type="submit"
                        className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/10 transition-all hover:scale-[1.01]"
                      >
                        Simpan WhatsApp
                      </button>
                    </form>
                  </div>
                )}

                {adminActiveTab === 'aistudio' && (
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Pengaturan Multi-Studio AI Workspace</h2>
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full border border-blue-200">
                          Multi-Studio Terproteksi
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Kelola tautan langsung ke Google Gemini Flow & Studio AI lainnya. Pengguna umum/non-member tidak bisa melihat atau menyalin link ini sebelum diautentikasi dan berstatus aktif.
                      </p>
                    </div>

                    {/* Section 1: Studio Utama Quick Edit */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-blue-600" />
                        <span>Studio Utama (Google Gemini Flow & Storyboard)</span>
                      </h3>

                      <form onSubmit={handleSaveAiStudioSettings} className="space-y-4 max-w-2xl">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">URL Direct Studio Utama (Google Gemini Share)</label>
                          <input 
                            type="url" 
                            required
                            placeholder="https://gemini.google.com/share/c914a0750f39?skid=ac42ba40-5fbd-49ce-a352-707a37f46227" 
                            value={adminAiStudioForm.url}
                            onChange={(e) => {
                              const newUrl = e.target.value;
                              setAdminAiStudioForm({...adminAiStudioForm, url: newUrl});
                              // Also sync primary studio in list
                              setStudioList(prev => prev.map(st => st.id === 'studio-gemini-flow' ? { ...st, url: newUrl } : st));
                            }}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-xs font-mono"
                          />
                          <p className="text-[11px] text-slate-400">
                            Masukkan link share workspace Google Gemini resmi Anda yang berisi workflow Storyboard & Export Prompt.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Catatan / Label Ruang Kerja</label>
                          <input 
                            type="text" 
                            placeholder="Contoh: Studio Utama Google Gemini Flow & Storyboard" 
                            value={adminAiStudioForm.note}
                            onChange={(e) => setAdminAiStudioForm({...adminAiStudioForm, note: e.target.value})}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-xs"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <button 
                            type="submit"
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all"
                          >
                            Simpan Pengaturan Multi-Studio
                          </button>

                          {adminAiStudioForm.url && (
                            <a
                              href={adminAiStudioForm.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Uji Buka Studio Utama</span>
                            </a>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Section 2: Multi-Studio Registry List */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <SplitSquareVertical className="w-4 h-4 text-cyan-600" />
                            <span>Daftar Pilihan Multi-Studio AI ({studioList.length} Studio)</span>
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Member dapat memilih studio ini di halaman dashboard mereka setelah login.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddStudioForm(!showAddStudioForm)}
                          className="px-3.5 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Studio Baru</span>
                        </button>
                      </div>

                      {/* Add Studio Form */}
                      {showAddStudioForm && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                          <h4 className="text-xs font-black text-slate-800">Form Tambah Studio AI Baru</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-slate-600">Nama Studio</label>
                              <input 
                                type="text"
                                placeholder="Contoh: Studio 3 - Gemini Flow Fast"
                                value={newStudioForm.name}
                                onChange={(e) => setNewStudioForm({...newStudioForm, name: e.target.value})}
                                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-slate-600">Badge / Tag</label>
                              <input 
                                type="text"
                                placeholder="Contoh: Jalur Alternatif 2"
                                value={newStudioForm.tag}
                                onChange={(e) => setNewStudioForm({...newStudioForm, tag: e.target.value})}
                                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-[11px] font-bold text-slate-600">URL Direct Studio</label>
                              <input 
                                type="text"
                                placeholder="https://gemini.google.com/share/... atau #internal-studio"
                                value={newStudioForm.url}
                                onChange={(e) => setNewStudioForm({...newStudioForm, url: e.target.value})}
                                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-mono"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-[11px] font-bold text-slate-600">Keterangan Singkat</label>
                              <input 
                                type="text"
                                placeholder="Jelaskan kegunaan studio ini bagi member..."
                                value={newStudioForm.note}
                                onChange={(e) => setNewStudioForm({...newStudioForm, note: e.target.value})}
                                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setShowAddStudioForm(false)}
                              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-bold"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!newStudioForm.name || !newStudioForm.url) {
                                  showToast('Nama dan URL Studio wajib diisi', 'error');
                                  return;
                                }
                                const item: AiStudioItem = {
                                  id: `studio-${Date.now()}`,
                                  name: newStudioForm.name,
                                  url: newStudioForm.url,
                                  tag: newStudioForm.tag || 'Studio Tambahan',
                                  note: newStudioForm.note || '',
                                  features: ['Storyboard Multi-Scene', 'Ekspor Prompt'],
                                  isActive: true
                                };
                                setStudioList([...studioList, item]);
                                setNewStudioForm({ name: '', url: '', tag: 'Cabang Baru', note: '' });
                                setShowAddStudioForm(false);
                                showToast('Studio baru berhasil ditambahkan ke daftar!', 'success');
                              }}
                              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded-lg font-bold shadow-sm"
                            >
                              Tambahkan ke Daftar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Studio List Cards */}
                      <div className="grid grid-cols-1 gap-3">
                        {studioList.map((st, idx) => (
                          <div 
                            key={st.id || idx}
                            className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
                          >
                            <div className="space-y-1 max-w-xl">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-800">{st.name}</span>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold">
                                  {st.tag}
                                </span>
                                {!st.isActive && (
                                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md text-[10px] font-bold">
                                    Non-Aktif
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1">{st.note}</p>
                              <p className="text-[10px] font-mono text-cyan-800 truncate max-w-md">{st.url}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {st.url !== '#internal-studio' && (
                                <a
                                  href={st.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs transition-colors"
                                  title="Tes Buka Tautan"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = studioList.map(item => item.id === st.id ? { ...item, isActive: !item.isActive } : item);
                                  setStudioList(updated);
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                                  st.isActive 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                    : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
                                }`}
                              >
                                {st.isActive ? 'Aktif' : 'Non-Aktif'}
                              </button>
                              {studioList.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Hapus ${st.name}?`)) {
                                      setStudioList(studioList.filter(item => item.id !== st.id));
                                      showToast('Studio dihapus dari daftar', 'info');
                                    }
                                  }}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Hapus Studio"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await setDoc(doc(db, 'settings', 'aistudio'), {
                                url: adminAiStudioForm.url.trim(),
                                note: adminAiStudioForm.note || 'Studio Utama Google Gemini Flow Workspace',
                                studios: studioList,
                                updatedAt: new Date().toISOString()
                              }, { merge: true });
                              showToast('Semua perubahan Multi-Studio AI berhasil disimpan ke database!', 'success');
                            } catch (e) {
                              showToast('Gagal menyimpan perubahan Multi-Studio', 'error');
                            }
                          }}
                          className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Simpan Semua Perubahan Multi-Studio</span>
                        </button>
                      </div>
                    </div>

                    {/* Security Explanatory Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Mekanisme Akses & Keamanan Terproteksi:</span>
                      </div>
                      <ul className="space-y-1 text-slate-600 list-disc list-inside">
                        <li>User atau pengunjung biasa <strong>tidak bisa membuka atau menyalin</strong> link ini sebelum login.</li>
                        <li>Tautan ini tersimpan aman di Firestore dan hanya dapat dibaca oleh user yang sudah diautentikasi (login).</li>
                        <li>Hanya member dengan status <strong className="text-emerald-700">AKTIF</strong> yang dapat membuka tombol peluncur AI Studio di dashboard member.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Tab: Affiliate Reports & Management */}
                {adminActiveTab === 'affiliate' && (
                  <div className="flex-1 flex flex-col">
                    <AdminAffiliateManager
                      affiliates={allAffiliatesList}
                      referrals={allReferralsList}
                      showToast={showToast}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Admin Logged-Out / Login Area */
            <div className="flex-1 flex justify-center items-center px-4 py-16">
              <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-100 shadow-md">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10 mx-auto mb-3">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Login Administrator</h2>
                  <p className="text-xs text-slate-500 mt-1">Gunakan akun Google Anda atau akun admin resmi</p>
                </div>

                {/* Google One-Click Login */}
                <button 
                  type="button"
                  onClick={() => handleGoogleSignIn(true)}
                  disabled={googleLoading}
                  className="w-full mb-5 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl border border-slate-200 shadow-sm flex items-center justify-center gap-3 transition-all hover:border-slate-300"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{googleLoading ? 'Memproses Akun Google...' : 'Masuk dengan Google (ia.asep12@gmail.com)'}</span>
                </button>

                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-slate-400 font-semibold">ATAU LOGIN DENGAN PASSWORD</span>
                  </div>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Email Admin</label>
                    <input 
                      type="email" 
                      placeholder="Masukkan email admin"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-slate-700">Password</label>
                      <button 
                        type="button"
                        onClick={() => {
                          setResetEmail(loginEmail || 'ia.asep12@gmail.com');
                          setShowResetModal(true);
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        Lupa Password?
                      </button>
                    </div>
                    <input 
                      type="password" 
                      placeholder="Masukkan password admin"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-sm"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={adminLoginLoading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/10 transition-all flex justify-center items-center gap-2"
                  >
                    {adminLoginLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menghubungkan...</span>
                      </>
                    ) : (
                      <span>Masuk sebagai Admin</span>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                  <button 
                    onClick={() => navigateTo('/')}
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1.5 mx-auto transition-colors"
                  >
                    <span>Kembali ke Halaman Publik</span>
                  </button>
                </div>
              </div>
            </div>
          )
        ) : (
          /* ================= STANDARD USER AREA ================= */
          <div className="flex-1 flex flex-col">
            {activeTab === 'landing' && (
              <LandingPage 
                onRegisterClick={() => setActiveTab('register')}
                onLoginClick={() => setActiveTab('login')}
                whatsappNumber={whatsappSetting.phoneNumber}
                priceSetting={priceSetting}
              />
            )}

            {activeTab === 'register' && (
              <div className="flex-1 flex justify-center items-center px-4 py-16 bg-slate-50">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-100 shadow-md">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Formulir Pendaftaran</h2>
                    <p className="text-xs text-slate-500 mt-1">Isi data di bawah ini untuk membuat akun baru</p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Nama Lengkap</label>
                      <input 
                        type="text" 
                        placeholder="Nama Lengkap Anda"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Email</label>
                      <input 
                        type="email" 
                        placeholder="Contoh: user@neuronan.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Nomor WhatsApp</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: 08123456789 (Hanya angka)"
                        value={regWhatsapp}
                        onChange={(e) => setRegWhatsapp(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Password</label>
                      <input 
                        type="password" 
                        placeholder="Minimal 6 karakter"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={regLoading}
                      className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/10 transition-all flex justify-center items-center gap-2"
                    >
                      {regLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mendaftarkan...</span>
                        </>
                      ) : (
                        <span>Daftar Sekarang</span>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-500">
                      Sudah punya akun?{' '}
                      <button 
                        onClick={() => setActiveTab('login')}
                        className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Masuk di sini
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'login' && (
              <div className="flex-1 flex justify-center items-center px-4 py-16 bg-slate-50">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-100 shadow-md">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Masuk Neuronan</h2>
                    <p className="text-xs text-slate-500 mt-1">Masukkan email dan password untuk mengakses dashboard</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Email</label>
                      <input 
                        type="email" 
                        placeholder="Alamat email terdaftar"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-700">Password</label>
                        <button 
                          type="button"
                          onClick={() => {
                            setResetEmail(loginEmail);
                            setShowResetModal(true);
                          }}
                          className="text-xs font-bold text-cyan-600 hover:text-cyan-700 transition-colors"
                        >
                          Lupa Password?
                        </button>
                      </div>
                      <input 
                        type="password" 
                        placeholder="Password akun Anda"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 text-sm"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={loginLoading}
                      className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/10 transition-all flex justify-center items-center gap-2"
                    >
                      {loginLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menghubungkan...</span>
                        </>
                      ) : (
                        <span>Masuk</span>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-500">
                      Belum punya akun?{' '}
                      <button 
                        onClick={() => setActiveTab('register')}
                        className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Daftar sekarang
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment_instructions' && (
              <div className="flex-1 flex justify-center items-center px-4 py-16 bg-slate-50">
                <div className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-md">
                  
                  {/* Pending/Rejected Message Alert Banner */}
                  {userProfile?.status === 'REJECTED' ? (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold">Pendaftaran Ditolak</p>
                        <p className="text-xs mt-0.5">Maaf, pendaftaran Anda ditolak oleh admin. Pastikan nominal dan bukti transfer sesuai.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <p className="text-sm font-bold">Menunggu Konfirmasi Pembayaran</p>
                        <p className="text-xs mt-0.5">Akun Anda sedang menunggu konfirmasi pembayaran oleh admin. Status Anda saat ini adalah: <strong>PENDING</strong>.</p>
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Instruksi Pembayaran Promo</h2>
                    <p className="text-xs text-slate-500 mt-1">Harap selesaikan pembayaran promo Rp 99.000 (sekali bayar seumur hidup) agar admin dapat mengaktifkan akun Anda.</p>
                  </div>

                  {/* Payment Details Box */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 space-y-4">
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Jumlah Transfer (Promo Lifetime)</span>
                      <p className="text-3xl font-black bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 bg-clip-text text-transparent mt-1">Rp 99.000</p>
                      <span className="inline-block mt-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ⚡ Bayar 1x Pakai Selamanya • Tanpa Biaya Bulanan
                      </span>
                    </div>

                    <hr className="border-slate-200/60" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Bank / Tujuan</span>
                        <span className="font-extrabold text-slate-800 text-base">{paymentSettings.bankName}</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Nomor Rekening</span>
                        <span className="font-extrabold text-slate-800 text-base tracking-wide select-all">{paymentSettings.accountNumber}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Atas Nama</span>
                        <span className="font-extrabold text-slate-800 text-base">{paymentSettings.accountHolder}</span>
                      </div>
                    </div>
                  </div>

                  {/* Guidance Instructions */}
                  <div className="space-y-4 text-xs text-slate-600 mb-8">
                    <div className="flex gap-3">
                      <span className="w-5 h-5 bg-blue-50 text-blue-600 font-extrabold rounded-full flex items-center justify-center shrink-0">1</span>
                      <p className="leading-relaxed">Transfer persis sebesar <strong>Rp 99.000</strong> ke rekening di atas menggunakan mobile banking, ATM, atau e-wallet.</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-5 h-5 bg-blue-50 text-blue-600 font-extrabold rounded-full flex items-center justify-center shrink-0">2</span>
                      <p className="leading-relaxed">Gunakan nama yang sama dengan pendaftaran pada detail transfer jika memungkinkan, atau simpan bukti transfer Anda.</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-5 h-5 bg-blue-50 text-blue-600 font-extrabold rounded-full flex items-center justify-center shrink-0">3</span>
                      <p className="leading-relaxed">Admin akan memvalidasi pembayaran Anda dalam waktu 5 - 15 menit (maks. 1x24 jam). Setelah diaktifkan, Anda akan langsung dapat mengakses generator storyboard AI.</p>
                    </div>
                  </div>

                  {/* Refresh Button */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => {
                        window.location.reload();
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Loader2 className="w-4 h-4 animate-spin-slow shrink-0" />
                      <span>Cek Status Sekarang</span>
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="py-3 px-6 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-all"
                    >
                      Keluar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'user_dashboard' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col">
                {/* Mode: Internal Storyboard Studio */}
                {memberViewMode === 'internal' ? (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setMemberViewMode('studios')}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <span>← Kembali ke Dashboard</span>
                        </button>
                        <div>
                          <h2 className="text-sm font-bold text-slate-800">
                            {selectedStudioCategory === 'affiliate' ? 'Studio Affiliate AI' :
                             selectedStudioCategory === 'animasi' ? 'Studio Animasi & Karakter 3D AI' :
                             selectedStudioCategory === 'edukasi' ? 'Studio Edukasi & Tutorial AI' :
                             selectedStudioCategory === 'podcast' ? 'Studio Podcast & Talkshow AI' :
                             'Studio Film Sinematik 8K AI'}
                          </h2>
                          <p className="text-xs text-slate-500">Rancang scene visual storyboard dan ekspor prompt video AI 1-klik</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Member Aktif</span>
                        </span>
                      </div>
                    </div>

                    <AffiliateStudio 
                      showToast={showToast} 
                      studioType={selectedStudioCategory}
                      onSelectStudioType={(cat) => setSelectedStudioCategory(cat)}
                    />
                  </div>
                ) : (
                  /* Mode: Single Card Main Hub */
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-8">
                    {/* Header Intro */}
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-3xl flex items-center justify-center mb-5 shadow-xl shadow-blue-500/20">
                      <BrainCircuit className="w-9 h-9 text-white" />
                    </div>
                    
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-800 font-bold text-xs mb-3">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Akses Otentikasi Berhasil • Lisensi Lifetime</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mb-2">
                      Halo, <span className="bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">{userProfile?.namaLengkap || 'Member'}</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-lg mb-8">
                      Selamat datang di ruang kerja kreatif Anda. Klik tautan di bawah untuk masuk ke ruang produksi video berbasis kecerdasan buatan.
                    </p>

                    {/* Single Main Card: Ruang Produksi Video A.I */}
                    <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-lg shadow-blue-500/5 text-left mb-8 hover:border-blue-300 transition-all group">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-100">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                            <Video className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/70 text-[10px] font-black rounded-full uppercase tracking-wider">
                                Ruang Kerja Utama
                              </span>
                              <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-md tracking-wider">
                                V2.9.1
                              </span>
                            </div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight mt-1">
                              Ruang Produksi Video A.I
                            </h2>
                          </div>
                        </div>

                        <span className="self-start sm:self-auto px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Akses Aktif</span>
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed mb-6">
                        Pusat produksi visual storyboard dan prompt video AI generatif all-in-one. Dilengkapi pembuat storyboard visual, caption & skrip otomatis, serta ekspor prompt 1-klik untuk platform Google Flow, Kling, Luma Dream Machine, dan Hailuo.
                      </p>

                      {/* Studio Suites preview pill list */}
                      <div className="mb-6 bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                        <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
                          5 Studio Spesialis di Dalamnya:
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200/70 text-slate-700 font-bold shadow-xs">
                            <ShoppingBag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Studio Affiliate</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200/70 text-slate-700 font-bold shadow-xs">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>Studio Animasi 3D</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200/70 text-slate-700 font-bold shadow-xs">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Studio Edukasi</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200/70 text-slate-700 font-bold shadow-xs">
                            <Mic className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Studio Podcast</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200/70 text-slate-700 font-bold shadow-xs">
                            <Clapperboard className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Studio Film Sinematik 8K</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => handleOpenStudio(aiStudioSetting.url || STUDIO_SHORT_URL)}
                          className="flex-1 py-3.5 px-6 bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-sm rounded-2xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
                        >
                          <span>Buka Ruang Produksi Video A.I</span>
                          <ExternalLink className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyStudioLink(aiStudioSetting.url || STUDIO_SHORT_URL)}
                          className={`py-3.5 px-5 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 border shadow-sm ${
                            copiedStudioLink 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                          title="Salin link workspace Gemini"
                        >
                          {copiedStudioLink ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span>Link Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-slate-600" />
                              <span>Salin Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Security Notice */}
                    <div className="w-full max-w-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-xl text-xs leading-relaxed flex items-start gap-2.5 text-left">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block mb-0.5">Akses Khusus Member Terverifikasi:</strong>
                        Semua link direct ruang kerja studio ini terproteksi secara otomatis. Pengguna yang belum login atau non-member tidak dapat membuka atau menyalin tautan ini.
                      </div>
                    </div>

                    {/* Affiliate Program Feature Card */}
                    <div className="w-full max-w-2xl mt-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-blue-500/30 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700"></div>
                      
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-blue-500/30 border border-blue-400/40 text-blue-200 text-[10px] font-black rounded-full uppercase tracking-wider">
                              Program Resmi
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-[10px] font-black rounded-md tracking-wider">
                              Komisi 40% (Rp 39.600 / Sale)
                            </span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                            <span>{affiliateProfile ? 'Dashboard Affiliate Anda' : 'Daftar Jadi Affiliate Resmi'}</span>
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
                            {affiliateProfile 
                              ? `Kode Referral Anda: ${affiliateProfile.referralCode}. Total Penjualan: ${affiliateProfile.successfulSales || 0} user. Pendapatan: Rp ${(affiliateProfile.totalEarnings || 0).toLocaleString('id-ID')}`
                              : 'Rekomendasikan Ruang Produksi Video AI ke kreator lain dan dapatkan komisi 40% langsung ke rekening Anda setiap ada yang bergabung.'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowAffiliateModal(true)}
                          className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 shrink-0 group-hover:scale-105"
                        >
                          <Award className="w-4 h-4" />
                          <span>{affiliateProfile ? 'Buka Area Affiliate' : 'Daftar Jadi Affiliate'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* User Affiliate Modal */}
      {currentUser && (
        <UserAffiliateModal
          isOpen={showAffiliateModal}
          onClose={() => setShowAffiliateModal(false)}
          currentUser={currentUser}
          userProfile={userProfile}
          affiliateProfile={affiliateProfile}
          userReferrals={userReferrals}
          showToast={showToast}
        />
      )}

      {/* Real-time Purchase Social Proof Notification */}
      {(!currentUser || userProfile?.status !== 'ACTIVE') && !isAdminPage && (
        <LiveSalesNotification onActionClick={() => setActiveTab('register')} />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <p>&copy; {new Date().getFullYear()} Neurona. All rights reserved.</p>
          {currentUser?.email === 'ia.asep12@gmail.com' && (
            <div className="flex gap-4">
              <button 
                onClick={() => navigateTo('/admin')} 
                className="hover:text-blue-700 transition-colors font-bold text-blue-600 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Panel Founder Admin</span>
              </button>
            </div>
          )}
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <FloatingWhatsApp phoneNumber={whatsappSetting.phoneNumber} />
    </div>
  );
}
