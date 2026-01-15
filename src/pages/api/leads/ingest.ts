export const prerender = false;

import type { APIRoute } from "astro";

interface LeadPayload {
    email: string;
    first_name?: string;
    location?: string;
    main_goal?: string;
    start_timing?: string;
    biggest_blocker?: string;
    training_days_current?: string;
    time_commitment_weekly?: string;
    monthly_investment?: string;
    coaching_preference?: string;
    constraints?: string;
    wants _upload ?: string;
consent: string;
}

// Scoring Logic
function computeTriageScore(data: LeadPayload): { score: number; segment: string; fitRisk: boolean } {
    let score = 0;
    let fitRisk = false;

    // A) Urgency
    switch (data.start_timing) {
        case 'This Week': score += 25; break;
        case 'In 2-3 Weeks': score += 18; break;
        case 'In 4-6 Weeks': score += 10; break;
        case 'Just Researching': score += 0; break;
    }

    // B) Budget
    switch (data.monthly_investment) {
        case '£600+': score += 25; break;
        case '£300-600': score += 18; break;
        case '£150-300': score += 10; break;
        case 'Under £150': score += 3; break;
        case 'Not Sure': score += 5; break;
    }

    // C) Time commitment
    switch (data.time_commitment_weekly) {
        case '5+ hours': score += 10; break;
        case '3-5 hours': score += 8; break;
        case '2-3 hours': score += 5; break;
        case '1-2 hours': score += 2; break;
    }

    // D) Training days
    switch (data.training_days_current) {
        case '4-5 days': score += 6; break;
        case '6+ days': score += 5; break;
        case '2-3 days': score += 4; break;
        case '0-1 days': score += 3; break;
    }

    // E) Coaching fit
    if (data.coaching_preference === 'Not Sure') {
        score += 6;
    } else {
        score += 10;
    }

    // F) Location fit
    const isLondon = data.location?.toLowerCase().includes('london') || false;
    if (data.coaching_preference === 'In-Person (London)') {
        if (isLondon) {
            score += 5;
        } else {
            fitRisk = true;
        }
    }

    // G) Upload intent
    if (data.wants_upload === 'Yes') {
        score += 6;
    }

    // Determine segment
    let segment = 'NURTURE';
    const isDisqualified = fitRisk && data.coaching_preference === 'In-Person (London)' && !isLondon;

    if (isDisqualified) {
        segment = 'DISQUALIFIED';
    } else if (score >= 70 && data.start_timing !== 'Just Researching' &&
        (data.monthly_investment === '£300-600' || data.monthly_investment === '£600+' ||
            (data.monthly_investment === 'Not Sure' && data.start_timing === 'This Week'))) {
        segment = 'HOT';
    } else if (score >= 40 && score < 70) {
        segment = 'WARM';
    }

    return { score, segment, fitRisk };
}

// Bottleneck Inference with Explainability
interface BottleneckResult {
    bottleneck: string;
    confidence: string;
    reasons: string[];
    breakdown: Record<string, number>;
}

