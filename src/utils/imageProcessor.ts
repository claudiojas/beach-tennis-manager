import imageCompression from 'browser-image-compression';
// import { removeBackground } from '@imgly/background-removal';

export const imageProcessor = {
    /**
     * @deprecated O cliente optou por não usar remoção de fundo via IA devido ao tempo de processamento.
     * Mantendo apenas como referência se necessário no futuro.
     */
    removeBackground: async (file: File): Promise<Blob> => {
        console.warn('removeBackground is deprecated and currently disabled.');
        return file; // Retorna o arquivo original
    },

    /**
     * Comprime imagem para garantir performance
     */
    compress: async (fileOrBlob: File | Blob): Promise<File> => {
        const options = {
            maxSizeMB: 0.1, // Reduzi para 100KB já que é um logo pequeno
            maxWidthOrHeight: 800,
            useWebWorker: true,
            fileType: 'image/webp' as string
        };

        try {
            console.log('⚡ Comprimindo imagem...');
            const compressedFile = await imageCompression(fileOrBlob instanceof File ? fileOrBlob : new File([fileOrBlob], 'image.webp', { type: 'image/webp' }), options);
            return compressedFile;
        } catch (error) {
            console.error('Erro ao comprimir imagem:', error);
            throw new Error('Falha na compressão da imagem.');
        }
    },

    /**
     * Detecta pixels não transparentes e corta as bordas vazias
     */
    trimImage: async (blob: Blob): Promise<Blob> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) {
                    resolve(blob);
                    return;
                }

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const pixels = ctx.getImageData(0, 0, img.width, img.height);
                const l = pixels.data.length;
                let bound = {
                    top: img.height,
                    left: img.width,
                    right: 0,
                    bottom: 0
                };

                const ALPHA_THRESHOLD = 15;

                for (let i = 0; i < l; i += 4) {
                    if (pixels.data[i + 3] >= ALPHA_THRESHOLD) {
                        const x = (i / 4) % img.width;
                        const y = Math.floor((i / 4) / img.width);

                        if (x < bound.left) bound.left = x;
                        if (x > bound.right) bound.right = x;
                        if (y < bound.top) bound.top = y;
                        if (y > bound.bottom) bound.bottom = y;
                    }
                }

                if (bound.top >= img.height || bound.left >= img.width || bound.right === 0) {
                    resolve(blob);
                    return;
                }

                const padding = 2;
                const startX = Math.max(0, bound.left - padding);
                const startY = Math.max(0, bound.top - padding);
                const endX = Math.min(img.width, bound.right + padding);
                const endY = Math.min(img.height, bound.bottom + padding);

                const trimHeight = endY - startY + 1;
                const trimWidth = endX - startX + 1;

                const trimmedCanvas = document.createElement('canvas');
                trimmedCanvas.width = trimWidth;
                trimmedCanvas.height = trimHeight;
                const trimmedCtx = trimmedCanvas.getContext('2d');

                trimmedCtx?.drawImage(
                    canvas,
                    startX, startY, trimWidth, trimHeight,
                    0, 0, trimWidth, trimHeight
                );

                trimmedCanvas.toBlob((trimmedBlob) => {
                    resolve(trimmedBlob || blob);
                }, 'image/png');
            };
            img.src = URL.createObjectURL(blob);
        });
    }
};
