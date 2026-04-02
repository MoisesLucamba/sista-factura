import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHostStores, useSubStoresForHost, useRevenueSplits, useCreateHostStore, useApproveSubStore, useUpdateRevenueSplit } from '@/hooks/useHostStores';
import { formatCurrency } from '@/lib/format';
import { Store, Plus, MapPin, CheckCircle, XCircle, Percent, Building2, Users, TrendingUp, Settings } from 'lucide-react';
import { toast } from 'sonner';

function CreateHostStoreDialog() {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [raio, setRaio] = useState(100);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const createStore = useCreateHostStore();

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocalização não suportada');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); toast.success('Localização detectada!'); },
      () => toast.error('Não foi possível obter a localização'),
    );
  };

  const handleSubmit = () => {
    if (!nome || !endereco) return toast.error('Preencha o nome e endereço');
    createStore.mutate({ nome, endereco, descricao: descricao || null, raio_metros: raio, latitude: lat, longitude: lng, logo_url: null, is_active: true }, {
      onSuccess: () => { setOpen(false); setNome(''); setEndereco(''); setDescricao(''); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="w-4 h-4" /> Nova Loja Anfitriã</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Criar Loja Anfitriã</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Nome *</Label><Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Shopping Belas" /></div>
          <div><Label>Endereço *</Label><Input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, cidade, província" /></div>
          <div><Label>Descrição</Label><Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição do espaço..." /></div>
          <div><Label>Raio de proximidade (metros)</Label><Input type="number" value={raio} onChange={e => setRaio(Number(e.target.value))} /></div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={detectLocation} className="gap-1"><MapPin className="w-3 h-3" /> Detectar GPS</Button>
            {lat && <span className="text-xs text-muted-foreground">{lat.toFixed(4)}, {lng?.toFixed(4)}</span>}
          </div>
          <Button onClick={handleSubmit} disabled={createStore.isPending} className="w-full">
            {createStore.isPending ? 'A criar...' : 'Criar Loja Anfitriã'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SubStoreApproval({ hostStoreId }: { hostStoreId: string }) {
  const { data: subStores, isLoading } = useSubStoresForHost(hostStoreId);
  const approve = useApproveSubStore();
  const [percentage, setPercentage] = useState(10);

  if (isLoading) return <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}</div>;
  if (!subStores?.length) return <p className="text-center text-muted-foreground py-8">Nenhuma sub-loja registada neste espaço.</p>;

  return (
    <div className="space-y-3">
      {subStores.map(sub => (
        <div key={sub.id} className="flex items-center justify-between p-4 rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{sub.nome}</p>
              <p className="text-xs text-muted-foreground">{sub.descricao || 'Sem descrição'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sub.approved ? (
              <Badge className="bg-success/10 text-success border-success/20">Aprovada</Badge>
            ) : (
              <>
                <Input type="number" value={percentage} onChange={e => setPercentage(Number(e.target.value))} className="w-16 h-8 text-xs" placeholder="%" />
                <span className="text-xs text-muted-foreground">%</span>
                <Button size="sm" variant="outline" className="gap-1 text-success border-success/30 hover:bg-success/10" onClick={() => approve.mutate({ id: sub.id, approved: true, hostPercentage: percentage })}>
                  <CheckCircle className="w-3 h-3" /> Aprovar
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => approve.mutate({ id: sub.id, approved: false })}>
                  <XCircle className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RevenueSplitManager({ hostStoreId }: { hostStoreId: string }) {
  const { data: splits, isLoading } = useRevenueSplits(hostStoreId);
  const update = useUpdateRevenueSplit();

  if (isLoading) return <div className="h-16 bg-muted animate-pulse rounded-xl" />;
  if (!splits?.length) return <p className="text-center text-muted-foreground py-8">Nenhuma configuração de receita definida.</p>;

  return (
    <div className="space-y-3">
      {splits.map((split: any) => (
        <div key={split.id} className="flex items-center justify-between p-4 rounded-xl border">
          <div className="flex items-center gap-3">
            <Percent className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">{split.sub_stores?.nome || 'Sub-loja'}</p>
              <p className="text-xs text-muted-foreground">Host recebe {split.host_percentage}% de cada venda</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" min={0} max={100} defaultValue={split.host_percentage} className="w-20 h-8 text-xs"
              onBlur={(e) => {
                const val = Number(e.target.value);
                if (val !== split.host_percentage) update.mutate({ id: split.id, host_percentage: val });
              }}
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HostStoreDashboard() {
  const { data: hostStores, isLoading } = useHostStores();
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  const activeStore = selectedStore || (hostStores?.[0]?.id ?? null);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Building2 className="w-7 h-7 text-primary" />
              Lojas Anfitriãs
            </h1>
            <p className="text-muted-foreground text-sm">Gira sub-lojas dentro do seu espaço comercial</p>
          </div>
          <CreateHostStoreDialog />
        </div>

        {/* Store Selector */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : !hostStores?.length ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Nenhuma loja anfitriã</h3>
              <p className="text-muted-foreground text-sm mb-4">Crie uma loja anfitriã para começar a gerir sub-lojas no seu espaço.</p>
              <CreateHostStoreDialog />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hostStores.map(store => (
                <Card key={store.id} className={`cursor-pointer transition-all hover:shadow-md ${activeStore === store.id ? 'border-primary ring-2 ring-primary/20' : ''}`} onClick={() => setSelectedStore(store.id)}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <Badge variant={store.is_active ? 'default' : 'secondary'}>{store.is_active ? 'Activa' : 'Inactiva'}</Badge>
                    </div>
                    <h3 className="font-bold">{store.nome}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {store.endereco}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Raio: {store.raio_metros}m</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Active store management */}
            {activeStore && (
              <Tabs defaultValue="sub-stores" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="sub-stores" className="gap-1"><Users className="w-4 h-4" /> Sub-Lojas</TabsTrigger>
                  <TabsTrigger value="revenue" className="gap-1"><TrendingUp className="w-4 h-4" /> Receita</TabsTrigger>
                </TabsList>
                <TabsContent value="sub-stores" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Sub-Lojas Registadas</CardTitle>
                      <CardDescription>Aprove ou rejeite sub-lojas que querem operar no seu espaço</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SubStoreApproval hostStoreId={activeStore} />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="revenue" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Divisão de Receita</CardTitle>
                      <CardDescription>Configure a percentagem que recebe de cada sub-loja</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RevenueSplitManager hostStoreId={activeStore} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
