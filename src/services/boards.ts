import { supabase } from './supabase';
import type { Board, BoardMember } from '../types';

export async function getBoards(): Promise<Board[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createBoard(title: string): Promise<Board> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('boards')
    .insert({ title, owner_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBoard(id: string): Promise<void> {
  const { error } = await supabase.from('boards').delete().eq('id', id);
  if (error) throw error;
}

export async function getBoardMembers(boardId: string): Promise<BoardMember[]> {
  const { data, error } = await supabase
    .from('board_members')
    .select('*, profile:profiles(*)')
    .eq('board_id', boardId);

  if (error) throw error;
  return data;
}

export async function inviteMember(boardId: string, email: string): Promise<void> {
  // TODO: implement invite by email
  throw new Error('Not implemented');
}
