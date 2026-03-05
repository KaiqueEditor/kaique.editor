import { useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';

/**
 * Hook para exportar o carrossel como PDF compilado.
 * Recebe um array de PNGs (data URLs) e compila num PDF 1080×1440.
 */
export function useExportPDF() {
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    const exportPDF = useCallback(async (
        slideImages: string[], // Array de data URLs (PNG)
        projectName: string = 'Carrossel',
    ) => {
        if (slideImages.length === 0) {
            toast.error('Nenhum slide para exportar');
            return;
        }

        setIsExportingPDF(true);

        try {
            // 1080×1440 em mm (ppi=72: 1080px ~381mm, 1440px ~508mm)
            // Usamos unidade "px" direto
            const W = 1080;
            const H = 1440;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [W, H],
                hotfixes: ['px_scaling'],
            });

            for (let i = 0; i < slideImages.length; i++) {
                if (i > 0) pdf.addPage([W, H], 'portrait');
                pdf.addImage(slideImages[i], 'PNG', 0, 0, W, H, undefined, 'FAST');
            }

            pdf.save(`${projectName}.pdf`);
            toast.success('PDF exportado com sucesso!');
        } catch (err) {
            console.error('Erro ao exportar PDF:', err);
            toast.error('Erro ao gerar PDF');
        } finally {
            setIsExportingPDF(false);
        }
    }, []);

    return { exportPDF, isExportingPDF };
}
