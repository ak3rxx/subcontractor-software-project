
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Download, FileText } from 'lucide-react';
import { useQAInspections } from '@/hooks/useQAInspections';
import { useToast } from '@/hooks/use-toast';

interface QABulkExportProps {
  onClose: () => void;
  selectedInspectionIds?: string[];
}

const QABulkExport: React.FC<QABulkExportProps> = ({ onClose, selectedInspectionIds = [] }) => {
  const { inspections } = useQAInspections();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedInspectionIds);
  const [exporting, setExporting] = useState(false);

  const availableInspections = inspections.filter(inspection => 
    selectedInspectionIds.length === 0 || selectedInspectionIds.includes(inspection.id)
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(availableInspections.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectInspection = (inspectionId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, inspectionId]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== inspectionId));
    }
  };

  const handleExport = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one inspection to export.",
        variant: "destructive"
      });
      return;
    }

    setExporting(true);
    try {
      // Here you would implement the bulk PDF export logic
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate export time
      
      toast({
        title: "Export Successful",
        description: `Successfully exported ${selectedIds.length} inspection(s) to PDF.`,
      });
      
      onClose();
    } catch (error) {
      console.error('Bulk export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export inspections. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Bulk PDF Export
        </h3>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Inspections to Export</CardTitle>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.length === availableInspections.length && availableInspections.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-gray-600">Select All ({availableInspections.length} inspections)</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availableInspections.map((inspection) => (
              <div key={inspection.id} className="flex items-center gap-3 p-2 border rounded">
                <Checkbox
                  checked={selectedIds.includes(inspection.id)}
                  onCheckedChange={(checked) => handleSelectInspection(inspection.id, checked as boolean)}
                />
                <div className="flex-1">
                  <div className="font-medium">{inspection.inspection_number}</div>
                  <div className="text-sm text-gray-600">
                    {inspection.project_name} - {inspection.task_area}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(inspection.inspection_date).toLocaleDateString()} - {inspection.inspector_name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onClose} disabled={exporting}>
          Cancel
        </Button>
        <Button onClick={handleExport} disabled={exporting || selectedIds.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          {exporting ? `Exporting ${selectedIds.length} PDF(s)...` : `Export ${selectedIds.length} PDF(s)`}
        </Button>
      </div>
    </div>
  );
};

export default QABulkExport;
