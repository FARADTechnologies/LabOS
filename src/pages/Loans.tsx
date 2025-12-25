import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, QrCode } from 'lucide-react';
import { useActiveLoans } from '@/hooks/useLoans';
import { useItems, type Item } from '@/hooks/useInventory';
import { LoansTable } from '@/components/loans/LoansTable';
import { CheckoutDialog } from '@/components/loans/CheckoutDialog';
import { ReturnDialog } from '@/components/loans/ReturnDialog';
import { ScannerDialog } from '@/components/scanner/ScannerDialog';

export default function Loans() {
  const { data: loans = [], isLoading } = useActiveLoans();
  const { data: items = [] } = useItems();
  const [searchQuery, setSearchQuery] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [preselectedItem, setPreselectedItem] = useState<Item | undefined>();
  const [returnLoan, setReturnLoan] = useState<{
    id: string;
    item_id: string;
    quantity: number;
    user_name: string;
    items?: { name: string } | null;
  } | null>(null);

  const filteredLoans = loans.filter((loan) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      loan.items?.name?.toLowerCase().includes(searchLower) ||
      loan.items?.sku?.toLowerCase().includes(searchLower) ||
      loan.user_name.toLowerCase().includes(searchLower) ||
      loan.project_name.toLowerCase().includes(searchLower)
    );
  });

  const handleScanResult = (item: Item) => {
    setPreselectedItem(item);
    setCheckoutOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search loans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setScannerOpen(true)}>
            <QrCode className="h-4 w-4 mr-2" />
            Scan
          </Button>
          <Button onClick={() => {
            setPreselectedItem(undefined);
            setCheckoutOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Checkout Equipment
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Loans</CardTitle>
          <CardDescription>
            Equipment currently checked out • {loans.length} active {loans.length === 1 ? 'loan' : 'loans'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : (
            <LoansTable
              loans={filteredLoans}
              onReturn={(loan) => setReturnLoan(loan)}
            />
          )}
        </CardContent>
      </Card>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        preselectedItem={preselectedItem}
      />

      <ReturnDialog
        open={!!returnLoan}
        onOpenChange={(open) => !open && setReturnLoan(null)}
        loan={returnLoan}
      />

      <ScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onItemFound={handleScanResult}
      />
    </div>
  );
}
