import { useActiveAccount, type CompanyAccount } from '@/contexts/ActiveAccountContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Building2, Crown, User, Check } from 'lucide-react';

export function AccountSelectorModal() {
  const { needsSelection, companies, setActiveAccount } = useActiveAccount();

  return (
    <Dialog open={needsSelection}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Escolher conta
          </DialogTitle>
          <DialogDescription>
            Tens acesso a várias contas. Seleciona aquela onde queres trabalhar agora.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {companies.map((c) => (
            <CompanyCard key={c.empresa_user_id} company={c} onSelect={() => setActiveAccount(c)} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompanyCard({ company, onSelect }: { company: CompanyAccount; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${company.is_owner ? 'bg-primary/15 text-primary' : 'bg-muted'}`}>
        {company.is_owner ? <Crown className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{company.nome}</p>
        <p className="text-xs text-muted-foreground truncate">
          {company.faktura_id ? `${company.faktura_id} · ` : ''}{company.is_owner ? 'Proprietário' : `Membro · ${company.role}`}
        </p>
      </div>
      <Check className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}
