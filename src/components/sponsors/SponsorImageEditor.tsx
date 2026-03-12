import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, Maximize, RectangleHorizontal } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";

interface SponsorImageEditorProps {
    image: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (croppedImage: Blob) => void;
}

export function SponsorImageEditor({ image, open, onOpenChange, onSave }: SponsorImageEditorProps) {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [isAspectLocked, setIsAspectLocked] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    const ARENA_ASPECT = 110 / 32;

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;

        // Inicializa com um crop centralizado
        const initialCrop = isAspectLocked
            ? centerCrop(makeAspectCrop({ unit: '%', width: 90 }, ARENA_ASPECT, width, height), width, height)
            : { unit: '%' as const, x: 5, y: 5, width: 90, height: 90 };

        setCrop(initialCrop);
    }

    const handleAspectToggle = (pressed: boolean) => {
        setIsAspectLocked(pressed);
        if (imgRef.current) {
            const { width, height } = imgRef.current;
            if (pressed) {
                const newCrop = centerCrop(makeAspectCrop({ unit: '%', width: 90 }, ARENA_ASPECT, width, height), width, height);
                setCrop(newCrop);
            }
        }
    };

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: PixelCrop,
    ): Promise<Blob> => {
        const image = imgRef.current;
        if (!image) throw new Error('Imagem não carregada');

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Erro ao criar context 2D');

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        canvas.width = Math.floor(pixelCrop.width * scaleX);
        canvas.height = Math.floor(pixelCrop.height * scaleY);

        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            image,
            pixelCrop.x * scaleX,
            pixelCrop.y * scaleY,
            pixelCrop.width * scaleX,
            pixelCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Falha ao gerar blob'));
            }, 'image/png');
        });
    };

    const handleSave = async () => {
        try {
            if (completedCrop) {
                const croppedBlob = await getCroppedImg(image, completedCrop);
                onSave(croppedBlob);
                onOpenChange(false);
            }
        } catch (e) {
            console.error('Erro ao recortar imagem:', e);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col rounded-3xl overflow-hidden p-0 border-none bg-slate-900">
                <DialogHeader className="p-6 flex flex-row items-center justify-between space-y-0">
                    <DialogTitle className="text-xl font-black italic text-white uppercase tracking-tighter">
                        Recortar Imagem
                    </DialogTitle>

                    <div className="flex items-center gap-2 bg-slate-950/50 p-1 rounded-full border border-white/5">
                        <Toggle
                            pressed={!isAspectLocked}
                            onPressedChange={(p) => handleAspectToggle(!p)}
                            className="rounded-full px-4 data-[state=on]:bg-white/10 text-xs font-bold uppercase transition-all"
                            size="sm"
                        >
                            <Maximize className="mr-2 h-3 w-3" />
                            Livre
                        </Toggle>
                        <Toggle
                            pressed={isAspectLocked}
                            onPressedChange={handleAspectToggle}
                            className="rounded-full px-4 data-[state=on]:bg-primary/20 data-[state=on]:text-primary text-xs font-bold uppercase transition-all"
                            size="sm"
                        >
                            <RectangleHorizontal className="mr-2 h-3 w-3" />
                            Arena
                        </Toggle>
                    </div>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-auto p-6 pt-0 flex items-center justify-center bg-slate-950/30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                    <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={isAspectLocked ? ARENA_ASPECT : undefined}
                        className="max-w-full"
                    >
                        <img
                            ref={imgRef}
                            src={image}
                            onLoad={onImageLoad}
                            alt="Crop preview"
                            className="max-h-[60vh] object-contain"
                        />
                    </ReactCrop>
                </div>

                <div className="p-6 bg-slate-900 border-t border-white/5">
                    <DialogFooter className="flex sm:justify-between items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-full text-muted-foreground hover:text-white hover:bg-white/10"
                        >
                            <X className="mr-2 h-4 w-4" />
                            Descartar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!completedCrop}
                            className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Finalizar Recorte
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