function inferBottleneck(data: LeadPayload, wantsUpload: boolean): BottleneckResult {
    const reasons: string[] = [];
    const hasInjury = data.constraints &&
        (data.constraints.includes('Past Injury') || data.constraints.includes('Current Issue'));

    if (hasInjury) {
        reasons.push('Injury or physical constraint reported');
        reasons.push('Priority: address movement limitations before programming');
        return {
            bottleneck: 'INJURY_CONSTRAINTS',
            confidence: 'HIGH',
            reasons,
            breakdown: { INJURY_CONSTRAINTS: 10 }
        };
    }

    const points = {
        TRAINING: 0,
        CONSISTENCY: 0,
        NUTRITION: 0,
        RECOVERY: 0
    };

    // Reason mapping for explainability
    const reasonMap: Record<string, string[]> = {
        TRAINING: [],
        CONSISTENCY: [],
        NUTRITION: [],
        RECOVERY: []
    };

    switch (data.biggest_blocker) {
        case 'Results Not Happening':
            points.TRAINING += 5;
            reasonMap.TRAINING.push('Reported results plateau despite training');
            break;
        case 'Conflicting Advice':
            points.TRAINING += 5;
            reasonMap.TRAINING.push('Confusion from conflicting training advice');
            break;
        case "Can't Stay Consistent":
            points.CONSISTENCY += 5;
            reasonMap.CONSISTENCY.push('Self-identified consistency as main barrier');
            break;
        case 'Time Constraints':
            points.CONSISTENCY += 3;
            points.TRAINING += 2;
            reasonMap.CONSISTENCY.push('Time constraints limiting consistency');
            reasonMap.TRAINING.push('Time constraints requiring efficient programming');
            break;
        case 'Nutrition Consistency':
            points.NUTRITION += 6;
            reasonMap.NUTRITION.push('Nutrition consistency identified as main blocker');
            break;
        case 'Low Energy/Recovery/Stress':
            points.RECOVERY += 6;
            reasonMap.RECOVERY.push('Energy, recovery, or stress issues reported');
            break;
    }

    if (data.training_days_current === '0-1 days') {
        points.CONSISTENCY += 2;
        reasonMap.CONSISTENCY.push('Very low training frequency (0-1 days/week)');
    }

    if ((data.training_days_current === '4-5 days' || data.training_days_current === '6+ days') &&
        data.biggest_blocker === 'Low Energy/Recovery/Stress') {
        points.RECOVERY += 2;
        reasonMap.RECOVERY.push('High training volume paired with recovery issues');
    }

    if (data.main_goal === 'Lose Fat' &&
        (data.biggest_blocker === 'Results Not Happening' || data.biggest_blocker === 'Nutrition Consistency')) {
        points.NUTRITION += 2;
        reasonMap.NUTRITION.push('Fat loss goal with nutrition-related challenges');
    }

    const sorted = Object.entries(points).sort((a, b) => b[1] - a[1]);
    const best = sorted[0];
    const secondBest = sorted[1];
    const diff = best[1] - secondBest[1];

    let confidence = 'LOW';
    if (diff >= 3) {
        confidence = 'HIGH';
    } else if (diff === 2) {
        confidence = 'MEDIUM';
    }

    if (confidence === 'LOW' && wantsUpload) {
        confidence = 'MEDIUM';
        reasons.push('Confidence increased: client providing training data for review');
    }

    // Determine bottleneck - use ASSESSMENT_NEEDED instead of UNKNOWN
    const bottleneck = best[1] > 0 ? best[0] : 'ASSESSMENT_NEEDED';

    // Collect top reasons for the identified bottleneck
    if (bottleneck !== 'ASSESSMENT_NEEDED') {
        reasons.push(...reasonMap[bottleneck]);
        // Add runner-up reason if close
        if (diff <= 2 && secondBest[1] > 0 && reasonMap[secondBest[0]].length > 0) {
            reasons.push(`Secondary factor: ${reasonMap[secondBest[0]][0]}`);
        }
    } else {
        reasons.push('Insufficient data to determine primary bottleneck');
        reasons.push('Recommend discovery call or additional assessment');
    }

    return {
        bottleneck,
        confidence,
        reasons: reasons.slice(0, 3), // Top 3 reasons
        breakdown: points
    };
}


