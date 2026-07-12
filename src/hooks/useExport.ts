import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { ProjectData } from './useFirestore';
import toast from 'react-hot-toast';

export const useExport = () => {
  const [exporting, setExporting] = useState(false);

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async (project: ProjectData): Promise<void> => {
    setExporting(true);
    try {
      const generatePDF = httpsCallable(functions, 'generatePDF');
      const result = await generatePDF({ project });
      const { downloadUrl, filename } = result.data as { downloadUrl: string; filename: string };
      triggerDownload(downloadUrl, filename);
      toast.success('PDF exportado correctamente');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Error al exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = async (project: ProjectData): Promise<void> => {
    setExporting(true);
    try {
      const generateExcel = httpsCallable(functions, 'generateExcel');
      const result = await generateExcel({ project });
      const { downloadUrl, filename } = result.data as { downloadUrl: string; filename: string };
      triggerDownload(downloadUrl, filename);
      toast.success('Excel exportado correctamente');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Error al exportar Excel');
    } finally {
      setExporting(false);
    }
  };

  return { exportToPDF, exportToExcel, exporting };
};
