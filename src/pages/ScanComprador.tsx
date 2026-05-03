import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  User, Loader2, ArrowLeft, CheckCircle, FileText, ArrowRight,
} from 'lucide-react';
import logoFaktura from '@/assets/faktura-logo.svg';

interface BuyerInfo {
  user_id: string;
  nome: string;
  nif: string;
  telefone: string;
  email: string;
}

export default function ScanComprador() {
  const { fakturaId } = useParams<{ fakturaId: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [buyer, setBuyer] = useState<BuyerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!fakturaId) return;
    lookupBuyer();
  }, [fakturaId]);

  const lookupBuyer = async () => {
    const { data, error } = await supabase.rpc('lookup_buyer_by_faktura_id', {
      _faktura_id: fakturaId!,
    });

    if (error || !data || data.length === 0) {
      setNotFound(true);
    } else {
      setBuyer(data[0] as BuyerInfo);
    }
    setLoading(false);
  };

  const goToInvoice = () => {
    // Navigate to new invoice page with buyer pre-filled
    navigate(`/faturas/nova?buyer_faktura_id=${fakturaId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <User className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">Comprador não encontrado</h1>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          O ID Faktura <strong className="text-primary">{fakturaId}</strong> não corresponde a nenhum comprador registado.
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={logoFaktura} alt="Faktura" className="h-7 object-contain" />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-1">Comprador Identificado</h1>
          <p className="text-sm text-muted-foreground">
            O comprador foi encontrado pelo ID Faktura
          </p>
        </div>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{buyer?.nome}</h2>
                <Badge variant="secondary" className="text-xs">{fakturaId}</Badge>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">NIF</span>
                <span className="font-medium">{buyer?.nif || 'Não definido'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Telefone</span>
                <span className="font-medium">{buyer?.telefone || 'Não definido'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{buyer?.email || 'Não definido'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {user && (role === 'admin' || role === 'operador' || role === 'contador') && (
          <Button className="w-full gap-2" size="lg" onClick={goToInvoice}>
            <FileText className="w-5 h-5" />
            Emitir Fatura para este Comprador
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}

        {!user && (
          <div className="text-center text-sm text-muted-foreground">
            <p>Inicie sessão como vendedor para emitir uma fatura.</p>
            <Button variant="link" onClick={() => navigate('/login')}>Iniciar Sessão</Button>
          </div>
        )}
      </main>
    </div>
  );
}
