
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useQAInspections } from '@/hooks/useQAInspections';
import { useProjects } from '@/hooks/useProjects';
import { exportMultipleInspectionsToPDF, downloadPDF, ExportableInspection } from '@/utils/pdfExport';
import { useToast } from '@/hooks/use-toast';

interface QABulkExportProps {
  onClose: () => void;
}

const QABulkExport: React.FC<QABulkExportProps> = ({ onClose }) => {
  const { inspections } = useQAInspections();
  const { projects } = useProjects();
  const { toast } = useToast();
  const [selectedInspections, setSelectedInspections] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
      case 'pending-reinspection':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Reinspection</Badge>;
      case 'incomplete-in-progress':
        return <Badge className="bg-blue-100 text-blue-800">Incomplete/In Progress</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleSelectAll = () => {
    if (selectedInspections.length === inspections.length) {
      setSelectedInspections([]);
    } else {
      setSelectedInspections(inspections.map(i => i.id));
    }
  };

  const handleSelectInspection = (inspectionId: string) => {
    setSelectedInspections(prev => 
      prev.includes(inspectionId)
        ? prev.filter(id => id !== inspectionId)
        : [...prev, inspectionId]
    );
  };

  const handleExportPDF = async () => {
    if (selectedInspections.length === 0) {
      toast({
        title: "No Inspections Selected",
        description: "Please select at least one inspection to export.",
        variant: "destructive"
      });
      return;
    }

    setExporting(true);
    
    try {
      // Create hidden elements for each selected inspection
      const elementsToExport: HTMLElement[] = [];
      const inspectionsToExport: ExportableInspection[] = [];
      
      for (const inspectionId of selectedInspections) {
        const inspection = inspections.find(i => i.id === inspectionId);
        if (!inspection) continue;

        // Create a temporary div with inspection content
        const tempDiv = document.createElement('div');
        tempDiv.className = 'p-8 bg-white';
        tempDiv.style.width = '800px';
        tempDiv.innerHTML = `
          <div class="space-y-6">
            <div class="text-center border-b pb-4">
              <h1 class="text-2xl font-bold">QA/ITP Inspection Report</h1>
              <p class="text-gray-600">Inspection Number: ${inspection.inspection_number}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="font-semibold text-gray-700">Project:</label>
                <p>${getProjectName(inspection.project_id)}</p>
              </div>
              <div>
                <label class="font-semibold text-gray-700">Task Area:</label>
                <p>${inspection.task_area}</p>
              </div>
              <div>
                <label class="font-semibold text-gray-700">Inspector:</label>
                <p>${inspection.inspector_name}</p>
              </div>
              <div>
                <label class="font-semibold text-gray-700">Date:</label>
                <p>${new Date(inspection.inspection_date).toLocaleDateString()}</p>
              </div>
              <div>
                <label class="font-semibold text-gray-700">Status:</label>
                <p>${inspection.overall_status}</p>
              </div>
              <div>
                <label class="font-semibold text-gray-700">Location:</label>
                <p>${inspection.location_reference}</p>
              </div>
            </div>
            
            <div class="mt-8">
              <h3 class="text-lg font-semibold mb-4">Inspection Details</h3>
              <p><strong>Type:</strong> ${inspection.inspection_type}</p>
              <p><strong>Template:</strong> ${inspection.template_type}</p>
              ${inspection.is_fire_door ? '<p><strong>Fire Door:</strong> Yes</p>' : ''}
            </div>
            
            <div class="mt-8 pt-4 border-t">
              <p class="text-sm text-gray-600">Generated on: ${new Date().toLocaleString()}</p>
              <p class="text-sm text-gray-600">Digital Signature: ${inspection.digital_signature}</p>
            </div>
          </div>
        `;
        
        document.body.appendChild(tempDiv);
        elementsToExport.push(tempDiv);
        inspectionsToExport.push({
          id: inspection.id,
          inspection_number: inspection.inspection_number,
          project_name: getProjectName(inspection.project_id),
          task_area: inspection.task_area,
          inspector_name: inspection.inspector_name,
          inspection_date: inspection.inspection_date,
          overall_status: inspection.overall_status
        });
      }

      const pdfBlob = await exportMultipleInspectionsToPDF(elementsToExport, inspectionsToExport);
      
      // Clean up temporary elements
      elementsToExport.forEach(el => document.body.removeChild(el));
      
      const filename = selectedInspections.length === 1 
        ? `QA_Inspection_${inspectionsToExport[0].inspection_number}.pdf`
        : `QA_Inspections_Bulk_Export_${new Date().toISOString().split('T')[0]}.pdf`;
      
      downloadPDF(pdfBlob, filename);
      
      toast({
        title: "Export Successful",
        description: `${selectedInspections.length} inspection(s) exported to PDF successfully.`,
      });
      
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export inspections to PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Bulk PDF Export - QA/ITP Inspections
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleSelectAll}
              disabled={inspections.length === 0}
            >
              {selectedInspections.length === inspections.length ? 'Deselect All' : 'Select All'}
            </Button>
            <span className="text-sm text-gray-600">
              {selectedInspections.length} of {inspections.length} selected
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportPDF}
              disabled={selectedInspections.length === 0 || exporting}
              className="flex items-center gap-2"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exporting ? 'Exporting...' : 'Export to PDF'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="border rounded-lg max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Checkbox
                    checked={selectedInspections.length === inspections.length && inspections.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Inspection #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Project
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Task Area
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inspections.map((inspection) => (
                <tr 
                  key={inspection.id} 
                  className={`hover:bg-gray-50 ${selectedInspections.includes(inspection.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-4 py-4">
                    <Checkbox
                      checked={selectedInspections.includes(inspection.id)}
                      onCheckedChange={() => handleSelectInspection(inspection.id)}
                    />
                  </td>
                  <td className="px-4 py-4 text-sm font-medium">
                    {inspection.inspection_number}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {getProjectName(inspection.project_id)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {inspection.task_area}
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(inspection.overall_status)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {new Date(inspection.inspection_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {inspections.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No inspections available for export.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QABulkExport;
