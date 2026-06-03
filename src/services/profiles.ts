import { supabase } from './supabase';
import type { Profile } from '../types';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data;
}

export async function upsertProfile(updates: Partial<Profile> & { id: string }): Promise<void> {
  // Try UPDATE first (profile should exist — created by signup trigger)
  const { error: updateError, count } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', updates.id)
    .select('id', { count: 'exact', head: true });

  if (updateError) throw new Error(updateError.message);

  // No row matched — profile missing, insert it
  if (count === 0) {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert(updates);
    if (insertError) throw new Error(insertError.message);
  }
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
