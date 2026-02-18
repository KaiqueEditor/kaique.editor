import { GoogleGenAI } from "@google/genai";
import { Section } from "../../types";

class GeminiServiceClass {
  private ai: GoogleGenAI;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private cache = new Map<string, any>();

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error = new Error('Unknown error');

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        if (error?.status === 429 || error?.message?.includes('429')) {
          const delayMs = Math.pow(2, i) * 2000;
          console.warn(`Rate limit hit. Retrying in ${delayMs}ms...`);
          await this.delay(delayMs);
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }

  async splitTextIntoSections(text: string, numSlides: number): Promise<Section[]> {
    const cacheKey = `split:${text}:${numSlides}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = await this.retryWithBackoff(async () => {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [{
            text: `Você é um especialista em storytelling para redes sociais.

Divida o seguinte texto em ${numSlides} slides virais para um carrossel do Instagram:

"${text}"

REGRAS:
1. O primeiro slide deve ser uma CAPA impactante com título curto e chamativo
2. Os slides seguintes devem contar uma história fluida
3. Cada slide precisa de:
   - title: texto grande (máximo 15 palavras)
   - content: texto complementar (máximo 30 palavras)
   - imagePrompt: descrição para gerar imagem (em inglês, detalhada)

Retorne APENAS um JSON array válido, sem explicações.`
          }]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" },
                imagePrompt: { type: "string" }
              },
              required: ["title", "content", "imagePrompt"]
            }
          }
        },
      });

      const parsed = JSON.parse(response.text.trim());
      return parsed.map((item: any, index: number) => ({
        id: `section-${index}-${Date.now()}`,
        title: item.title,
        content: item.content,
        imagePrompt: item.imagePrompt,
        alignment: index === 0 ? 'center' : 'left',
        layoutType: 'storytelling',
        titleFont: index === 0 ? 'druk' : 'anton',
        bodyFont: 'sans',
        bgColor: '#000000',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        brandingColor: '#ffffff',
        titleSize: index === 0 ? 40 : 30,
        bodySize: 20,
        imagePosX: 50,
        imagePosY: 50,
        imageScale: 1,
        overlayOpacity: 0.4,
        textPosY: 85,
        showSocialImage: true,
      } as Section));
    });

    this.cache.set(cacheKey, result);
    return result;
  }

  async generateImageForSection(prompt: string, context: string): Promise<string> {
    return this.retryWithBackoff(async () => {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{
            text: `Create a high-quality, visually striking image for a social media carousel slide.

Prompt: ${prompt}
Context: ${context}

Style: modern, professional, eye-catching, suitable for Instagram
Quality: high resolution, vibrant colors, good contrast
Composition: centered subject, rule of thirds, visually balanced`
          }],
        },
        config: {
          imageConfig: { aspectRatio: "3:4" }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error('No image generated');
    });
  }
}

export const geminiService = new GeminiServiceClass();

// Backward compatibility exports
export const splitTextIntoSections = (text: string, numSlides: number) =>
  geminiService.splitTextIntoSections(text, numSlides);

export const generateImageForSection = (prompt: string, context: string) =>
  geminiService.generateImageForSection(prompt, context);
