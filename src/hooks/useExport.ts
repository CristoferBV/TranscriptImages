import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { ProjectData } from './useFirestore';
import toast from 'react-hot-toast';

export const useExport = () => {
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const exportToPDF = async (project: ProjectData): Promise<void> => {
    setExportingPDF(true);
    try {
      const generatePDF = httpsCallable(functions, 'generatePDF');
      const result = await generatePDF({ project });
      const { downloadUrl } = result.data as { downloadUrl: string; filename: string };
      // Abrir en nueva pestaña para vista previa
      window.open(downloadUrl, '_blank');
      toast.success('PDF listo para visualizar');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Error al exportar PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  const exportToExcel = async (project: ProjectData): Promise<void> => {
    setExportingExcel(true);
    try {
      const generateExcel = httpsCallable(functions, 'generateExcel');
      const result = await generateExcel({ project });
      const { downloadUrl, filename } = result.data as { downloadUrl: string; filename: string };
      // Descargar directamente
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Excel exportado correctamente');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Error al exportar Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  return { exportToPDF, exportToExcel, exportingPDF, exportingExcel };
};
