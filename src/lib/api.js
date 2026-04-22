
import { getSupabase } from "./supabaseClient";

export async function signUpWithEmail({ email, password, fullName, role }) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail({ email, password }) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUserProfile() {
  const supabase = getSupabase();
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData?.user;
  if (!authUser) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  return data || {
    id: authUser.id,
    email: authUser.email,
    full_name: authUser.user_metadata?.full_name || authUser.email,
    role: authUser.user_metadata?.role || "Admin",
  };
}

export async function listProjects() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createProject(project) {
  const supabase = getSupabase();
  const { data: authData } = await supabase.auth.getUser();
  const ownerId = authData.user?.id;
  const payload = {
    name: project.name,
    project_type: project.projectType,
    phase: project.phase,
    status: project.status || "New",
    priority: project.priority || "Medium",
    objective: project.objective || "",
    pain_statement: project.pain || "",
    estimated_savings: project.savings || "TBD",
    linked_tools: project.linkedTools || [],
    owner_id: ownerId,
  };
  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(projectId, changes) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("projects")
    .update(changes)
    .eq("id", projectId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listProjectOutputs(projectId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("project_outputs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addProjectOutput(projectId, output) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("project_outputs")
    .insert({
      project_id: projectId,
      title: output.title,
      output_type: output.outputType,
      tool_name: output.toolName,
      status: output.status || "Saved",
      content: output.content || "",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
