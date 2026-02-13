import { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFaturas } from '@/hooks/useFaturas';
import { formatCurrency } from '@/lib/format';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function RevenueChart() {
  const { data: faturas = [] } = useFaturas();

  const chartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const monthlyData = MONTH_NAMES.map((mes, index) => {
      const monthFaturas = faturas.filter(f => {
        const d = new Date(f.data_emissao);
        return d.getFullYear() === currentYear && d.getMonth() === index && f.estado !== 'anulada' && f.tipo !== 'proforma';
      });
      const valor = monthFaturas.reduce((sum, f) => sum + Number(f.total), 0);
      const iva = monthFaturas.reduce((sum, f) => sum + Number(f.total_iva), 0);
      return { mes, valor, iva };
    });
    return monthlyData;
  }, [faturas]);

  return (
    <Card className="card-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display">Faturação Anual</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="area">
          <TabsList className="h-8 mb-2">
            <TabsTrigger value="area" className="text-xs px-3">Área</TabsTrigger>
            <TabsTrigger value="bar" className="text-xs px-3">Barras</TabsTrigger>
          </TabsList>
          <TabsContent value="area" className="mt-0">
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorIva" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : String(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="valor" name="Faturação" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorValor)" />
                  <Area type="monotone" dataKey="iva" name="IVA" stroke="hsl(var(--chart-3))" strokeWidth={2} fillOpacity={1} fill="url(#colorIva)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="bar" className="mt-0">
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : String(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="valor" name="Faturação" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="iva" name="IVA" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
