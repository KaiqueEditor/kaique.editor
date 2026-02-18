/**
 * Enhanced SynthID Bypass Algorithm
 * Pixel-level noise injection to preserve structural integrity
 */
export async function applySynthidBypass(dataUrl: string): Promise<string> {
  const PASSES = 3;
  const NOISE_STRENGTH = 2.5;

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

        ctx.filter = `blur(0.3px) brightness(1.01) contrast(0.98)`;
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
        resolve(canvas.toDataURL('image/png', 1.0));
      };
      img.onerror = () => resolve(currentResult);
      img.src = currentResult;
    });
  }

  return currentResult;
}
