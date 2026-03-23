import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { method, path, body } = await req.json();

    // Fetch Jira connection for this user
    const { data: conn, error: connError } = await supabase
      .from("jira_connections")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (connError || !conn) {
      return new Response(JSON.stringify({ error: "No Jira connection configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = conn.base_url.replace(/\/$/, "");
    const jiraUrl = `${baseUrl}/rest/api/3/${path}`;
    const credentials = btoa(`${conn.email}:${conn.api_token}`);

    const jiraRes = await fetch(jiraUrl, {
      method: method || "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = jiraRes.ok ? await jiraRes.json().catch(() => ({})) : await jiraRes.text();

    // Update last_sync_at
    if (method === "GET") {
      await supabase.from("jira_connections")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }

    return new Response(JSON.stringify(data), {
      status: jiraRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
