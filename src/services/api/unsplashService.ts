const UNSPLASH_ACCESS_KEY = (import.meta as any).env?.VITE_UNSPLASH_ACCESS_KEY || '';
const BASE_URL = 'https://api.unsplash.com';

export interface UnsplashPhoto {
    id: string;
    urls: {
        raw: string;
        full: string;
        regular: string;  // 1080px — ideal pra slides
        small: string;    // 400px — thumbnail
        thumb: string;    // 200px
    };
    alt_description: string | null;
    user: {
        name: string;
        links: { html: string };
    };
    width: number;
    height: number;
    color: string; // dominant color hex
}

interface UnsplashSearchResult {
    total: number;
    total_pages: number;
    results: UnsplashPhoto[];
}

export const searchUnsplashPhotos = async (
    query: string,
    page = 1,
    perPage = 20,
    orientation?: 'landscape' | 'portrait' | 'squarish'
): Promise<UnsplashSearchResult> => {
    if (!UNSPLASH_ACCESS_KEY) {
        throw new Error('Unsplash API key não configurada');
    }

    const params = new URLSearchParams({
        query,
        page: String(page),
        per_page: String(perPage),
        ...(orientation ? { orientation } : {}),
    });

    const res = await fetch(`${BASE_URL}/search/photos?${params}`, {
        headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });

    if (!res.ok) {
        throw new Error(`Unsplash API error: ${res.status}`);
    }

    return res.json();
};

// Obrigação do Unsplash: registrar download quando usar a foto
export const triggerUnsplashDownload = async (photoId: string) => {
    if (!UNSPLASH_ACCESS_KEY) return;

    try {
        await fetch(`${BASE_URL}/photos/${photoId}/download`, {
            headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
        });
    } catch {
        // silently fail — it's just a tracking ping
    }
};
