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

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const addTextToPDF = (pdf: jsPDF, text: string, x: number, y: number, fontSize: number = 10) => {
  pdf.setFontSize(fontSize);
  const splitText = pdf.splitTextToSize(text, 170);
  pdf.text(splitText, x, y);
  return y + (splitText.length * fontSize * 0.4);
};

export const exportInspectionToPDF = async (
  inspectionElement: HTMLElement,
  inspection: ExportableInspection
): Promise<Blob> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let currentY = 20;

  // Title Page
  pdf.setFontSize(20);
  pdf.text('QA/ITP Inspection Report', pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  pdf.setFontSize(14);
  pdf.text(`Inspection Number: ${inspection.inspection_number}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 20;

  // Find the inspection viewer element to extract detailed data
  const inspectionViewer = inspectionElement.querySelector('[data-inspection-viewer]') || inspectionElement;
  
  // Extract inspection details
  const projectName = inspectionViewer.querySelector('[data-project-name]')?.textContent || inspection.project_name;
  const taskArea = inspectionViewer.querySelector('[data-task-area]')?.textContent || inspection.task_area;
  const locationRef = inspectionViewer.querySelector('[data-location-reference]')?.textContent || '';
  const inspectorName = inspectionViewer.querySelector('[data-inspector-name]')?.textContent || inspection.inspector_name;
  const inspectionDate = inspectionViewer.querySelector('[data-inspection-date]')?.textContent || inspection.inspection_date;
  const overallStatus = inspectionViewer.querySelector('[data-overall-status]')?.textContent || inspection.overall_status;

  // Section 1: Inspection Overview
  pdf.setFontSize(16);
  pdf.text('Inspection Overview', 20, currentY);
  currentY += 10;

  pdf.setFontSize(12);
  currentY = addTextToPDF(pdf, `Project: ${projectName}`, 20, currentY, 12);
  currentY = addTextToPDF(pdf, `Task Area: ${taskArea}`, 20, currentY, 12);
  currentY = addTextToPDF(pdf, `Location: ${locationRef}`, 20, currentY, 12);
  currentY = addTextToPDF(pdf, `Inspector: ${inspectorName}`, 20, currentY, 12);
  currentY = addTextToPDF(pdf, `Date: ${new Date(inspectionDate).toLocaleDateString()}`, 20, currentY, 12);
  currentY = addTextToPDF(pdf, `Overall Status: ${overallStatus}`, 20, currentY, 12);
  currentY += 15;

  // Section 2: Checklist Items
  pdf.setFontSize(16);
  pdf.text('Inspection Checklist', 20, currentY);
  currentY += 10;

  const checklistItems = inspectionViewer.querySelectorAll('[data-checklist-item]');
  for (const item of checklistItems) {
    if (currentY > pageHeight - 30) {
      pdf.addPage();
      currentY = 20;
    }

    const description = item.querySelector('[data-item-description]')?.textContent || '';
    const requirements = item.querySelector('[data-item-requirements]')?.textContent || '';
    const status = item.querySelector('[data-item-status]')?.textContent || '';
    const comments = item.querySelector('[data-item-comments]')?.textContent || '';

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    currentY = addTextToPDF(pdf, description, 20, currentY, 12);
    
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(10);
    currentY = addTextToPDF(pdf, `Requirements: ${requirements}`, 25, currentY, 10);
    currentY = addTextToPDF(pdf, `Status: ${status}`, 25, currentY, 10);
    
    if (comments.trim()) {
      currentY = addTextToPDF(pdf, `Comments: ${comments}`, 25, currentY, 10);
    }

    // Add evidence images
    const evidenceImages = item.querySelectorAll('.evidence-image, [data-evidence-image]');
    if (evidenceImages.length > 0) {
      currentY += 5;
      pdf.setFontSize(10);
      pdf.text('Evidence:', 25, currentY);
      currentY += 5;

      for (const img of evidenceImages) {
        if (currentY > pageHeight - 70) {
          pdf.addPage();
          currentY = 20;
        }

        const imageElement = img as HTMLImageElement;
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = imageElement.naturalWidth;
            canvas.height = imageElement.naturalHeight;
            ctx.drawImage(imageElement, 0, 0);
            
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            const maxWidth = 60;
            const maxHeight = 45;
            
            pdf.addImage(imageData, 'JPEG', 25, currentY, maxWidth, maxHeight);
            currentY += maxHeight + 5;
          }
        } catch (error) {
          console.error('Error adding evidence image:', error);
        }
      }
    }

    currentY += 10;
  }

  // Section 3: Other Attachments
  if (currentY > pageHeight - 50) {
    pdf.addPage();
    currentY = 20;
  } else {
    currentY += 10;
  }

  pdf.setFontSize(16);
  pdf.text('Other Attachments', 20, currentY);
  currentY += 10;

  const attachmentFiles = inspectionElement.querySelectorAll('input[type="file"]');
  let hasAttachments = false;

  attachmentFiles.forEach(input => {
    const files = (input as HTMLInputElement).files;
    if (files && files.length > 0) {
      hasAttachments = true;
      Array.from(files).forEach(file => {
        if (currentY > pageHeight - 30) {
          pdf.addPage();
          currentY = 20;
        }
        
        pdf.setFontSize(10);
        currentY = addTextToPDF(pdf, `• ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 25, currentY, 10);
      });
    }
  });

  if (!hasAttachments) {
    pdf.setFontSize(10);
    currentY = addTextToPDF(pdf, 'No additional attachments uploaded.', 25, currentY, 10);
  }

  // Section 4: Change History (Audit Trail)
  if (currentY > pageHeight - 50) {
    pdf.addPage();
    currentY = 20;
  } else {
    currentY += 15;
  }

  pdf.setFontSize(16);
  pdf.text('Change History', 20, currentY);
  currentY += 10;

  const historyItems = inspectionViewer.querySelectorAll('[data-history-item]');
  if (historyItems.length > 0) {
    historyItems.forEach(historyItem => {
      if (currentY > pageHeight - 30) {
        pdf.addPage();
        currentY = 20;
      }

      const timestamp = historyItem.querySelector('[data-history-timestamp]')?.textContent || '';
      const user = historyItem.querySelector('[data-history-user]')?.textContent || '';
      const field = historyItem.querySelector('[data-history-field]')?.textContent || '';
      const oldValue = historyItem.querySelector('[data-history-old-value]')?.textContent || '';
      const newValue = historyItem.querySelector('[data-history-new-value]')?.textContent || '';

      pdf.setFontSize(10);
      currentY = addTextToPDF(pdf, `${timestamp} - ${user}`, 25, currentY, 10);
      currentY = addTextToPDF(pdf, `  Changed ${field}: ${oldValue} → ${newValue}`, 25, currentY, 9);
      currentY += 3;
    });
  } else {
    pdf.setFontSize(10);
    currentY = addTextToPDF(pdf, 'No changes recorded.', 25, currentY, 10);
  }

  // Footer
  const pageCount = pdf.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, pageHeight - 10);
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 40, pageHeight - 10);
  }
  
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
    
    // Add attachments for each inspection
    const evidenceImages = element.querySelectorAll('.evidence-image');
    if (evidenceImages.length > 0) {
      pdf.addPage();
      
      let yPosition = 20;
      pdf.setFontSize(14);
      pdf.text(`Attachments - ${inspection.inspection_number}`, 20, yPosition);
      yPosition += 15;
      
      for (const img of evidenceImages) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        
        const imageElement = img as HTMLImageElement;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        
        canvas.width = imageElement.naturalWidth;
        canvas.height = imageElement.naturalHeight;
        ctx.drawImage(imageElement, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        const maxWidth = 80;
        const maxHeight = 60;
        
        pdf.addImage(imageData, 'JPEG', 20, yPosition, maxWidth, maxHeight);
        yPosition += maxHeight + 10;
      }
    }
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
