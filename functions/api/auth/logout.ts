export const onRequestPost = async (): Promise<Response> => {
    const headers = new Headers();
    headers.set('Set-Cookie', 'pt_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
    headers.set('Location', '/pt/login');

    return new Response(null, {
        status: 302,
        headers
    });
};
