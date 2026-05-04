import { useActiveAccount } from '@/contexts/ActiveAccountContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Building2, Crown, User, ChevronDown, Check } from 'lucide-react';

export function AccountSwitcher() {
  const { companies, activeAccount, setActiveAccount } = useActiveAccount();
  if (!activeAccount || companies.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-w-[200px]">
          {activeAccount.is_owner ? <Crown className="w-3.5 h-3.5 text-primary shrink-0" /> : <User className="w-3.5 h-3.5 shrink-0" />}
          <span className="truncate text-xs font-bold">{activeAccount.nome}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Tuas contas
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.map((c) => (
          <DropdownMenuItem key={c.empresa_user_id} onClick={() => setActiveAccount(c)} className="gap-2">
            {c.is_owner ? <Crown className="w-4 h-4 text-primary" /> : <User className="w-4 h-4" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{c.nome}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {c.is_owner ? 'Proprietário' : c.role}
              </p>
            </div>
            {c.empresa_user_id === activeAccount.empresa_user_id && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
