import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/import/FileUpload';
import { ImportPreview, type ImportRow } from '@/components/import/ImportPreview';
import { parseImportFile, generateTemplate } from '@/lib/importParser';
import { toast } from 'sonner';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';

export default function Import() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const queryClient = useQueryClient();

  const handleFileSelect = async (file: File) => {
    setIsParsing(true);
    try {
      const parsed = await parseImportFile(file);
      setRows(parsed);
      toast.success(`Parsed ${parsed.length} rows`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to parse file');
      setRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (validRows: ImportRow[]) => {
      // Deduplicate by SKU (last occurrence wins) to avoid unique constraint errors
      const dedupedBySku = new Map<string, ImportRow>();
      validRows.forEach(row => dedupedBySku.set(row.sku, row));
      const itemsToInsert = Array.from(dedupedBySku.values()).map(row => ({
        name: row.name,
        sku: row.sku,
        category: row.category,
        type: row.type,
        location: row.location,
        quantity_total: row.quantity_total,
        quantity_available: row.quantity_available,
        min_stock_threshold: row.min_stock_threshold,
        unit_price: row.unit_price,
        notes: row.notes || null,
      }));

      const { error } = await supabase
        .from('items')
        .upsert(itemsToInsert, { onConflict: 'sku' });
      if (error) throw error;
      return itemsToInsert.length;
    },
    onSuccess: (count) => {
      toast.success(`Successfully imported ${count} items`);
      setRows([]);
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: Error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });

  const validRows = rows.filter(r => r.isValid);
  const canImport = validRows.length > 0 && !importMutation.isPending;

  const handleImport = () => {
    if (canImport) {
      importMutation.mutate(validRows);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Inventory
          </CardTitle>
          <CardDescription>
            Upload a CSV or Excel file to bulk import inventory items
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button variant="outline" onClick={generateTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>

          <FileUpload 
            onFileSelect={handleFileSelect} 
            isLoading={isParsing || importMutation.isPending}
          />

          {rows.length > 0 && (
            <>
              <ImportPreview rows={rows} />
              
              <div className="flex justify-end gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setRows([])}
                  disabled={importMutation.isPending}
                >
                  Clear
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={!canImport}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import {validRows.length} Items
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-1">Required Columns</h4>
            <p>name, sku, category, location</p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">Optional Columns</h4>
            <p>type (ASSET/CONSUMABLE, defaults to CONSUMABLE), quantity_total, quantity_available, min_stock_threshold, unit_price, notes</p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">Supported Formats</h4>
            <p>CSV, XLSX, XLS</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
