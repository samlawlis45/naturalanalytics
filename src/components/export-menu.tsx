'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Image as ImageIcon,
  Loader2 
} from 'lucide-react';

interface ExportMenuProps {
  data: Record<string, unknown>[];
  filename?: string;
  chartRef?: React.RefObject<HTMLDivElement | null>;
}

export function ExportMenu({ data, filename = 'export', chartRef }: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          const strValue = String(value ?? '');
          // Escape quotes and wrap in quotes if contains comma or newline
          if (strValue.includes(',') || strValue.includes('\n') || strValue.includes('"')) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    if (!data || data.length === 0) return;

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.json`;
    link.click();
  };

  const exportChartAsImage = async () => {
    if (!chartRef?.current) return;

    setIsExporting(true);
    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: 'white',
        scale: 2 // Higher quality
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}-chart.png`;
        link.click();
      });
    } catch (error) {
      console.error('Failed to export chart:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative group">
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4 mr-1" />
        Export
      </Button>
      
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
        <div className="py-1">
          <button
            onClick={exportToCSV}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as CSV
          </button>
          
          <button
            onClick={exportToJSON}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export as JSON
          </button>
          
          {chartRef && (
            <button
              onClick={exportChartAsImage}
              disabled={isExporting}
              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4 mr-2" />
              )}
              Export Chart as Image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}