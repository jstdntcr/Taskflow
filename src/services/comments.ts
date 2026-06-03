import { supabase } from './supabase';
import type { Comment } from '../types';

export async function getComments(taskId: string): Promise<Comment[]> {
  const { data: comments, error } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at');

  if (error) throw new Error(error.message);
  if (!comments?.length) return [];

  // comments.user_id → auth.users (not profiles), so join separately
  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);

  if (profilesError) throw new Error(profilesError.message);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  return comments.map((c) => ({ ...c, profile: profileMap[c.user_id] ?? null }));
}

export async function createComment(taskId: string, content: string): Promise<Comment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('comments')
    .insert({ task_id: taskId, user_id: user.id, content })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Fetch profile separately
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { ...data, profile: profile ?? null };
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
