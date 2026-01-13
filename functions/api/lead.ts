interface Env {
    RESEND_API_KEY: string;
    EMAIL_TO: string;
    EMAIL_FROM: string;
}

interface CFContext {
    request: Request;
    env: Env;
}

export const onRequestPost = async (context: CFContext): Promise<Response> => {
    try {
        const data: any = await context.request.json();

        // Generate leadId
        const leadId = crypto.randomUUID();

        // 1. Validate required fields
        const required = ['email', 'first_name', 'location', 'main_goal', 'start_timing', 'biggest_blocker', 'training_days_current', 'time_commitment_weekly', 'monthly_investment', 'coaching_preference', 'constraints', 'wants_upload', 'consent'];
        for (const field of required) {
            if (!data[field]) {
                return new Response(JSON.stringify({ ok: false, error: `Missing required field: ${field}` }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // 2. Honeypot check
        if (data.company) {
            return new Response(JSON.stringify({ ok: true, message: 'Spam filtered' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 3. Compose Email
        const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333; border-bottom: 2px solid #000; padding-bottom: 10px;">New Performance Audit Lead</h2>
        
        <div style="margin: 20px 0;">
          <p><strong>Contact:</strong> ${data.first_name} (${data.email})</p>
          <p><strong>Location:</strong> ${data.location}</p>
        </div>

        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
          <h3 style="margin-top: 0;">Goal & Urgency</h3>
          <p><strong>Main Goal:</strong> ${data.main_goal}</p>
          <p><strong>Start Timing:</strong> ${data.start_timing}</p>
          <p><strong>Biggest Blocker:</strong> ${data.biggest_blocker}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3>Program Fit</h3>
          <p><strong>Training Days/Week:</strong> ${data.training_days_current}</p>
          <p><strong>Weekly Available:</strong> ${data.time_commitment_weekly}</p>
          <p><strong>Monthly Investment:</strong> ${data.monthly_investment}</p>
          <p><strong>Coaching Preference:</strong> ${data.coaching_preference}</p>
          <p><strong>Constraints:</strong> ${data.constraints}</p>
          <p><strong>Wants Upload:</strong> ${data.wants_upload || 'No'}</p>
        </div>

        <p style="font-size: 10px; color: #999; margin-top: 30px;">
          Submitted at ${new Date().toISOString()} | PT Authority Hub Native Quiz
        </p>
      </div>
    `;

        // 4. Send via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${context.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: context.env.EMAIL_FROM,
                to: [context.env.EMAIL_TO],
                subject: `New Lead: ${data.first_name} - ${data.main_goal}`,
                html: emailHtml
            })
        });

        if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            throw new Error(`Resend API Error: ${errorText}`);
        }

        return new Response(JSON.stringify({ ok: true, leadId: leadId }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ ok: false, error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
