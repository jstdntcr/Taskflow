import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile, upsertProfile, uploadAvatar } from '../services/profiles';
import { useAuth } from '../providers/AuthProvider';
import type { Profile } from '../types';

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: Boolean(user),
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<Profile>) =>
      upsertProfile({ ...updates, id: user!.id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', user?.id] }),
  });
}

export function useUploadAvatar() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadAvatar(user!.id, file);
      await upsertProfile({ id: user!.id, avatar_url: url });
      return url;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', user?.id] }),
  });
}
