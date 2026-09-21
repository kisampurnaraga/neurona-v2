export interface UserProfile {
  namaLengkap: string;
  email: string;
  whatsapp: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  role: 'user' | 'admin';
  createdAt: string;
  referredBy?: string; // Referral code of the affiliate who referred this user
}

export interface AffiliateProfile {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userWhatsapp: string;
  referralCode: string;
  commissionRate: number; // e.g. 40 (meaning 40%)
  productPrice: number; // e.g. 99000
  totalClicks: number;
  totalReferrals: number;
  successfulSales: number;
  totalEarnings: number;
  pendingEarnings: number;
  withdrawnEarnings: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface AffiliateReferral {
  id: string;
  affiliateId: string;
  affiliateCode: string;
  buyerUserId?: string;
  buyerId?: string;
  buyerName: string;
  buyerEmail: string;
  productPrice: number;
  commissionRate?: number;
  commissionAmount: number; // e.g. 39600 (40% of 99000)
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  createdAt: string;
  approvedAt?: string;
}

export interface PaymentSetting {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  whatsappNumber?: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userWhatsapp: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  whatsappNumber: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  updatedAt?: string;
  verifiedAt?: string;
}

export interface PriceSetting {
  normalPrice: number; // e.g. 499000
  promoPrice: number; // e.g. 99000
  flashSaleHours: number; // e.g. 4
  flashSaleMinutes: number; // e.g. 15
  flashSaleEnabled?: boolean; // true/false
  startTime?: string; // ISO date string
  endTime?: string; // ISO date string
  promoEndDate?: string; // Optional custom target ISO string
}

export interface WhatsappSetting {
  phoneNumber: string;
}

export type StudioCategory = 'affiliate' | 'animasi' | 'edukasi' | 'podcast' | 'film';

export interface AiStudioItem {
  id: string;
  category?: StudioCategory;
  name: string;
  tag?: string;
  url: string;
  note: string;
  features?: string[];
  isActive?: boolean;
}

export interface StoryboardSceneShowcase {
  sceneNumber: number;
  imageUrl: string;
  description?: string;
  prompt?: string;
}

export interface ShowcaseItem {
  id: string;
  type?: 'video' | 'storyboard';
  title: string;
  category: string;
  description: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  storyboardScenes?: StoryboardSceneShowcase[];
  published: boolean;
  order: number;
  createdAt: string;
}

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9';
export type CameraType = 'Cinematic' | 'DSLR' | 'Drone' | 'GoPro' | 'Vintage' | 'Smartphone';
export type PhotoLayout = 'Grid' | 'Masonry' | 'Carousel' | 'Single';
export type ShotType = string;

export interface StoryboardSceneItem {
  id: string;
  sceneNumber: number;
  description: string;
  shotType: ShotType;
  prompt: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  imageUrl?: string;
  videoUrl?: string;
}

export interface StoryboardProject {
  id: string;
  title?: string;
  description?: string;
  productName?: string;
  aspectRatio?: AspectRatio;
  shotType?: string;
  cameraType?: string;
  clothingType?: string;
  customClothing?: string;
  layout?: string;
  imageCount?: number;
  interactionPose?: string;
  productImages?: string[];
  modelImage?: string;
  scenes: StoryboardSceneItem[];
  createdAt: string;
  tiktokCaption?: string;
}
