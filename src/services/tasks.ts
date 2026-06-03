import { supabase } from './supabase';
import type { Task } from '../types';

export async function getTasks(boardId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:profiles!assignee_id(*)')
    .in(
      'column_id',
      supabase.from('columns').select('id').eq('board_id', boardId)
    )
    .order('position');

  if (error) throw error;
  return data;
}

export async function createTask(
  columnId: string,
  title: string,
  position: number
): Promise<Task> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert({ column_id: columnId, title, position, created_by: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const { error } = await supabase.from('tasks').update(updates).eq('id', id);
  if (error) throw error;
}

export async function moveTask(
  id: string,
  columnId: string,
  position: number
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ column_id: columnId, position })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}
