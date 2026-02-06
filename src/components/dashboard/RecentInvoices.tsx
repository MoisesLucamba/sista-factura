import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockFaturas } from '@/lib/mock-data';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const estadoStyles = {
  rascunho: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
  emitida: { label: 'Emitida', className: 'bg-primary/10 text-primary' },
  paga: { label: 'Paga', className: 'bg-success/10 text-success' },
  anulada: { label: 'Anulada', className: 'bg-muted text-muted-foreground line-through' },
  vencida: { label: 'Vencida', className: 'bg-destructive/10 text-destructive' },
};

export function RecentInvoices() {
  return (
    <Card className="card-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display">Faturas Recentes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/faturas" className="text-primary hover:text-primary/80">
              Ver todas
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {mockFaturas.slice(0, 5).map((fatura) => {
            const estado = estadoStyles[fatura.estado];
            return (
              <div
                key={fatura.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">
                      {fatura.numero}
                    </p>
                    <Badge variant="secondary" className={cn('text-xs', estado.className)}>
                      {estado.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {fatura.cliente.nome}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-sm">
                    {formatCurrency(fatura.total)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(fatura.dataEmissao)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
