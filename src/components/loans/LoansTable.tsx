import { format, formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';

interface LoanWithItem {
  id: string;
  item_id: string;
  quantity: number;
  user_name: string;
  project_name: string;
  notes: string | null;
  timestamp: string;
  status: string;
  transaction_type: string;
  items: {
    id: string;
    name: string;
    sku: string;
    category: string;
    location: string;
  } | null;
}

interface LoansTableProps {
  loans: LoanWithItem[];
  onReturn: (loan: LoanWithItem) => void;
}

export function LoansTable({ loans, onReturn }: LoansTableProps) {
  if (loans.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No active loans. All equipment has been returned.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Borrower</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Checked Out</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loans.map((loan) => (
            <TableRow key={loan.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{loan.items?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {loan.items?.sku} • {loan.items?.location}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{loan.quantity}</Badge>
              </TableCell>
              <TableCell>{loan.user_name}</TableCell>
              <TableCell>{loan.project_name}</TableCell>
              <TableCell>
                {format(new Date(loan.timestamp), 'MMM d, yyyy h:mm a')}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {formatDistanceToNow(new Date(loan.timestamp), { addSuffix: false })}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReturn(loan)}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Return
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
