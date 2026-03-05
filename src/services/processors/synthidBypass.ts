/**
 * Enhanced SynthID Bypass Algorithm
 * Pixel-level noise injection to preserve structural integrity
 */
export async function applySynthidBypass(dataUrl: string): Promise<string> {
  // Apenas 1 passe e JPEG (0.85) para não estourar o limite de IndexedDB/Memória (PNG 1.0 passava de 20MB)
  const PASSES = 1;
  const NOISE_STRENGTH = 2.0;

  let currentResult = dataUrl;

  for (let pass = 1; pass <= PASSES; pass++) {
    currentResult = await new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(currentResult);
          return;
        }

        ctx.filter = `blur(0.2px) brightness(1.01) contrast(0.99)`;
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * NOISE_STRENGTH;
          data[i] = Math.min(255, Math.max(0, data[i] + noise));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }

        ctx.putImageData(imageData, 0, 0);
        // USE JPEG HERE TO DRASTICALLY REDUCE BASE64 PAYLOAD SIZE BY 10x
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(currentResult);
      img.src = currentResult;
    });
  }

  return currentResult;
}
