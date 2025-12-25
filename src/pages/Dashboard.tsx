import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, DollarSign, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [itemsResult, transactionsResult, loansResult] = await Promise.all([
        supabase.from('items').select('*'),
        supabase.from('transactions').select('*').order('timestamp', { ascending: false }).limit(10),
        supabase.from('transactions').select('*').eq('status', 'OPEN'),
      ]);

      const items = itemsResult.data || [];
      const transactions = transactionsResult.data || [];
      const loans = loansResult.data || [];

      const totalItems = items.length;
      const totalValue = items.reduce((sum, item) => sum + (Number(item.quantity_total) * Number(item.unit_price)), 0);
      const itemsOnLoan = loans.reduce((sum, loan) => sum + loan.quantity, 0);
      const criticalStock = items.filter(item => item.quantity_available < item.min_stock_threshold);

      return {
        totalItems,
        totalValue,
        itemsOnLoan,
        criticalStockCount: criticalStock.length,
        criticalStockItems: criticalStock.slice(0, 5),
        recentTransactions: transactions,
      };
    },
  });

  // Fetch item names for transactions
  const { data: itemsMap } = useQuery({
    queryKey: ['items-map'],
    queryFn: async () => {
      const { data } = await supabase.from('items').select('id, name, sku');
      const map: Record<string, { name: string; sku: string }> = {};
      data?.forEach(item => {
        map[item.id] = { name: item.name, sku: item.sku };
      });
      return map;
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getTransactionTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      CHECKOUT: 'default',
      RETURN: 'secondary',
      RESTOCK: 'outline',
      ADJUSTMENT: 'destructive',
    };
    return <Badge variant={variants[type] || 'default'}>{type}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
            <p className="text-xs text-muted-foreground">Distinct inventory items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalValue || 0)}</div>
            <p className="text-xs text-muted-foreground">Inventory worth</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items on Loan</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.itemsOnLoan || 0}</div>
            <p className="text-xs text-muted-foreground">Currently checked out</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.criticalStockCount || 0}</div>
            <p className="text-xs text-muted-foreground">Items below threshold</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Critical Stock Section */}
        <Card>
          <CardHeader>
            <CardTitle>Critical Stock Items</CardTitle>
            <CardDescription>Items that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.criticalStockItems && stats.criticalStockItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Threshold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.criticalStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{item.quantity_available}</Badge>
                      </TableCell>
                      <TableCell>{item.min_stock_threshold}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No items below stock threshold
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest inventory activity</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">
                        {itemsMap?.[tx.item_id]?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{getTransactionTypeBadge(tx.transaction_type)}</TableCell>
                      <TableCell>{tx.quantity}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(tx.timestamp), 'MMM d, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No transactions yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
