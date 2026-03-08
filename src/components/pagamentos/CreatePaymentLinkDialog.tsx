import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Link2, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface CreatePaymentLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAmount?: number;
  defaultDescription?: string;
  faturaId?: string;
}

export function CreatePaymentLinkDialog({
  open,
  onOpenChange,
  defaultAmount = 0,
  defaultDescription = '',
  faturaId,
}: CreatePaymentLinkDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(String(defaultAmount || ''));
  const [description, setDescription] = useState(defaultDescription);
  const [expiresInDays, setExpiresInDays] = useState('7');

  const createLink = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');
      const amountNum = parseFloat(amount);
      if (!amountNum || amountNum <= 0) throw new Error('Valor inválido');

      // Generate unique code
      const { data: code, error: codeError } = await supabase.rpc('generate_payment_link_code');
      if (codeError) throw codeError;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));

      const { data, error } = await supabase
        .from('payment_links')
        .insert({
          user_id: user.id,
          code: code as string,
          amount: amountNum,
          description: description || null,
          fatura_id: faturaId || null,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] });
      toast.success('Link de pagamento criado!');
      onOpenChange(false);
      // Open the link details / share dialog
      const url = `${window.location.origin}/pagar/${data.code}`;
      navigator.clipboard.writeText(url);
      toast.info('Link copiado para a área de transferência');
      setAmount('');
      setDescription('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl gradient-fintech flex items-center justify-center">
              <Link2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle>Novo Link de Pagamento</DialogTitle>
              <DialogDescription>
                Crie um link para receber pagamentos dos seus clientes
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (Kz)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono text-lg h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Ex: Pagamento da Fatura FT/2026/000001"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires">Expiração</Label>
            <select
              id="expires"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="1">1 dia</option>
              <option value="3">3 dias</option>
              <option value="7">7 dias</option>
              <option value="14">14 dias</option>
              <option value="30">30 dias</option>
              <option value="90">90 dias</option>
            </select>
          </div>

          <div className="bg-muted/50 border rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <QrCode className="w-4 h-4 text-primary" />
              <span className="font-medium">QR Code incluído</span>
            </div>
            <p className="text-xs text-muted-foreground">
              O link incluirá um QR Code que o cliente pode digitalizar para pagar.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => createLink.mutate()}
            disabled={createLink.isPending || !amount || parseFloat(amount) <= 0}
            className="gradient-fintech border-0 text-primary-foreground"
          >
            {createLink.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4 mr-2" />
            )}
            Criar Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
