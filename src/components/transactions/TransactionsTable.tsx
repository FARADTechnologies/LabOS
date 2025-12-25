import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface TransactionWithItem {
  id: string;
  item_id: string;
  transaction_type: string;
  quantity: number;
  user_name: string;
  project_name: string;
  status: string;
  notes: string | null;
  timestamp: string;
  items: {
    id: string;
    name: string;
    sku: string;
    category: string;
  } | null;
}

interface TransactionsTableProps {
  transactions: TransactionWithItem[];
}

const typeColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CHECKOUT: 'default',
  RETURN: 'secondary',
  ADJUSTMENT: 'outline',
  RESTOCK: 'secondary',
};

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No transactions recorded yet.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="whitespace-nowrap">
                {format(new Date(tx.timestamp), 'MMM d, yyyy h:mm a')}
              </TableCell>
              <TableCell>
                <Badge variant={typeColors[tx.transaction_type] || 'default'}>
                  {tx.transaction_type}
                </Badge>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{tx.items?.name}</div>
                  <div className="text-sm text-muted-foreground">{tx.items?.sku}</div>
                </div>
              </TableCell>
              <TableCell>{tx.quantity}</TableCell>
              <TableCell>{tx.user_name}</TableCell>
              <TableCell>{tx.project_name}</TableCell>
              <TableCell>
                <Badge variant={tx.status === 'OPEN' ? 'destructive' : 'outline'}>
                  {tx.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
