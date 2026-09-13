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
  Presentation
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
  collection, 
  getDocs, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { AffiliateStudio } from './components/AffiliateStudio';
import { VideoEditor } from './components/VideoEditor';

// Interfaces based on blueprint
interface UserProfile {
  namaLengkap: string;
  email: string;
  whatsapp: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  role: 'user' | 'admin';
  createdAt: string;
}

interface PaymentSetting {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
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

  // Admin state
  const [adminActiveTab, setAdminActiveTab] = useState<'pendaftar' | 'rekening' | 'akun'>('pendaftar');
  const [usersList, setUsersList] = useState<(UserProfile & { id: string })[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [adminPasswordForm, setAdminPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [adminBankForm, setAdminBankForm] = useState<PaymentSetting>({
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  });

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

  // Handler to safely open Studio Produksi
  const handleOpenStudio = (urlToOpen: string = STUDIO_DIRECT_URL) => {
    if (!userProfile || userProfile.status !== 'ACTIVE') {
      showToast('Akses ditolak. Hanya pengguna dengan akun AKTIF yang dapat mengakses Studio Produksi.', 'error');
      return;
    }
    const opened = window.open(urlToOpen, '_blank', 'noopener,noreferrer');
    if (!opened) {
      // If browser popup blocker intercepts, fallback to opening the shortlink or inform in modal
      window.location.href = urlToOpen;
    }
  };

  const handleCopyStudioLink = (url: string = STUDIO_SHORT_URL) => {
    navigator.clipboard.writeText(url);
    setCopiedStudioLink(true);
    showToast('Tautan Studio Produksi berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopiedStudioLink(false), 3000);
  };

  // Admin Actions: Approve User
  const handleApproveUser = async (targetUid: string) => {
    try {
      await updateDoc(doc(db, 'users', targetUid), { status: 'ACTIVE' });
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
                                  {usr.status === 'PENDING' ? (
                                    <div className="flex gap-2 justify-end">
                                      <button 
                                        onClick={() => handleRejectUser(usr.id)}
                                        className="px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-lg transition-colors whitespace-nowrap"
                                      >
                                        Tolak
                                      </button>
                                      <button 
                                        onClick={() => handleApproveUser(usr.id)}
                                        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white font-bold text-xs rounded-lg shadow-sm transition-opacity whitespace-nowrap"
                                      >
                                        Aktifkan
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2 justify-end">
                                      {/* Allow toggling back if made a mistake */}
                                      {usr.status === 'ACTIVE' ? (
                                        <button 
                                          onClick={() => handleRejectUser(usr.id)}
                                          className="text-xs text-slate-400 hover:text-rose-600 font-medium transition-colors"
                                        >
                                          Tolak
                                        </button>
                                      ) : (
                                        <button 
                                          onClick={() => handleApproveUser(usr.id)}
                                          className="text-xs text-slate-400 hover:text-emerald-600 font-medium transition-colors"
                                        >
                                          Aktifkan
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
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
              <div className="flex-1 flex flex-col">
                {/* Hero Section */}
                <section className="relative overflow-hidden py-20 lg:py-28 bg-white border-b border-slate-100 flex items-center flex-1">
                  {/* Glowing Tech Gradient Background Grid */}
                  <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60"></div>
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-tr from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100/60 rounded-full text-blue-700 font-bold text-xs mb-6 uppercase tracking-wider">
                      <BrainCircuit className="w-3.5 h-3.5 animate-pulse text-cyan-500" />
                      <span>Platform Produksi AI All-In-One</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-none mb-6">
                      <span className="bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">Neurona</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 font-medium leading-relaxed mb-10">
                      Suite Produksi Konten AI — Video, Editing & Ebook dalam satu dashboard
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <button 
                        onClick={() => setActiveTab('register')}
                        className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01] whitespace-nowrap"
                      >
                        Daftar Sekarang
                      </button>
                      <button 
                        onClick={() => setActiveTab('login')}
                        className="w-full sm:w-auto px-8 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-all whitespace-nowrap"
                      >
                        Masuk ke Dashboard
                      </button>
                    </div>
                  </div>
                </section>

                {/* Cara Kerja Section */}
                <section className="py-20 bg-slate-50">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Bagaimana Cara Bergabung?</h2>
                      <p className="text-slate-500 mt-2 font-medium">Langkah mudah untuk mulai memproduksi konten berkualitas tinggi dengan AI</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                      {/* Connection Line on desktop */}
                      <div className="hidden md:block absolute top-[44px] left-8 right-8 h-0.5 bg-slate-200/60 z-0"></div>

                      {/* Step 1 */}
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-white rounded-full border-2 border-blue-500 text-blue-600 font-black text-lg flex items-center justify-center shadow-md mb-4">
                          1
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-base mb-1.5">Daftar Akun</h3>
                        <p className="text-xs text-slate-500 max-w-[200px]">Isi formulir pendaftaran akun baru dengan data WhatsApp aktif Anda.</p>
                      </div>

                      {/* Step 2 */}
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-white rounded-full border-2 border-blue-500 text-blue-600 font-black text-lg flex items-center justify-center shadow-md mb-4">
                          2
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-base mb-1.5">Transfer Rp150.000</h3>
                        <p className="text-xs text-slate-500 max-w-[200px]">Transfer pembayaran registrasi sesuai bank yang tertera.</p>
                      </div>

                      {/* Step 3 */}
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-white rounded-full border-2 border-blue-500 text-blue-600 font-black text-lg flex items-center justify-center shadow-md mb-4">
                          3
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-base mb-1.5">Aktivasi Admin</h3>
                        <p className="text-xs text-slate-500 max-w-[200px]">Admin melakukan verifikasi pembayaran dan mengaktifkan akun Anda.</p>
                      </div>

                      {/* Step 4 */}
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-cyan-500 text-white rounded-full font-black text-lg flex items-center justify-center shadow-md mb-4">
                          4
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-base mb-1.5">Akses Dashboard</h3>
                        <p className="text-xs text-slate-500 max-w-[200px]">Masuk dan nikmati seluruh suite produksi AI canggih Neuronan.</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
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
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Instruksi Pembayaran</h2>
                    <p className="text-xs text-slate-500 mt-1">Harap selesaikan pembayaran biaya pendaftaran agar admin dapat mengaktifkan akun Anda.</p>
                  </div>

                  {/* Payment Details Box */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 space-y-4">
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Jumlah Transfer</span>
                      <p className="text-3xl font-black bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent mt-1">Rp150.000</p>
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
                      <p className="leading-relaxed">Transfer persis sebesar <strong>Rp150.000</strong> ke rekening di atas menggunakan mobile banking, ATM, atau e-wallet.</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-5 h-5 bg-blue-50 text-blue-600 font-extrabold rounded-full flex items-center justify-center shrink-0">2</span>
                      <p className="leading-relaxed">Gunakan nama yang sama dengan pendaftaran pada detail transfer jika memungkinkan, atau simpan resi transfer Anda.</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="w-5 h-5 bg-blue-50 text-blue-600 font-extrabold rounded-full flex items-center justify-center shrink-0">3</span>
                      <p className="leading-relaxed">Admin akan memvalidasi pembayaran Anda dalam waktu maks. 1x24 jam. Setelah diaktifkan, Anda akan langsung dialihkan ke dashboard.</p>
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
                {/* Header with Navigation for Member */}
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-8">
                  
                  {/* Header Intro */}
                  <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
                    <BrainCircuit className="w-10 h-10 text-white" />
                  </div>
                  
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-800 font-bold text-xs mb-4">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Akses Otentikasi Berhasil</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight mb-10">
                    Halo selamat datang, <span className="bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">{userProfile?.namaLengkap || 'Member'}</span>
                  </h1>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-5xl text-left">
                    {/* CARD 1: AI Studio */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                            <BrainCircuit className="w-7 h-7 text-blue-600" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-slate-800">Ruang Kerja AI Studio</h2>
                            <p className="text-xs font-bold text-blue-600">Generator & AI Rendering</p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                          Ruang kerja AI Studio Anda telah siap. Karena alasan keamanan dan sinkronisasi, Anda akan diarahkan ke environment studio khusus kami.
                        </p>
                      </div>

                      <div className="mt-auto">
                        <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                          <a 
                            href="https://share.gemini.google/rxUpHiJSGTCo" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-[15px] rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 w-full"
                          >
                            Buka AI Studio <ExternalLink className="w-4 h-4 shrink-0" />
                          </a>
                          
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText('https://share.gemini.google/rxUpHiJSGTCo');
                              showToast('Link berhasil disalin!', 'success');
                            }}
                            className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[15px] rounded-xl transition-all flex items-center justify-center gap-2 w-full"
                          >
                            <Copy className="w-4 h-4 shrink-0" />
                            Salin Link
                          </button>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-xs leading-relaxed">
                          <strong className="block mb-1">Catatan Penting:</strong> Jika tombol "Buka AI Studio" tidak berfungsi karena keamanan browser, klik <strong>Salin Link</strong> dan paste (tempel) di tab baru. Harap jangan bagikan URL kepada non-member.
                        </div>
                      </div>
                    </div>

                    {/* CARD 2: OpenCut */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0">
                            <Video className="w-7 h-7 text-purple-600" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-slate-800">Edit Video</h2>
                            <p className="text-xs font-bold text-purple-600">Powered by OpenCut</p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                          Alat editor video gratis terintegrasi. Fitur ini dapat digunakan untuk <strong>menggabungkan semua scene video</strong> hasil render AI, menyesuaikan transisi, dan menambahkan <strong>teks narasi TikTok</strong> dengan mudah.
                        </p>
                      </div>

                      <div className="flex mt-auto">
                        <button
                          onClick={() => setUserDashboardTab('video_editor')}
                          className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold text-[15px] rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2 w-full"
                        >
                          Buka Editor Video (OpenCut) <Video className="w-4 h-4 shrink-0" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}
            
            {/* VIDEO EDITOR STUDIO TAB */}
            {activeTab === 'user_dashboard' && userDashboardTab === 'video_editor' && (
              <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
                <VideoEditor 
                  onBack={() => setUserDashboardTab('overview')} 
                  showToast={(msg, type) => showToast(msg, type || 'success')} 
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <p>&copy; {new Date().getFullYear()} Neurona. All rights reserved.</p>
          <div className="flex gap-4">
            <button onClick={() => navigateTo('/')} className="hover:text-slate-600 transition-colors">Beranda</button>
            <button onClick={() => navigateTo('/admin')} className="hover:text-slate-600 transition-colors font-bold text-blue-500 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Area Admin</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
