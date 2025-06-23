
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportableInspection {
  id: string;
  inspection_number: string;
  project_name: string;
  task_area: string;
  inspector_name: string;
  inspection_date: string;
  overall_status: string;
}

export const exportInspectionToPDF = async (
  inspectionElement: HTMLElement,
  inspection: ExportableInspection
): Promise<Blob> => {
  const canvas = await html2canvas(inspectionElement, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
  const imgX = (pdfWidth - imgWidth * ratio) / 2;
  const imgY = 0;

  pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
  
  return pdf.output('blob');
};

export const exportMultipleInspectionsToPDF = async (
  inspectionElements: HTMLElement[],
  inspections: ExportableInspection[]
): Promise<Blob> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  for (let i = 0; i < inspectionElements.length; i++) {
    const element = inspectionElements[i];
    const inspection = inspections[i];
    
    if (i > 0) {
      pdf.addPage();
    }
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
  }
  
  return pdf.output('blob');
};

export const downloadPDF = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
