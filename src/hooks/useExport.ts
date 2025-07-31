import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { ProjectData } from './useFirestore';
import toast from 'react-hot-toast';

export const useExport = () => {
  const [exporting, setExporting] = useState(false);

  const exportToPDF = async (project: ProjectData): Promise<void> => {
    setExporting(true);
    try {
      const generatePDF = httpsCallable(functions, 'generatePDF');
      const result = await generatePDF({ project });
      
      const { downloadUrl } = result.data as { downloadUrl: string };
      
      // Create a temporary link to download the PDF
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${project.title || 'project'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = async (project: ProjectData): Promise<void> => {
    setExporting(true);
    try {
      const generateExcel = httpsCallable(functions, 'generateExcel');
      const result = await generateExcel({ project });
      
      const { downloadUrl } = result.data as { downloadUrl: string };
      
      // Create a temporary link to download the Excel file
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${project.title || 'project'}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Excel file exported successfully');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel file');
    } finally {
      setExporting(false);
    }
  };

  return { exportToPDF, exportToExcel, exporting };
};