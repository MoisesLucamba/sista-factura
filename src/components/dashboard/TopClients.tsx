import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { mockClientes } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/format';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// Simulated revenue per client
const clientesFaturacao = mockClientes.map((cliente, index) => ({
  ...cliente,
  faturacao: [2166000, 991800, 285000, 150000, 85000][index] || 0,
})).sort((a, b) => b.faturacao - a.faturacao);

export function TopClients() {
  return (
    <Card className="card-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display">Principais Clientes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/clientes" className="text-primary hover:text-primary/80">
              Ver todos
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {clientesFaturacao.slice(0, 5).map((cliente, index) => (
            <div
              key={cliente.id}
              className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-center w-6 text-muted-foreground font-medium text-sm">
                {index + 1}
              </div>
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-secondary text-foreground font-medium text-sm">
                  {cliente.nome.split(' ').slice(0, 2).map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {cliente.nome}
                </p>
                <p className="text-xs text-muted-foreground">
                  NIF: {cliente.nif}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-sm">
                  {formatCurrency(cliente.faturacao)}
                </p>
                <div className="flex items-center gap-1 text-success text-xs">
                  <TrendingUp className="w-3 h-3" />
                  <span>12%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
