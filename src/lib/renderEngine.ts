import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface RenderClip {
  id: string;
  type: 'video' | 'image';
  url: string;
  duration: number;
}

export class RenderEngine {
  private ffmpeg: FFmpeg;
  private isLoaded: boolean = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async load() {
    if (this.isLoaded) return;
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    
    try {
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      this.isLoaded = true;
    } catch (e) {
      console.error("Error loading FFmpeg:", e);
      throw new Error("Failed to load rendering engine. Please ensure you have a stable connection.");
    }
  }

  async exportVideo(clips: RenderClip[], onProgress: (progress: number) => void): Promise<Blob> {
    await this.load();

    this.ffmpeg.on('progress', ({ progress }) => {
      onProgress(progress * 100);
    });

    const args: string[] = [];
    let filterComplex = '';

    // Write input files
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const filename = `input_${i}_original`;
      const ext = clip.type === 'video' ? 'mp4' : 'jpg'; // fallback
      const fullFilename = `${filename}.${ext}`;
      
      const fileData = await fetchFile(clip.url);
      await this.ffmpeg.writeFile(fullFilename, fileData);

      // Pre-process each input to standard 720x1280
      if (clip.type === 'image') {
        args.push('-loop', '1', '-t', clip.duration.toString(), '-i', fullFilename);
      } else {
        args.push('-i', fullFilename);
      }
      
      // Scaling and padding filter for each video/image stream to ensure 9:16 (720x1280) and 30 fps
      filterComplex += `[${i}:v]scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v${i}];\n`;
    }

    // Concat all streams
    let concatInputs = '';
    for (let i = 0; i < clips.length; i++) {
      concatInputs += `[v${i}]`;
    }
    filterComplex += `${concatInputs}concat=n=${clips.length}:v=1:a=0[outv]`;

    args.push('-filter_complex', filterComplex);
    args.push('-map', '[outv]');
    args.push('-c:v', 'libx264');
    args.push('-pix_fmt', 'yuv420p');
    args.push('output.mp4');

    console.log("FFmpeg Executing Args:", args.join(' '));
    const result = await this.ffmpeg.exec(args);
    
    if (result !== 0) {
      throw new Error("FFmpeg rendering failed");
    }
    
    const data = await this.ffmpeg.readFile('output.mp4');
    
    // Cleanup FS
    try {
      this.ffmpeg.deleteFile('output.mp4');
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const ext = clip.type === 'video' ? 'mp4' : 'jpg';
        this.ffmpeg.deleteFile(`input_${i}_original.${ext}`);
      }
    } catch (e) {
      console.warn("Cleanup failed, ignoring...", e);
    }

    return new Blob([data as Uint8Array], { type: 'video/mp4' });
  }
}

export const renderEngine = new RenderEngine();
