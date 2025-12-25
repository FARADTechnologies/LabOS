import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Transaction = Tables<'transactions'>;
export type TransactionInsert = TablesInsert<'transactions'>;

// Active loans are CHECKOUT transactions with OPEN status
export function useActiveLoans() {
  return useQuery({
    queryKey: ['active-loans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          items:item_id (
            id,
            name,
            sku,
            category,
            location
          )
        `)
        .eq('transaction_type', 'CHECKOUT')
        .eq('status', 'OPEN')
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCheckoutItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (checkout: Omit<TransactionInsert, 'transaction_type' | 'status'>) => {
      // First, decrease the available quantity
      const { data: item, error: itemError } = await supabase
        .from('items')
        .select('quantity_available')
        .eq('id', checkout.item_id)
        .single();
      
      if (itemError) throw itemError;
      if (!item || item.quantity_available < checkout.quantity) {
        throw new Error('Not enough quantity available');
      }
      
      const { error: updateError } = await supabase
        .from('items')
        .update({ quantity_available: item.quantity_available - checkout.quantity })
        .eq('id', checkout.item_id);
      
      if (updateError) throw updateError;
      
      // Then create the checkout transaction
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...checkout,
          transaction_type: 'CHECKOUT',
          status: 'OPEN',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-loans'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useReturnItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ loanId, itemId, quantity }: { loanId: string; itemId: string; quantity: number }) => {
      // First, increase the available quantity
      const { data: item, error: itemError } = await supabase
        .from('items')
        .select('quantity_available, quantity_total')
        .eq('id', itemId)
        .single();
      
      if (itemError) throw itemError;
      
      const newAvailable = Math.min(item.quantity_available + quantity, item.quantity_total);
      
      const { error: updateError } = await supabase
        .from('items')
        .update({ quantity_available: newAvailable })
        .eq('id', itemId);
      
      if (updateError) throw updateError;
      
      // Close the loan transaction
      const { data, error } = await supabase
        .from('transactions')
        .update({ status: 'CLOSED' })
        .eq('id', loanId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Create a return transaction record
      const { error: returnError } = await supabase
        .from('transactions')
        .insert({
          item_id: itemId,
          transaction_type: 'RETURN',
          quantity,
          user_name: data.user_name,
          project_name: data.project_name,
          status: 'CLOSED',
          notes: `Returned from loan ${loanId}`,
        });
      
      if (returnError) throw returnError;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-loans'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
