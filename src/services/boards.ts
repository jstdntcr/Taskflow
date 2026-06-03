import { supabase } from './supabase';
import type { Board, BoardMember } from '../types';

export async function getBoards(): Promise<Board[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createBoard(title: string): Promise<Board> {
  // Single atomic RPC: creates board + owner member + default columns
  const { data: boardId, error: rpcError } = await supabase
    .rpc('create_board_with_defaults', { p_title: title });

  if (rpcError) throw new Error(rpcError.message);

  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('id', boardId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBoard(id: string): Promise<void> {
  const { error } = await supabase.from('boards').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getBoardMembers(boardId: string): Promise<BoardMember[]> {
  const { data, error } = await supabase
    .from('board_members')
    .select('*, profile:profiles(*)')
    .eq('board_id', boardId);

  if (error) throw new Error(error.message);
  return data;
}

export async function inviteMember(boardId: string, email: string): Promise<void> {
  // TODO: implement invite by email
  throw new Error('Not implemented');
}
