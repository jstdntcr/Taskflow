import { supabase } from './supabase';
import type { Comment } from '../types';

export async function getComments(taskId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, profile:profiles!user_id(*)')
    .eq('task_id', taskId)
    .order('created_at');

  if (error) throw new Error(error.message);
  return data;
}

export async function createComment(taskId: string, content: string): Promise<Comment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('comments')
    .insert({ task_id: taskId, user_id: user.id, content })
    .select('*, profile:profiles!user_id(*)')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
