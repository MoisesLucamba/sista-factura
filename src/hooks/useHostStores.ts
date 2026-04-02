import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface HostStore {
  id: string;
  user_id: string;
  nome: string;
  endereco: string;
  latitude: number | null;
  longitude: number | null;
  raio_metros: number;
  descricao: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubStore {
  id: string;
  user_id: string;
  host_store_id: string;
  nome: string;
  descricao: string | null;
  logo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface RevenueSplit {
  id: string;
  host_store_id: string;
  sub_store_id: string;
  host_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useHostStores() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['host-stores', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('host_stores')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as HostStore[];
    },
    enabled: !!user,
  });
}

export function useSubStoresForHost(hostStoreId: string | null) {
  return useQuery({
    queryKey: ['sub-stores-host', hostStoreId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sub_stores')
        .select('*')
        .eq('host_store_id', hostStoreId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SubStore[];
    },
    enabled: !!hostStoreId,
  });
}

export function useMySubStores() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-sub-stores', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sub_stores')
        .select('*, host_stores(nome, endereco)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useRevenueSplits(hostStoreId: string | null) {
  return useQuery({
    queryKey: ['revenue-splits', hostStoreId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_splits')
        .select('*, sub_stores(nome)')
        .eq('host_store_id', hostStoreId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!hostStoreId,
  });
}

export function useCreateHostStore() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (store: Omit<HostStore, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('host_stores')
        .insert({ ...store, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-stores'] });
      toast.success('Loja anfitriã criada com sucesso!');
    },
    onError: (e: Error) => toast.error('Erro: ' + e.message),
  });
}

export function useCreateSubStore() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (store: { host_store_id: string; nome: string; descricao?: string }) => {
      const { data, error } = await supabase
        .from('sub_stores')
        .insert({ ...store, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-stores-host'] });
      queryClient.invalidateQueries({ queryKey: ['my-sub-stores'] });
      toast.success('Sub-loja registada com sucesso! Aguarde aprovação do host.');
    },
    onError: (e: Error) => toast.error('Erro: ' + e.message),
  });
}

export function useApproveSubStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved, hostPercentage }: { id: string; approved: boolean; hostPercentage?: number }) => {
      const { data: subStore, error } = await supabase
        .from('sub_stores')
        .update({ approved })
        .eq('id', id)
        .select('*, host_stores(id)')
        .single();
      if (error) throw error;

      if (approved && hostPercentage !== undefined && subStore) {
        const hostStoreId = (subStore as any).host_stores?.id || subStore.host_store_id;
        await supabase.from('revenue_splits').upsert({
          host_store_id: hostStoreId,
          sub_store_id: id,
          host_percentage: hostPercentage,
        }, { onConflict: 'host_store_id,sub_store_id' });
      }
      return subStore;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['sub-stores-host'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-splits'] });
      toast.success(vars.approved ? 'Sub-loja aprovada!' : 'Sub-loja rejeitada.');
    },
    onError: (e: Error) => toast.error('Erro: ' + e.message),
  });
}

export function useUpdateRevenueSplit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, host_percentage }: { id: string; host_percentage: number }) => {
      const { error } = await supabase
        .from('revenue_splits')
        .update({ host_percentage })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-splits'] });
      toast.success('Percentagem atualizada!');
    },
    onError: (e: Error) => toast.error('Erro: ' + e.message),
  });
}

export function useNearbyStores(latitude: number | null, longitude: number | null) {
  return useQuery({
    queryKey: ['nearby-stores', latitude, longitude],
    queryFn: async () => {
      // Fetch all active host stores and calculate distance client-side
      const { data, error } = await supabase
        .from('host_stores')
        .select('*, sub_stores(*, revenue_splits(host_percentage))')
        .eq('is_active', true);
      if (error) throw error;
      if (!latitude || !longitude) return data || [];

      // Filter by proximity
      return (data || []).filter((store: any) => {
        if (!store.latitude || !store.longitude) return true; // Show stores without GPS
        const dist = haversineDistance(latitude, longitude, store.latitude, store.longitude);
        return dist <= (store.raio_metros || 1000);
      }).map((store: any) => ({
        ...store,
        distance: store.latitude && store.longitude
          ? haversineDistance(latitude, longitude, store.latitude, store.longitude)
          : null,
      }));
    },
    enabled: latitude !== null && longitude !== null,
  });
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
