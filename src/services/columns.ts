import { supabase } from './supabase';
import type { Column } from '../types';

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Done'];

export async function getColumns(boardId: string): Promise<Column[]> {
  const { data, error } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', boardId)
    .order('position');

  if (error) throw new Error(error.message);
  return data;
}

export async function createDefaultColumns(boardId: string): Promise<void> {
  const columns = DEFAULT_COLUMNS.map((title, position) => ({
    board_id: boardId,
    title,
    position,
  }));

  const { error } = await supabase.from('columns').insert(columns);
  if (error) throw new Error(error.message);
}

export async function createColumn(boardId: string, title: string, position: number): Promise<Column> {
  const { data, error } = await supabase
    .from('columns')
    .insert({ board_id: boardId, title, position })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateColumn(id: string, title: string): Promise<void> {
  const { error } = await supabase.from('columns').update({ title }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteColumn(id: string): Promise<void> {
  const { error } = await supabase.from('columns').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
