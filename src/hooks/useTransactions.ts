import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Transaction = Tables<'transactions'>;

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          items:item_id (
            id,
            name,
            sku,
            category
          )
        `)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}
