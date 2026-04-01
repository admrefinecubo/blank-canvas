import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Check if caller is platform_admin
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "platform_admin");
    
    if (!callerRoles?.length) throw new Error("Only platform admins can manage team members");

    const { action, ...params } = await req.json();

    if (action === "list") {
      const { clinic_id } = params;
      if (!clinic_id) throw new Error("clinic_id required");

      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("id, user_id, role")
        .eq("clinic_id", clinic_id);

      if (!roles?.length) {
        return new Response(JSON.stringify({ users: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userIds = [...new Set(roles.map(r => r.user_id))];
      const users = [];
      for (const uid of userIds) {
        const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(uid);
        if (authUser) {
          const userRoles = roles.filter(r => r.user_id === uid);
          users.push({
            id: uid,
            email: authUser.email,
            role: userRoles[0]?.role,
            role_id: userRoles[0]?.id,
            created_at: authUser.created_at,
            banned: !!authUser.banned_until,
            banned_until: authUser.banned_until,
          });
        }
      }

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const { email, password, role, clinic_id } = params;
      if (!email || !password || !role || !clinic_id) throw new Error("email, password, role, clinic_id required");

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createError) throw createError;

      const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
        user_id: newUser.user.id,
        role,
        clinic_id,
      });
      if (roleError) throw roleError;

      return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_role") {
      const { role_id, new_role } = params;
      if (!role_id || !new_role) throw new Error("role_id, new_role required");

      const { error } = await supabaseAdmin.from("user_roles").update({ role: new_role }).eq("id", role_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { user_id, role_id } = params;
      if (!role_id) throw new Error("role_id required");

      const { error } = await supabaseAdmin.from("user_roles").delete().eq("id", role_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== BAN: block a user from logging in =====
    if (action === "ban_user") {
      const { user_id } = params;
      if (!user_id) throw new Error("user_id required");

      // Ban for ~100 years (effectively permanent)
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        ban_duration: "876000h",
      });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== UNBAN: restore login access =====
    if (action === "unban_user") {
      const { user_id } = params;
      if (!user_id) throw new Error("user_id required");

      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        ban_duration: "none",
      });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== BAN ALL CLINIC USERS =====
    if (action === "ban_clinic") {
      const { clinic_id } = params;
      if (!clinic_id) throw new Error("clinic_id required");

      // Get all users of this clinic (excluding platform_admins)
      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .eq("clinic_id", clinic_id)
        .neq("role", "platform_admin");

      const userIds = [...new Set((roles || []).map(r => r.user_id))];
      const errors: string[] = [];

      for (const uid of userIds) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(uid, {
          ban_duration: "876000h",
        });
        if (error) errors.push(`${uid}: ${error.message}`);
      }

      // Also update clinic status
      await supabaseAdmin.from("clinics").update({ status: "inativa" }).eq("id", clinic_id);

      return new Response(JSON.stringify({ success: true, banned_count: userIds.length, errors }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== UNBAN ALL CLINIC USERS =====
    if (action === "unban_clinic") {
      const { clinic_id } = params;
      if (!clinic_id) throw new Error("clinic_id required");

      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("clinic_id", clinic_id);

      const userIds = [...new Set((roles || []).map(r => r.user_id))];
      const errors: string[] = [];

      for (const uid of userIds) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(uid, {
          ban_duration: "none",
        });
        if (error) errors.push(`${uid}: ${error.message}`);
      }

      // Reactivate clinic
      await supabaseAdmin.from("clinics").update({ status: "ativa" }).eq("id", clinic_id);

      return new Response(JSON.stringify({ success: true, unbanned_count: userIds.length, errors }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
