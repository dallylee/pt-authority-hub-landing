export const prerender = false;

interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
  EMAIL_TO: string;
  EMAIL_FROM: string;
  WORKSPACE_ID: string;
}

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
  wants_upload?: string;
  consent: string;
}

// Scoring Logic Implementation
function computeTriageScore(data: LeadPayload): { score: number; segment: string; fitRisk: boolean } {
  let score = 0;
  let fitRisk = false;

  // A) Urgency (start_timing)
  switch (data.start_timing) {
    case 'This Week': score += 25; break;
    case 'In 2-3 Weeks': score += 18; break;
    case 'In 4-6 Weeks': score += 10; break;
    case 'Just Researching': score += 0; break;
  }

  // B) Budget (monthly_investment)
  switch (data.monthly_investment) {
    case '£600+': score += 25; break;
    case '£300-600': score += 18; break;
    case '£150-300': score += 10; break;
    case 'Under £150': score += 3; break;
    case 'Not Sure': score += 5; break;
  }

  // C) Time commitment (time_commitment_weekly)
  switch (data.time_commitment_weekly) {
    case '5+ hours': score += 10; break;
    case '3-5 hours': score += 8; break;
    case '2-3 hours': score += 5; break;
    case '1-2 hours': score += 2; break;
  }

  // D) Training days (training_days_current)
  switch (data.training_days_current) {
    case '4-5 days': score += 6; break;
    case '6+ days': score += 5; break;
    case '2-3 days': score += 4; break;
    case '0-1 days': score += 3; break;
  }

  // E) Coaching fit - simplified for now
  if (data.coaching_preference === 'Not Sure') {
    score += 6;
  } else {
    score += 10; // Assume match for simplicity in V1
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

// Bottleneck Inference Logic
function inferBottleneck(data: LeadPayload, wantsUpload: boolean): { bottleneck: string; confidence: string } {
  // Check injury first
  const hasInjury = data.constraints &&
    (data.constraints.includes('Past Injury') || data.constraints.includes('Current Issue'));

  if (hasInjury) {
    return { bottleneck: 'INJURY_CONSTRAINTS', confidence: 'HIGH' };
  }

  // Initialize points
  const points = {
    TRAINING: 0,
    CONSISTENCY: 0,
    NUTRITION: 0,
    RECOVERY: 0
  };

  // Apply signals from biggest_blocker
  switch (data.biggest_blocker) {
    case 'Results Not Happening':
      points.TRAINING += 5;
      break;
    case 'Conflicting Advice':
      points.TRAINING += 5;
      break;
    case "Can't Stay Consistent":
      points.CONSISTENCY += 5;
      break;
    case 'Time Constraints':
      points.CONSISTENCY += 3;
      points.TRAINING += 2;
      break;
    case 'Nutrition Consistency':
      points.NUTRITION += 6;
      break;
    case 'Low Energy/Recovery/Stress':
      points.RECOVERY += 6;
      break;
  }

  // Context modifiers
  if (data.training_days_current === '0-1 days') {
    points.CONSISTENCY += 2;
  }

  if ((data.training_days_current === '4-5 days' || data.training_days_current === '6+ days') &&
    data.biggest_blocker === 'Low Energy/Recovery/Stress') {
    points.RECOVERY += 2;
  }

  if (data.main_goal === 'Lose Fat' &&
    (data.biggest_blocker === 'Results Not Happening' || data.biggest_blocker === 'Nutrition Consistency')) {
    points.NUTRITION += 2;
  }

  // Find best category
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

  // Bump LOW to MEDIUM if wants upload
  if (confidence === 'LOW' && wantsUpload) {
    confidence = 'MEDIUM';
  }

  const bottleneck = best[1] > 0 ? best[0] : 'UNKNOWN';

  return { bottleneck, confidence };
}

import type { APIContext } from 'astro';

export const POST = async (context: APIContext): Promise<Response> => {
  try {
    const env = context.locals.runtime.env as Env;
    if (!env.DB) {
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

    // Validate email format
    if (!data.email.includes('@')) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate IDs and tokens
    const leadId = crypto.randomUUID();
    const leadToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, ''); // 64 char token

    // Hash the lead token for storage
    const encoder = new TextEncoder();
    const tokenData = encoder.encode(leadToken);
    const hashBuffer = await crypto.subtle.digest('SHA-256', tokenData);
    const leadTokenHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compute triage
    const wantsUpload = data.wants_upload === 'Yes';
    const { score, segment, fitRisk } = computeTriageScore(data);
    const { bottleneck, confidence } = inferBottleneck(data, wantsUpload);

    // Prepare injury data
    const injuryFlag = data.constraints &&
      (data.constraints.includes('Past Injury') || data.constraints.includes('Current Issue')) ? 1 : 0;
    const injuryNotes = injuryFlag ? data.constraints : null;

    // Store answers as JSON
    const answersRawJson = JSON.stringify(data);

    // Determine upload status
    const uploadStatus = wantsUpload ? 'PENDING' : 'NONE';

    // Insert into database
    await env.DB.prepare(`
            INSERT INTO leads (
                id, workspace_id, client_email, client_first_name, client_location,
                goal, start_timeline, biggest_blocker, training_days_now, time_commitment_weekly,
                budget_monthly, coaching_preference, injury_flag, injury_notes, wants_upload_stats,
                upload_status, triage_score, triage_segment, inferred_bottleneck, inferred_confidence,
                lead_token_hash, answers_raw_json, status, created_at, updated_at
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, datetime('now'), datetime('now')
            )
        `).bind(
      leadId,
      env.WORKSPACE_ID,
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
      leadTokenHash,
      answersRawJson,
      'NEW'
    ).run();

    // Send notification email (preserve existing behavior)
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
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to: env.EMAIL_TO,
          subject: `New Lead: ${data.first_name || 'Unknown'} - ${data.main_goal || 'No Goal'}`,
          html: emailHtml
        })
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the request if email fails
    }

    return new Response(JSON.stringify({
      ok: true,
      leadId: leadId,
      leadToken: leadToken, // Only returned once
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
