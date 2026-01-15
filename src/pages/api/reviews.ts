import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
    const env = locals.runtime.env as {
        GOOGLE_PLACES_API_KEY?: string;
        GOOGLE_PLACE_ID?: string;
    };

    const API_KEY = env.GOOGLE_PLACES_API_KEY;
    const PLACE_ID = env.GOOGLE_PLACE_ID;

    // Fallback if env vars are missing
    if (!API_KEY || !PLACE_ID) {
        return new Response(JSON.stringify({
            status: 'fallback',
            message: 'Service currently unavailable',
            data: {
                rating: 4.9,
                user_ratings_total: 214,
                reviews: []
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Note: Cloudflare Pages caching via caches.default is not available in Astro
    // Consider using Cloudflare's Cache API directly or implementing a different caching strategy

    console.log('Fetching fresh Google Reviews data...');
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&key=${API_KEY}`;

    try {
        const apiResponse = await fetch(url);
        const data = await apiResponse.json();

        if (data.status !== 'OK') {
            throw new Error(`Google API returned ${data.status}: ${data.error_message || 'Unknown error'}`);
        }

        const result = {
            status: 'ok',
            data: {
                rating: data.result.rating,
                user_ratings_total: data.result.user_ratings_total,
                reviews: data.result.reviews || []
            }
        };

        return new Response(JSON.stringify(result), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=43200', // 12 hours
            }
        });
    } catch (error: any) {
        console.error('Error fetching Google Reviews:', error);
        return new Response(JSON.stringify({
            status: 'error',
            message: error.message,
            data: {
                rating: 4.9,
                user_ratings_total: 214,
                reviews: []
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
