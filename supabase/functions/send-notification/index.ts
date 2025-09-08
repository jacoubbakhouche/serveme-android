// Updated function to use the modern Firebase V1 API and secure OAuth2 authentication.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.7/mod.ts";

// --- Helper Function to get a Google Auth Access Token ---
async function getAccessToken() {
  const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL');
  const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY');

  if (!clientEmail || !privateKey) {
    throw new Error("Firebase credentials are not set in Supabase secrets.");
  }
  
  // Import the private key
  const key = await crypto.subtle.importKey(
    "pkcs8",
    (new TextEncoder()).encode(privateKey).buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    true,
    ["sign"]
  );

  // Create the JWT
  const jwt = await create(
    { alg: "RS26", typ: "JWT" },
    {
      iss: clientEmail,
      sub: clientEmail,
      aud: "https://oauth2.googleapis.com/token",
      scope: "https://www.googleapis.com/auth/cloud-platform",
      iat: getNumericDate(new Date()),
      exp: getNumericDate(new Date(Date.now() + 3600 * 1000)), // Expires in 1 hour
    },
    key
  );
  
  // Exchange JWT for an access token
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}


// --- Main Server Function ---
serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { receiverId, senderName, messageContent } = await req.json();
    const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
    
    if(!projectId) throw new Error("FIREBASE_PROJECT_ID not set");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', receiverId);

    if (tokenError) throw tokenError;
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: 'No tokens found' }), { status: 200 });
    }

    const accessToken = await getAccessToken();
    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    
    // Send a notification to each token found
    for (const { token } of tokens) {
      const notificationPayload = {
        message: {
          token: token,
          notification: {
            title: `رسالة جديدة من ${senderName}`,
            body: messageContent,
          },
          // Android specific configuration
          android: {
            notification: {
              sound: 'default'
            }
          }
        },
      };

      await fetch(fcmEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(notificationPayload),
      });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' }});
  
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

