
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

const addImageToPDF = (pdf: jsPDF, imageBase64: string, x: number, y: number, maxWidth: number, maxHeight: number) => {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx)  return;
    
    // Calculate dimensions to fit within maxWidth and maxHeight
    let { width, height } = img;
    const aspectRatio = width / height;
    
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    
    const resizedImageData = canvas.toDataURL('image/jpeg', 0.8);
    pdf.addImage(resizedImageData, 'JPEG', x, y, width, height);
  };
  img.src = imageBase64;
};

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
  
  // Add attachments section if there are files
  const fileInputs = inspectionElement.querySelectorAll('input[type="file"]');
  const attachmentFiles: File[] = [];
  
  fileInputs.forEach(input => {
    const files = (input as HTMLInputElement).files;
    if (files) {
      Array.from(files).forEach(file => attachmentFiles.push(file));
    }
  });

  // Add evidence images from checklist items
  const evidenceImages = inspectionElement.querySelectorAll('.evidence-image');
  if (evidenceImages.length > 0 || attachmentFiles.length > 0) {
    pdf.addPage();
    
    let yPosition = 20;
    pdf.setFontSize(16);
    pdf.text('Attachments & Evidence', 20, yPosition);
    yPosition += 15;
    
    // Add evidence images
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
    
    // Add attachment files (only images for now)
    for (const file of attachmentFiles) {
      if (file.type.startsWith('image/')) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        
        try {
          const base64 = await convertFileToBase64(file);
          const maxWidth = 80;
          const maxHeight = 60;
          
          pdf.addImage(base64, 'JPEG', 20, yPosition, maxWidth, maxHeight);
          
          // Add filename
          pdf.setFontSize(10);
          pdf.text(file.name, 110, yPosition + 10);
          
          yPosition += maxHeight + 15;
        } catch (error) {
          console.error('Error adding image to PDF:', error);
        }
      }
    }
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
