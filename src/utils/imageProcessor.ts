import imageCompression from 'browser-image-compression';
import { removeBackground } from '@imgly/background-removal';

export const imageProcessor = {
    /**
     * Remove fundo da imagem usando IA local
     */
    removeBackground: async (file: File): Promise<Blob> => {
        try {
            console.log('🤖 Removendo fundo da imagem...');
            const blob = await removeBackground(file, {
                progress: (side, progress) => {
                    console.log(`IA: ${side} - ${Math.round(progress * 100)}%`);
                }
            });
            return blob;
        } catch (error) {
            console.error('Erro ao remover fundo:', error);
            throw new Error('Falha ao processar remoção de fundo.');
        }
    },

    /**
     * Comprime imagem para garantir performance
     */
    compress: async (fileOrBlob: File | Blob): Promise<File> => {
        const options = {
            maxSizeMB: 0.2, // Máximo 200KB
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

                for (let i = 0; i < l; i += 4) {
                    if (pixels.data[i + 3] > 0) { // Se o pixel não é transparente
                        const x = (i / 4) % img.width;
                        const y = Math.floor((i / 4) / img.width);

                        if (x < bound.left) bound.left = x;
                        if (x > bound.right) bound.right = x;
                        if (y < bound.top) bound.top = y;
                        if (y > bound.bottom) bound.bottom = y;
                    }
                }

                // Se não encontrou pixel (imagem vazia), retorna original
                if (bound.top >= bound.bottom || bound.left >= bound.right) {
                    resolve(blob);
                    return;
                }

                const trimHeight = bound.bottom - bound.top + 1;
                const trimWidth = bound.right - bound.left + 1;

                // Cria novo canvas com tamanho exato do logo
                const trimmedCanvas = document.createElement('canvas');
                trimmedCanvas.width = trimWidth;
                trimmedCanvas.height = trimHeight;
                const trimmedCtx = trimmedCanvas.getContext('2d');

                trimmedCtx?.drawImage(
                    canvas,
                    bound.left, bound.top, trimWidth, trimHeight,
                    0, 0, trimWidth, trimHeight
                );

                trimmedCanvas.toBlob((trimmedBlob) => {
                    resolve(trimmedBlob || blob);
                }, 'image/png');
            };
            img.src = URL.createObjectURL(blob);
        });
    },

    /**
     * Processamento completo: Remove fundo -> Corta Bordas -> Comprime
     */
    processSponsorLogo: async (file: File): Promise<File> => {
        // 1. Remove fundo
        const noBgBlob = await imageProcessor.removeBackground(file);

        // 2. Auto-Trim: Corta os espaços vazios ao redor do logo
        console.log('✂️ Cortando bordas vazias...');
        const trimmedBlob = await imageProcessor.trimImage(noBgBlob);

        // 3. Comprime e converte para WebP
        const finalFile = await imageProcessor.compress(trimmedBlob);

        return finalFile;
    }
};
