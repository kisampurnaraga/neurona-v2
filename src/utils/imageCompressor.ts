/**
 * Utility to compress uploaded image files into high-quality, lightweight WebP/JPEG Base64 data URLs.
 * Stored directly inside Cloud Firestore documents (guaranteeing 100% persistence across container restarts).
 */

export const compressImageFile = (
  file: File,
  maxWidth = 1080,
  maxHeight = 1080,
  quality = 0.78
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('File tidak ditemukan'));
    }

    // Verify it is an image
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File yang dipilih bukan merupakan format gambar yang valid'));
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Maintain aspect ratio while capping at maxWidth and maxHeight
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original read result if canvas 2D is unavailable
          resolve(event.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        try {
          // Prefer WebP for optimal compression ratio
          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            // Fallback to JPEG if WebP is unsupported
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(dataUrl);
        } catch {
          // Fallback to JPEG
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };

      img.onerror = () => {
        reject(new Error('Gagal memproses gambar. Pastikan file gambar tidak korup.'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = (e) => {
      reject(e);
    };

    reader.readAsDataURL(file);
  });
};
