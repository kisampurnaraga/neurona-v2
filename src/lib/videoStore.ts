import { get, set } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  mimeType: string;
  data: ArrayBuffer; // Stored as ArrayBuffer in IndexedDB
  duration?: number;
}

export interface SavedProject {
  id: string;
  clips: any[];
  texts: any[];
  lastModified: number;
}

const MEDIA_STORE_KEY = 'neurona_media_assets';
const PROJECT_STORE_KEY = 'neurona_video_project';

export const VideoStore = {
  async saveMedia(file: File): Promise<MediaAsset> {
    const arrayBuffer = await file.arrayBuffer();
    
    // Determine type by mime
    let type: 'video' | 'image' | 'audio' = 'video';
    if (file.type.startsWith('image/')) type = 'image';
    if (file.type.startsWith('audio/')) type = 'audio';

    const asset: MediaAsset = {
      id: uuidv4(),
      name: file.name,
      type,
      mimeType: file.type,
      data: arrayBuffer,
      duration: type === 'image' ? 5 : undefined // default 5s for image
    };

    const currentAssets = (await get<MediaAsset[]>(MEDIA_STORE_KEY)) || [];
    currentAssets.push(asset);
    await set(MEDIA_STORE_KEY, currentAssets);
    
    return asset;
  },

  async loadMediaAssets(): Promise<MediaAsset[]> {
    return (await get<MediaAsset[]>(MEDIA_STORE_KEY)) || [];
  },
  
  async deleteMedia(id: string) {
    const currentAssets = (await get<MediaAsset[]>(MEDIA_STORE_KEY)) || [];
    const newAssets = currentAssets.filter(a => a.id !== id);
    await set(MEDIA_STORE_KEY, newAssets);
  },

  async saveProject(clips: any[], texts: any[]) {
    // We only save the metadata, not the heavy blobs. The media references are stored as ids in clips
    const project: SavedProject = {
      id: 'default_project',
      clips,
      texts,
      lastModified: Date.now()
    };
    await set(PROJECT_STORE_KEY, project);
  },

  async loadProject(): Promise<SavedProject | undefined> {
    return await get<SavedProject>(PROJECT_STORE_KEY);
  },
  
  createBlobUrl(asset: MediaAsset): string {
    const blob = new Blob([asset.data], { type: asset.mimeType });
    return URL.createObjectURL(blob);
  }
};
