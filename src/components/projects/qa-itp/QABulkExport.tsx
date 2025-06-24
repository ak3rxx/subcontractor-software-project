
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Download, FileText } from 'lucide-react';
import { useQAInspections } from '@/hooks/useQAInspections';
import { useToast } from '@/hooks/use-toast';
import { exportMultipleInspectionsToPDF, downloadPDF, type ExportableInspection } from '@/utils/pdfExport';

interface QABulkExportProps {
  onClose: () => void;
  selectedInspectionIds?: string[];
}

const QABulkExport: React.FC<QABulkExportProps> = ({ onClose, selectedInspectionIds = [] }) => {
  const { inspections, getChecklistItems } = useQAInspections();
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
      // Get the selected inspections
      const selectedInspections = inspections.filter(inspection => 
        selectedIds.includes(inspection.id)
      );

      // Create DOM elements for each inspection for PDF generation
      const inspectionElements: HTMLElement[] = [];
      const exportableInspections: ExportableInspection[] = [];

      for (const inspection of selectedInspections) {
        // Fetch checklist items for this inspection
        const checklistItems = await getChecklistItems(inspection.id);
        
        // Create a temporary DOM element with inspection data for PDF generation
        const element = document.createElement('div');
        element.setAttribute('data-inspection-viewer', 'true');
        
        // Build checklist items HTML with proper image handling
        const checklistItemsHtml = checklistItems?.map(item => {
          let evidenceFilesHtml = '';
          
          if (item.evidence_files && item.evidence_files.length > 0) {
            const imageElements = item.evidence_files.map(filePath => {
              const fileName = filePath.split('/').pop() || 'Unknown file';
              const isPDF = fileName.toLowerCase().endsWith('.pdf');
              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
              
              if (isImage) {
                // Create proper image URL from Supabase storage path
                const imageUrl = `https://deobtjgmduxzhxstbejm.supabase.co/storage/v1/object/public/qainspectionfiles/${filePath}`;
                return `<img src="${imageUrl}" alt="${fileName}" class="evidence-image pdf-image" style="max-width: 200px; max-height: 150px; margin: 5px;" crossorigin="anonymous" />`;
              } else {
                return `<div class="file-attachment">${fileName}${isPDF ? ' <span class="font-semibold text-red-600">(PDF)</span>' : ''}</div>`;
              }
            }).join('');
            
            evidenceFilesHtml = `
              <div class="evidence-section mt-3">
                <strong>Evidence Files:</strong>
                <div class="evidence-container mt-2">
                  ${imageElements}
                </div>
              </div>
            `;
          }
          
          return `
            <div class="border rounded p-3 mb-3" data-checklist-item>
              <div class="font-medium" data-item-description>${item.description}</div>
              <div class="text-sm text-gray-600" data-item-requirements>Requirements: ${item.requirements}</div>
              <div class="text-sm" data-item-status>Status: ${item.status || 'Not checked'}</div>
              ${item.comments ? `<div class="text-sm text-gray-600" data-item-comments>Comments: ${item.comments}</div>` : ''}
              ${evidenceFilesHtml}
            </div>
          `;
        }).join('') || '<p>No checklist items available</p>';
        
        element.innerHTML = `
          <div class="p-6 space-y-6">
            <div class="border-b pb-4">
              <h1 class="text-2xl font-bold">QA/ITP Inspection Report</h1>
              <p class="text-lg text-gray-600">Inspection #${inspection.inspection_number}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="font-semibold" data-project-name>Project:</span> ${inspection.project_name}
              </div>
              <div>
                <span class="font-semibold" data-task-area>Task Area:</span> ${inspection.task_area}
              </div>
              <div>
                <span class="font-semibold" data-location-reference>Location:</span> ${inspection.location_reference || 'N/A'}
              </div>
              <div>
                <span class="font-semibold" data-inspector-name>Inspector:</span> ${inspection.inspector_name}
              </div>
              <div>
                <span class="font-semibold" data-inspection-date>Date:</span> ${new Date(inspection.inspection_date).toLocaleDateString()}
              </div>
              <div>
                <span class="font-semibold" data-overall-status>Status:</span> ${inspection.overall_status}
              </div>
            </div>
            
            <div>
              <h3 class="text-lg font-semibold mb-3">Inspection Checklist</h3>
              <div class="space-y-2">
                ${checklistItemsHtml}
              </div>
            </div>
          </div>
        `;
        
        // Temporarily add to document for rendering
        document.body.appendChild(element);
        
        // Wait for images to load before proceeding
        const images = element.querySelectorAll('img.evidence-image');
        const imageLoadPromises = Array.from(images).map(img => {
          return new Promise((resolve) => {
            const imageElement = img as HTMLImageElement;
            if (imageElement.complete) {
              resolve(true);
            } else {
              imageElement.onload = () => resolve(true);
              imageElement.onerror = () => resolve(false);
              // Timeout after 5 seconds
              setTimeout(() => resolve(false), 5000);
            }
          });
        });
        
        // Wait for all images to load (or timeout)
        await Promise.all(imageLoadPromises);
        
        inspectionElements.push(element);
        
        exportableInspections.push({
          id: inspection.id,
          inspection_number: inspection.inspection_number,
          project_name: inspection.project_name,
          task_area: inspection.task_area,
          inspector_name: inspection.inspector_name,
          inspection_date: inspection.inspection_date,
          overall_status: inspection.overall_status
        });
      }

      // Generate the combined PDF
      const pdfBlob = await exportMultipleInspectionsToPDF(inspectionElements, exportableInspections);
      
      // Clean up DOM elements
      inspectionElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });

      // Generate filename with current date and inspection count
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `QA-ITP-Bulk-Export-${selectedIds.length}-inspections-${currentDate}.pdf`;
      
      // Download the PDF
      downloadPDF(pdfBlob, filename);
      
      toast({
        title: "Export Successful",
        description: `Successfully exported ${selectedIds.length} inspection(s) to PDF: ${filename}`,
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
