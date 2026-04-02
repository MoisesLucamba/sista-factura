import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useNearbyStores, useCreateSubStore } from '@/hooks/useHostStores';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Store, Navigation, Search, Plus, Building2, Loader2, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

function RegisterSubStoreDialog({ hostStoreId, hostName }: { hostStoreId: string; hostName: string }) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const create = useCreateSubStore();

  const handleSubmit = () => {
    if (!nome) return toast.error('Preencha o nome');
    create.mutate({ host_store_id: hostStoreId, nome, descricao: descricao || undefined }, {
      onSuccess: () => { setOpen(false); setNome(''); setDescricao(''); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1"><Plus className="w-3 h-3" /> Registar Sub-Loja</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Registar Sub-Loja em {hostName}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome da sua loja" /></div>
          <div><Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição (opcional)" /></div>
          <Button onClick={handleSubmit} disabled={create.isPending} className="w-full">
            {create.isPending ? 'A registar...' : 'Registar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function StoreDirectory() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Also load all stores as fallback
  const allStores = useQuery({
    queryKey: ['all-host-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('host_stores')
        .select('*, sub_stores(id, nome, descricao, is_active, approved)')
        .eq('is_active', true)
        .order('nome');
      if (error) throw error;
      return data;
    },
  });

  const { data: nearbyStores } = useNearbyStores(userLat, userLng);

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocalização não suportada');
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); setGpsLoading(false); toast.success('Localização detectada!'); },
      () => { setGpsLoading(false); toast.error('Não foi possível obter localização'); },
    );
  };

  const stores = nearbyStores || allStores.data || [];
  const filtered = stores.filter((s: any) => !searchQuery || s.nome.toLowerCase().includes(searchQuery.toLowerCase()) || s.endereco.toLowerCase().includes(searchQuery.toLowerCase()));

  const isSeller = role && role !== 'comprador';

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Store className="w-7 h-7 text-primary" />
              Directório de Lojas
            </h1>
            <p className="text-muted-foreground text-sm">Descubra lojas e sub-lojas Faktura perto de si</p>
          </div>
          <Button variant="outline" onClick={detectLocation} disabled={gpsLoading} className="gap-2">
            {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            {userLat ? 'Localização activa' : 'Detectar localização'}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Pesquisar lojas..." className="pl-10" />
        </div>

        {/* Stores Grid */}
        {allStores.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-bold text-lg mb-2">Nenhuma loja encontrada</h3>
              <p className="text-muted-foreground text-sm">Active a localização GPS ou pesquise por nome.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((store: any) => (
              <Card key={store.id} className="overflow-hidden hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{store.nome}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {store.endereco}
                        </CardDescription>
                      </div>
                    </div>
                    {store.distance != null && (
                      <Badge variant="secondary" className="text-xs">
                        {store.distance < 1000 ? `${Math.round(store.distance)}m` : `${(store.distance / 1000).toFixed(1)}km`}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Sub-stores inside */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Sub-lojas ({(store.sub_stores || []).filter((s: any) => s.approved && s.is_active).length})
                    </p>
                    {(store.sub_stores || []).filter((s: any) => s.approved && s.is_active).map((sub: any) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{sub.nome}</p>
                            {sub.descricao && <p className="text-xs text-muted-foreground">{sub.descricao}</p>}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => navigate(`/loja/${sub.user_id || store.user_id}`)}>
                          <QrCode className="w-3 h-3" /> Ver Loja
                        </Button>
                      </div>
                    ))}
                    {(store.sub_stores || []).filter((s: any) => s.approved && s.is_active).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">Nenhuma sub-loja activa</p>
                    )}
                  </div>

                  {/* Register as sub-store (sellers only) */}
                  {isSeller && (
                    <div className="mt-4 pt-3 border-t">
                      <RegisterSubStoreDialog hostStoreId={store.id} hostName={store.nome} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
