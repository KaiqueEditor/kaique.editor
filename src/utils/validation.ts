export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Formato não suportado. Use JPEG, PNG, WEBP ou GIF.' };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Arquivo muito grande. Máximo 10MB.' };
  }

  return { valid: true };
};

export const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
  const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
  const byExtension = /\.(mp4|mov|m4v|webm|mkv|avi|wmv|flv|mpeg|mpg|3gp)$/i.test(file.name);

  if (!(file.type.startsWith('video/') || byExtension)) {
    return { valid: false, error: 'Formato não suportado. Escolha um arquivo de vídeo.' };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Vídeo muito grande. Máximo 2GB.' };
  }

  return { valid: true };
};

export const validateHexColor = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

export const sanitizeText = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
