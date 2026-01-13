import type { APIContext } from 'astro';

export const prerender = false;

interface Env {
    GOOGLE_PLACES_API_KEY: string;
    GOOGLE_PLACE_ID: string;
}

export const GET = async (context: APIContext) => {
    const env = context.locals.runtime.env as Env;
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

    const cache = (caches as any).default;
    const cacheKey = new Request(context.request.url);
    let response = await cache.match(cacheKey);

    if (!response) {
        console.log('Fetching fresh Google Reviews data...');
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&key=${API_KEY}`;

        try {
            const apiResponse = await fetch(url);
            const data: any = await apiResponse.json();

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

            response = new Response(JSON.stringify(result), {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=43200', // 12 hours
                }
            });

            // Cache the response
            if (context.locals.runtime.waitUntil) {
                context.locals.runtime.waitUntil(cache.put(cacheKey, response.clone()));
            }
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
    }

    return response;
};
