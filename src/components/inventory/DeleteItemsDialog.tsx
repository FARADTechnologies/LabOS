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
import { useDeleteItems } from '@/hooks/useInventory';
import { toast } from 'sonner';

interface DeleteItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemCount: number;
  itemIds: string[];
  onDeleted?: () => void;
}

export function DeleteItemsDialog({ open, onOpenChange, itemCount, itemIds, onDeleted }: DeleteItemsDialogProps) {
  const deleteItems = useDeleteItems();

  const handleDelete = async () => {
    if (!itemIds.length) return;
    try {
      await deleteItems.mutateAsync(itemIds);
      toast.success(`Deleted ${itemCount} item${itemCount > 1 ? 's' : ''}`);
      onOpenChange(false);
      onDeleted?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete items');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {itemCount} item{itemCount > 1 ? 's' : ''}</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the selected items. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteItems.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
