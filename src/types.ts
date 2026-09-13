export interface UserProfile {
  namaLengkap: string;
  email: string;
  whatsapp: string;
  role: 'admin' | 'user';
  status: 'PENDING' | 'ACTIVE';
  createdAt: string;
}

export type ShotType =
  | 'Mix (Variasi Shot)'
  | 'Extreme Wide Shot (EWS)'
  | 'Wide Shot (WS) / Long Shot'
  | 'Full Shot (FS)'
  | 'Medium Wide (MWS) / Cowboy'
  | 'Medium Shot (MS)'
  | 'Medium Close Up (MCU)'
  | 'Close Up (CU)'
  | 'Extreme Close Up (ECU)'
  | 'Macro Shot';

export type CameraType = 'Smartphone (iPhone)' | 'Mirrorless' | 'DSLR Film' | 'Cinematic 8K';
export type AspectRatio = '9:16' | '1:1' | '16:9';
export type PhotoLayout = 'single' | 'grid';

export interface StoryboardSceneItem {
  sceneNumber: number;
  label: string;
  imageUrl: string;
  shotType: ShotType;
  prompt: string;
  videoPrompt: string;
  negativeVideoPrompt: string;
}

export interface StoryboardProject {
  id: string;
  productName: string;
  aspectRatio: AspectRatio;
  shotType: ShotType;
  cameraType: CameraType;
  clothingType: 'default' | 'custom';
  customClothing?: string;
  layout: PhotoLayout;
  imageCount: number;
  interactionPose: string;
  productImages: string[];
  modelImage?: string;
  scenes: StoryboardSceneItem[];
  gridImageUrl?: string;
  tiktokCaption?: string;
  createdAt: string;
}
