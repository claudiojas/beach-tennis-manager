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
     * Adicionado threshold de alpha para ignorar "sujeira" deixada pela remoção de fundo
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

                // Threshold de alpha: Ignora pixels com opacidade menor que 15 (aprox 6%)
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

                console.log(`📏 Dimensões originais: ${img.width}x${img.height}`);
                console.log(`📍 Bounds detectados:`, bound);

                // Se não encontrou pixel (imagem vazia), retorna original
                if (bound.top >= img.height || bound.left >= img.width || bound.right === 0) {
                    console.log('⚠️ Nenhum conteúdo detectado para cortar.');
                    resolve(blob);
                    return;
                }

                // Adiciona um pequeno padding de 2px para não encostar na borda (opcional)
                const padding = 2;
                const startX = Math.max(0, bound.left - padding);
                const startY = Math.max(0, bound.top - padding);
                const endX = Math.min(img.width, bound.right + padding);
                const endY = Math.min(img.height, bound.bottom + padding);

                const trimHeight = endY - startY + 1;
                const trimWidth = endX - startX + 1;

                console.log(`✂️ Dimensões finais: ${trimWidth}x${trimHeight}`);

                // Cria novo canvas com tamanho exato do logo
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
