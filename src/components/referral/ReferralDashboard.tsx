import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users, Copy, CheckCircle, Gift, TrendingUp, Share2, Percent, Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

interface Referral {
  id: string;
  referred_user_id: string;
  user_type: string;
  reward_type: string;
  reward_value: number;
  created_at: string;
}

interface ReferralProfile {
  referral_code: string | null;
  tipo: string | null;
}

export function ReferralDashboard() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [profile, setProfile] = useState<ReferralProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [profileRes, referralsRes] = await Promise.all([
      supabase.from('profiles').select('referral_code, tipo').eq('user_id', user.id).single(),
      supabase.from('referrals').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
    ]);
    if (profileRes.data) setProfile(profileRes.data as ReferralProfile);
    if (referralsRes.data) setReferrals(referralsRes.data as Referral[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const referralCode = profile?.referral_code || '';
  const referralLink = `${window.location.origin}/registar?ref=${referralCode}`;
  const isSeller = profile?.tipo === 'vendedor';

  const totalCashback = referrals.filter(r => r.reward_type === 'cashback').reduce((s, r) => s + r.reward_value, 0);
  const currentDiscount = (() => {
    const count = referrals.filter(r => r.reward_type === 'desconto').length;
    if (count >= 10) return 100;
    if (count >= 5) return 60;
    if (count >= 3) return 40;
    if (count >= 1) return 20;
    return 0;
  })();

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success('Código copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Link copiado!');
  };

  if (loading) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          Minhas Indicações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Code + Link */}
        <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-1">Seu Código de Indicação</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-primary tracking-wider">{referralCode}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyCode}>
                {copied ? <CheckCircle className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold mb-1">Link de Convite</p>
            <div className="flex items-center gap-2">
              <Input value={referralLink} readOnly className="text-xs h-8 bg-background" />
              <Button variant="outline" size="sm" className="h-8 gap-1 flex-shrink-0" onClick={copyLink}>
                <Share2 className="w-3 h-3" /> Copiar
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card border border-border/50 rounded-lg p-3 text-center">
            <Users className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-black">{referrals.length}</p>
            <p className="text-[10px] text-muted-foreground">Indicados</p>
          </div>
          {isSeller ? (
            <div className="bg-card border border-border/50 rounded-lg p-3 text-center">
              <Percent className="w-4 h-4 mx-auto mb-1 text-amber-500" />
              <p className="text-lg font-black">{currentDiscount}%</p>
              <p className="text-[10px] text-muted-foreground">Desconto Actual</p>
            </div>
          ) : (
            <div className="bg-card border border-border/50 rounded-lg p-3 text-center">
              <Wallet className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
              <p className="text-lg font-black">{totalCashback} Kz</p>
              <p className="text-[10px] text-muted-foreground">Cashback Ganho</p>
            </div>
          )}
          <div className="bg-card border border-border/50 rounded-lg p-3 text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-black">{referrals.length}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
        </div>

        {/* Progressive discount info for sellers */}
        {isSeller && (
          <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
            <p className="text-xs font-bold">Sistema de Desconto Progressivo</p>
            {[
              { count: 1, discount: 20 },
              { count: 3, discount: 40 },
              { count: 5, discount: 60 },
              { count: 10, discount: 100 },
            ].map(({ count, discount }) => (
              <div key={count} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{count} indicação{count > 1 ? 'ões' : ''}</span>
                <Badge variant={referrals.length >= count ? 'default' : 'outline'} className="text-[10px]">
                  {discount}% desconto
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Referral History */}
        {referrals.length > 0 && (
          <div>
            <p className="text-xs font-bold mb-2">Histórico de Indicações</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {referrals.map((ref) => (
                <div key={ref.id} className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-3 h-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold capitalize">{ref.user_type}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(ref.created_at).toLocaleDateString('pt-AO')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {ref.reward_type === 'cashback' ? `+${ref.reward_value} Kz` : 
                     ref.reward_type === 'desconto' ? `${ref.reward_value}% desc.` : 'Registado'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {referrals.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Ainda não indicou ninguém. Partilhe o seu código e ganhe recompensas!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
