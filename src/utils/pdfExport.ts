
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

const loadImageFromUrl = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

const addTextToPDF = (pdf: jsPDF, text: string, x: number, y: number, fontSize: number = 10) => {
  pdf.setFontSize(fontSize);
  const splitText = pdf.splitTextToSize(text, 170);
  pdf.text(splitText, x, y);
  return y + (splitText.length * fontSize * 0.4);
};

const addImageToPDF = async (pdf: jsPDF, imageUrl: string, x: number, y: number, maxWidth: number, maxHeight: number): Promise<number> => {
  try {
    const img = await loadImageFromUrl(imageUrl);
    
    // Calculate dimensions to maintain aspect ratio
    const aspectRatio = img.width / img.height;
    let width = maxWidth;
    let height = maxWidth / aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }
    
    // Convert image to canvas to get image data
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx?.drawImage(img, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    pdf.addImage(imageData, 'JPEG', x, y, width, height);
    
    return y + height + 5; // Return new Y position after image
  } catch (error) {
    console.error('Error adding image to PDF:', error);
    // Add a placeholder text if image fails to load
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text('Image could not be loaded', x, y);
    pdf.setTextColor(0);
    return y + 10;
  }
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

    // Add evidence images - look for both rendered images and file info
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
        if (imageElement.src && imageElement.src !== '') {
          currentY = await addImageToPDF(pdf, imageElement.src, 25, currentY, 60, 45);
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
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Add title page
  pdf.setFontSize(24);
  pdf.text('QA/ITP Bulk Export Report', pageWidth / 2, 30, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.text(`${inspections.length} Inspection Reports`, pageWidth / 2, 45, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 60, { align: 'center' });
  
  // Add table of contents
  let currentY = 80;
  pdf.setFontSize(16);
  pdf.text('Table of Contents', 20, currentY);
  currentY += 15;
  
  pdf.setFontSize(10);
  inspections.forEach((inspection, index) => {
    if (currentY > pageHeight - 20) {
      pdf.addPage();
      currentY = 20;
    }
    
    const pageNum = index + 2; // +2 because we have title page and this TOC page
    pdf.text(`${index + 1}. ${inspection.inspection_number} - ${inspection.project_name}`, 25, currentY);
    pdf.text(`Page ${pageNum}`, pageWidth - 40, currentY);
    currentY += 6;
  });
  
  // Process each inspection
  for (let i = 0; i < inspectionElements.length; i++) {
    const element = inspectionElements[i];
    const inspection = inspections[i];
    
    pdf.addPage();
    
    try {
      // Convert the element to canvas
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate dimensions to fit page
      const maxWidth = pageWidth - 20; // 10mm margin on each side
      const maxHeight = pageHeight - 40; // 20mm margin top and bottom
      
      const ratio = Math.min(maxWidth / (imgWidth * 0.264583), maxHeight / (imgHeight * 0.264583));
      const finalWidth = imgWidth * 0.264583 * ratio;
      const finalHeight = imgHeight * 0.264583 * ratio;
      
      // Center the image on the page
      const x = (pageWidth - finalWidth) / 2;
      const y = 20;

      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      
      // Add page number
      pdf.setFontSize(8);
      pdf.text(`Inspection ${i + 1} of ${inspections.length} - ${inspection.inspection_number}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
    } catch (error) {
      console.error(`Error processing inspection ${inspection.inspection_number}:`, error);
      
      // Fallback: Add text-based content if canvas conversion fails
      let textY = 30;
      pdf.setFontSize(16);
      pdf.text(`Inspection Report: ${inspection.inspection_number}`, 20, textY);
      textY += 15;
      
      pdf.setFontSize(12);
      pdf.text(`Project: ${inspection.project_name}`, 20, textY);
      textY += 8;
      pdf.text(`Task Area: ${inspection.task_area}`, 20, textY);
      textY += 8;
      pdf.text(`Inspector: ${inspection.inspector_name}`, 20, textY);
      textY += 8;
      pdf.text(`Date: ${new Date(inspection.inspection_date).toLocaleDateString()}`, 20, textY);
      textY += 8;
      pdf.text(`Status: ${inspection.overall_status}`, 20, textY);
      textY += 15;
      
      pdf.setFontSize(10);
      pdf.text('Note: Full inspection details could not be rendered. Please export individual inspection for complete report.', 20, textY);
    }
  }
  
  // Add footer to all pages
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, pageHeight - 5);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 5);
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
