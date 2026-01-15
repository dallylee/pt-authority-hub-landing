import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
    const env = locals.runtime.env as {
        SPOTS_REMAINING?: string;
    };

    // Try to get from env var, default to 3 if not set
    const spotsRemaining = parseInt(env.SPOTS_REMAINING || '3', 10);
    const updatedAt = new Date().toISOString();

    const data = {
        spotsRemaining,
        updatedAt,
        message: spotsRemaining <= 2 ? "High Demand: Secure your spot now" : "Limited Monthly Capacity"
    };

    return new Response(JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache', // Always fresh for the ticker
        }
    });
};
