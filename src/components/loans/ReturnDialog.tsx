import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useReturnItem } from '@/hooks/useLoans';
import { toast } from 'sonner';

interface ReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: {
    id: string;
    item_id: string;
    quantity: number;
    user_name: string;
    items?: {
      name: string;
    } | null;
  } | null;
}

export function ReturnDialog({ open, onOpenChange, loan }: ReturnDialogProps) {
  const returnItem = useReturnItem();

  const handleReturn = async () => {
    if (!loan) return;
    
    try {
      await returnItem.mutateAsync({
        loanId: loan.id,
        itemId: loan.item_id,
        quantity: loan.quantity,
      });
      toast.success('Item returned successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to return item');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Return Equipment</AlertDialogTitle>
          <AlertDialogDescription>
            Return {loan?.quantity}x "{loan?.items?.name}" from {loan?.user_name}?
            This will mark the loan as closed and restore the available quantity.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReturn} disabled={returnItem.isPending}>
            {returnItem.isPending ? 'Processing...' : 'Confirm Return'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
