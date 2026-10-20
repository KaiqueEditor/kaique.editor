import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Hook para exportar o carrossel como PDF compilado.
 * Recebe um array de PNGs (data URLs) e compila num PDF com as dimensões do formato selecionado.
 */
export function useExportPDF() {
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    const exportPDF = useCallback(async (
        slideImages: string[], // Array de data URLs (PNG)
        projectName: string = 'Carrossel',
        formatWidth: number = 1080,
        formatHeight: number = 1440,
    ) => {
        if (slideImages.length === 0) {
            toast.error('Nenhum slide para exportar');
            return;
        }

        setIsExportingPDF(true);

        try {
            const W = formatWidth;
            const H = formatHeight;
            const orientation = H >= W ? 'portrait' : 'landscape';
            // jsPDF é pesado: só carrega quando alguém exporta em PDF
            const { jsPDF } = await import('jspdf');
            const pdf = new jsPDF({
                orientation,
                unit: 'px',
                format: [W, H],
                hotfixes: ['px_scaling'],
            });

            for (let i = 0; i < slideImages.length; i++) {
                if (i > 0) pdf.addPage([W, H], orientation);
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
