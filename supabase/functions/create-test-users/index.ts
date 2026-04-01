import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify caller is platform_admin
  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (user) {
      const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: user.id, _role: "platform_admin" });
      if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }
  }

  // Get all clinics
  const { data: clinics } = await supabaseAdmin.from("clinics").select("id, name, owner_email");
  if (!clinics?.length) return new Response(JSON.stringify({ error: "No clinics found" }), { status: 404, headers: corsHeaders });

  const results = [];

  for (const clinic of clinics) {
    const email = `owner_${clinic.id.slice(0, 8)}@teste.com`;
    const password = "teste123456";

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u: any) => u.email === email);

    let userId: string;

    if (existing) {
      userId = existing.id;
      results.push({ clinic: clinic.name, email, status: "already_exists" });
    } else {
      const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) {
        results.push({ clinic: clinic.name, email, status: "error", error: error.message });
        continue;
      }
      userId = newUser.user.id;
      results.push({ clinic: clinic.name, email, password, status: "created" });
    }

    // Ensure role exists
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("clinic_id", clinic.id)
      .eq("role", "clinic_owner")
      .maybeSingle();

    if (!existingRole) {
      await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        clinic_id: clinic.id,
        role: "clinic_owner",
      });
    }
  }

  return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
