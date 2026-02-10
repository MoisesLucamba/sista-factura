import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { mockFaturacaoMensal, mockDashboardStats } from '@/lib/mock-data';
import { formatCurrency, getMonthName } from '@/lib/format';
import { 
  Download, 
  FileSpreadsheet, 
  FileText,
  Calendar,
  TrendingUp,
  Receipt,
  Users,
  Package,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  FileDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--chart-4))'];

const estadoFaturas = [
  { name: 'Pagas', value: 45, color: 'hsl(var(--success))' },
  { name: 'Emitidas', value: 25, color: 'hsl(var(--primary))' },
  { name: 'Vencidas', value: 15, color: 'hsl(var(--destructive))' },
  { name: 'Rascunhos', value: 15, color: 'hsl(var(--muted-foreground))' },
];

const topProdutos = [
  { nome: 'Consultoria Empresarial', vendas: 2500000 },
  { nome: 'Desenvolvimento de Software', vendas: 2000000 },
  { nome: 'Computador Portátil HP', vendas: 1750000 },
  { nome: 'Manutenção de Equipamentos', vendas: 900000 },
  { nome: 'Monitor LED 24"', vendas: 680000 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border-2 border-primary/20 rounded-xl shadow-xl p-4">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="font-bold text-xs"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Relatorios() {
  const currentMonth = getMonthName(new Date().getMonth());
  const currentYear = new Date().getFullYear();

  return (
    <MainLayout>
      {/* Hero Header with Gradient */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 border border-primary/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold font-display bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Relatórios
                </h1>
                <p className="text-muted-foreground mt-0.5 flex items-center gap-2">
                  Análise fiscal e financeira
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {currentYear}
                  </Badge>
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Select defaultValue="2024">
              <SelectTrigger className="w-[140px] h-11 border-primary/20">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="lg"
              className="border-primary/20 hover:bg-primary/5 group"
            >
              <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="card-shadow group hover:shadow-lg transition-all border-l-4 border-l-primary animate-fade-in" style={{ animationDelay: '0ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Faturação Anual</p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {formatCurrency(mockDashboardStats.faturacaoAnual)}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  +12.5% vs 2023
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow group hover:shadow-lg transition-all border-l-4 border-l-red-500 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">IVA Anual</p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {formatCurrency(mockDashboardStats.ivaAnual)}
                </p>
                <p className="text-xs text-muted-foreground">
                  14% da faturação
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Receipt className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow group hover:shadow-lg transition-all border-l-4 border-l-green-500 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Clientes Activos</p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {mockDashboardStats.totalClientes}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-green-600" />
                  8 novos este mês
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow group hover:shadow-lg transition-all border-l-4 border-l-orange-500 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Faturas Emitidas</p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {mockDashboardStats.faturasEmitidas}
                </p>
                <p className="text-xs text-muted-foreground">
                  Últimos 12 meses
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="card-shadow lg:col-span-2 border-primary/10 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CardHeader className="pb-4 border-b border-primary/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <div className="w-1 h-6 bg-primary rounded-full" />
                Evolução da Faturação
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                Mensal
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockFaturacaoMensal}>
                  <defs>
                    <linearGradient id="colorFaturacao" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-50" />
                  <XAxis 
                    dataKey="mes" 
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground"
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    name="Faturação"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorFaturacao)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-primary/10 animate-fade-in" style={{ animationDelay: '500ms' }}>
          <CardHeader className="pb-4 border-b border-primary/10">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              Estado das Faturas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estadoFaturas}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    label={CustomPieLabel}
                    labelLine={false}
                  >
                    {estadoFaturas.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="text-xs font-medium">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="card-shadow border-primary/10 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <CardHeader className="pb-4 border-b border-primary/10">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <div className="w-1 h-6 bg-red-500 rounded-full" />
              IVA Mensal
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockFaturacaoMensal}>
                  <defs>
                    <linearGradient id="colorIVA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-50" />
                  <XAxis 
                    dataKey="mes" 
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="iva" 
                    name="IVA"
                    fill="url(#colorIVA)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-primary/10 animate-fade-in" style={{ animationDelay: '700ms' }}>
          <CardHeader className="pb-4 border-b border-primary/10">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProdutos} layout="vertical">
                  <defs>
                    <linearGradient id="colorProdutos" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-50" />
                  <XAxis 
                    type="number"
                    className="text-xs fill-muted-foreground"
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="nome"
                    className="text-xs fill-muted-foreground"
                    width={160}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="vendas" 
                    name="Vendas"
                    fill="url(#colorProdutos)"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Export Options */}
      <Card className="card-shadow border-primary/10 animate-fade-in" style={{ animationDelay: '800ms' }}>
        <CardHeader className="pb-4 border-b border-primary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              Exportar Relatórios
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              <FileDown className="w-3 h-3 mr-1" />
              Múltiplos formatos
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col gap-3 group hover:border-green-500/50 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <span className="font-semibold block text-sm">Mapa de IVA</span>
                <span className="text-xs text-muted-foreground">Excel / PDF</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col gap-3 group hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <span className="font-semibold block text-sm">Faturação Mensal</span>
                <span className="text-xs text-muted-foreground">PDF</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col gap-3 group hover:border-orange-500/50 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-center">
                <span className="font-semibold block text-sm">Relatório Anual</span>
                <span className="text-xs text-muted-foreground">PDF</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col gap-3 group hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Receipt className="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-center">
                <span className="font-semibold block text-sm">SAF-T Angola</span>
                <span className="text-xs text-muted-foreground">XML</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}