export const POST: APIRoute = async (context) => {
    try {
        const env = context.locals.runtime?.env;
        const DB = env?.DB;
        const WORKSPACE_ID = env?.WORKSPACE_ID;
        const RESEND_API_KEY = env?.RESEND_API_KEY;
        const EMAIL_FROM = env?.EMAIL_FROM;
        const EMAIL_TO = env?.EMAIL_TO;

        if (!DB) {
            return new Response(JSON.stringify({ ok: false, error: 'Database not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data: LeadPayload = await context.request.json();

        // Validate required fields
        const required = ['email', 'consent'];
        for (const field of required) {
            if (!data[field as keyof LeadPayload]) {
                return new Response(JSON.stringify({ ok: false, error: `Missing required field: ${field}` }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        if (!data.email.includes('@')) {
            return new Response(JSON.stringify({ ok: false, error: 'Invalid email format' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generate IDs and tokens
        const leadId = crypto.randomUUID();
        const leadToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');

        // Hash the lead token
        const encoder = new TextEncoder();
        const tokenData = encoder.encode(leadToken);
        const hashBuffer = await crypto.subtle.digest('SHA-256', tokenData);
        const leadTokenHash = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        // Compute triage
        const wantsUpload = data.wants_upload === 'Yes';
        const { score, segment, fitRisk } = computeTriageScore(data);
        const { bottleneck, confidence, reasons, breakdown } = inferBottleneck(data, wantsUpload);

        // Prepare injury data
        const injuryFlag = data.constraints &&
            (data.constraints.includes('Past Injury') || data.constraints.includes('Current Issue')) ? 1 : 0;
        const injuryNotes = injuryFlag ? data.constraints : null;

        // Store answers as JSON
        const answersRawJson = JSON.stringify(data);

        // Determine upload status
        const uploadStatus = wantsUpload ? 'PENDING' : 'NONE';

        if (!WORKSPACE_ID) {
            console.error('WORKSPACE_ID not configured');
        }

        // Insert into database
        await DB.prepare(`
            INSERT INTO leads (
                id, workspace_id, client_email, client_first_name, client_location,
                goal, start_timeline, biggest_blocker, training_days_now, time_commitment_weekly,
                budget_monthly, coaching_preference, injury_flag, injury_notes, wants_upload_stats,
                upload_status, triage_score, triage_segment, inferred_bottleneck, inferred_confidence,
                bottleneck_reasons, bottleneck_breakdown, bottleneck_version,
                lead_token_hash, answers_raw_json, status, created_at, updated_at
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, datetime('now'), datetime('now')
            )
        `).bind(
            leadId,
            WORKSPACE_ID || 'default',
            data.email,
            data.first_name || null,
            data.location || null,
            data.main_goal || null,
            data.start_timing || null,
            data.biggest_blocker || null,
            data.training_days_current || null,
            data.time_commitment_weekly || null,
            data.monthly_investment || null,
            data.coaching_preference || null,
            injuryFlag,
            injuryNotes,
            wantsUpload ? 1 : 0,
            uploadStatus,
            score,
            segment,
            bottleneck,
            confidence,
            JSON.stringify(reasons),
            JSON.stringify(breakdown),
            1, // bottleneck_version
            leadTokenHash,
            answersRawJson,
            'NEW'
        ).run();

        // Send notification email
        if (RESEND_API_KEY && EMAIL_FROM && EMAIL_TO) {
            try {
                const emailHtml = `
                    <h2>New Lead: ${data.first_name || 'Unknown'} - ${data.main_goal || 'No Goal'}</h2>
                    <p><strong>Lead ID:</strong> ${leadId}</p>
                    <p><strong>Triage:</strong> ${segment} (Score: ${score})</p>
                    <p><strong>Bottleneck:</strong> ${bottleneck} (${confidence} confidence)</p>
                    <hr>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Name:</strong> ${data.first_name || 'N/A'}</p>
                    <p><strong>Location:</strong> ${data.location || 'N/A'}</p>
                    <hr>
                    <p><strong>Main Goal:</strong> ${data.main_goal || 'N/A'}</p>
                    <p><strong>Start Timing:</strong> ${data.start_timing || 'N/A'}</p>
                    <p><strong>Biggest Blocker:</strong> ${data.biggest_blocker || 'N/A'}</p>
                    <p><strong>Training Days/Week:</strong> ${data.training_days_current || 'N/A'}</p>
                    <p><strong>Weekly Available:</strong> ${data.time_commitment_weekly || 'N/A'}</p>
                    <p><strong>Monthly Investment:</strong> ${data.monthly_investment || 'N/A'}</p>
                    <p><strong>Coaching Preference:</strong> ${data.coaching_preference || 'N/A'}</p>
                    <p><strong>Constraints:</strong> ${data.constraints || 'None'}</p>
                    <p><strong>Wants Upload:</strong> ${data.wants_upload || 'No'}</p>
                `;

                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: EMAIL_FROM,
                        to: EMAIL_TO,
                        subject: `New Lead: ${data.first_name || 'Unknown'} - ${data.main_goal || 'No Goal'}`,
                        html: emailHtml
                    })
                });
            } catch (emailError) {
                console.error('Email notification failed:', emailError);
            }
        }

        return new Response(JSON.stringify({
            ok: true,
            leadId: leadId,
            leadToken: leadToken,
            triageSegment: segment,
            uploadRequired: wantsUpload
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Lead Ingest Error:', error);
        return new Response(JSON.stringify({
            ok: false,
            error: 'Failed to process lead: ' + (error.message || 'Unknown error')
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
