import { GoogleGenAI } from "@google/genai";
import { Section } from "../../types";

class GeminiServiceClass {
  private ai: GoogleGenAI;
  private cache = new Map<string, any>();

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });
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
        titleFont: index === 0 ? 'wide' : 'montserrat',
        bodyFont: 'montserrat',
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

  async generateTitleVariations(title: string, context: string): Promise<string[]> {
    return this.retryWithBackoff(async () => {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: {
          parts: [{
            text: `Você é um especialista em headlines virais para carrosséis do Instagram.

Gere 4 variações criativas do headline abaixo, mantendo o impacto e a essência do conteúdo.

Headline original: "${title}"
Contexto do slide: "${context}"

REGRAS:
1. SEMPRE em CAIXA ALTA
2. Máximo 15 palavras cada
3. Use números concretos se o contexto tiver
4. Pode usar fórmulas: Número Chocante, Rejeição→Vingança, Contrarian, Bastidor
5. Retorne APENAS um JSON array com as 4 variações, sem explicações`
          }]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      });
      return JSON.parse(response.text.trim()) as string[];
    });
  }

  async generateImageForSection(prompt: string, context: string): Promise<string> {
    return this.retryWithBackoff(async () => {
      const response = await this.ai.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: `${prompt}. Style: modern, professional, eye-catching, suitable for Instagram. Context: ${context}`,
        config: {
          numberOfImages: 1,
          aspectRatio: '3:4',
        },
      });

      const imgBytes = response.generatedImages?.[0]?.image?.imageBytes;
      if (imgBytes) {
        return `data:image/png;base64,${imgBytes}`;
      }
      console.error('generateImages response:', JSON.stringify(response));
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
