import { Section } from "../../types";

class GeminiServiceClass {
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async splitTextIntoSections(text: string, numSlides: number): Promise<Section[]> {
    await this.delay(1000);
    // Mock response
    return Array.from({ length: numSlides }).map((_, index) => ({
      id: `section-${index}-${Date.now()}`,
      title: index === 0 ? "Título Gerado Offline" : `Tópico ${index}`,
      content: "O serviço de IA está rodando em modo offline restrito. A geração inteligente está desabilitada na sua máquina local.",
      imagePrompt: "business man smiling",
      alignment: index === 0 ? 'center' : 'left',
      layoutType: 'storytelling',
      titleFont: index === 0 ? 'bebas-neue' : 'sans',
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
  }

  async generateTitleVariations(title: string, context: string): Promise<string[]> {
    await this.delay(1000);
    return [
      `OFFLINE: ${title.toUpperCase()}`,
      "O SEGREDO DA IA FOI DESLIGADO",
      "COMO CRIAR 100% OFFLINE",
      "ESTE TÍTULO É FAKE"
    ];
  }

  async generateImageForSection(prompt: string, context: string): Promise<string> {
    await this.delay(2000);
    // Return a dummy base64 pixel or simply throw to mock offline failure. Let's throw an error to fail gracefully.
    throw new Error('A geração de imagens com Imagen 3.0 está desativada no modo local.');
  }

  async generateCaption(slides: { title: string; content: string }[]): Promise<string> {
    await this.delay(1000);
    return `O serviço de transcrição inteligente e copywriting está desligado no modo de desenvolvimento local.\n#offline #carrosselpro`;
  }
}

export const geminiService = new GeminiServiceClass();

// Backward compatibility exports
export const splitTextIntoSections = (text: string, numSlides: number) =>
  geminiService.splitTextIntoSections(text, numSlides);

export const generateImageForSection = (prompt: string, context: string) =>
  geminiService.generateImageForSection(prompt, context);
