import React, { useState, useEffect } from 'react';
import { sponsorService } from '@/services/sponsorService';
import { Sponsor } from '@/types/beach-tennis';

const MOCK_SPONSORS: Sponsor[] = [
    { id: '1', name: 'Wilson', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Wilson_logo.svg', createdAt: 0 },
    { id: '2', name: 'Adidas', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg', createdAt: 0 },
    { id: '3', name: 'Babolat', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Babolat_Logo.svg', createdAt: 0 },
    { id: '4', name: 'Nike', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg', createdAt: 0 },
    { id: '5', name: 'Red Bull', logoUrl: 'https://upload.wikimedia.org/wikipedia/pt/b/b3/Red_bull_logo.png', createdAt: 0 },
];

export const SponsorBar = () => {
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);

    useEffect(() => {
        const unsubscribe = sponsorService.subscribeAll((data) => {
            if (data && data.length > 0) {
                setSponsors(data);
            } else {
                setSponsors(MOCK_SPONSORS);
            }
        });
        return () => unsubscribe();
    }, []);

    // Componente interno para garantir tamanho único e centralização de cada logo
    const SponsorLogo = ({ sponsor }: { sponsor: Sponsor }) => (
        <div className="inline-flex items-center justify-center w-[160px] h-12 mx-10">
            <img
                src={sponsor.logoUrl}
                alt={sponsor.name}
                className="w-full h-full object-contain brightness-0 invert grayscale opacity-70 hover:opacity-100 transition-all duration-300"
            />
        </div>
    );

    return (
        <div className="w-full bg-slate-900/60 backdrop-blur-md border-b border-white/5 py-2 overflow-hidden relative shadow-2xl">
            <div className="flex items-center">
                {/* Visual Fading Gradients */}
                <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-slate-900 via-slate-900/60 to-transparent z-10" />

                <div className="ticker-animation whitespace-nowrap flex items-center h-12">
                    {/* Groups of logos to create infinite effect */}
                    <div className="flex items-center">
                        {sponsors.map((sponsor) => <SponsorLogo key={`g1-${sponsor.id}`} sponsor={sponsor} />)}

                        {/* Garantir que o ticker tenha itens suficientes duplicando até ter uma largura considerável */}
                        {sponsors.length > 0 && (
                            <>
                                {sponsors.map((sponsor) => <SponsorLogo key={`g2-${sponsor.id}`} sponsor={sponsor} />)}
                                {sponsors.map((sponsor) => <SponsorLogo key={`g3-${sponsor.id}`} sponsor={sponsor} />)}
                                {sponsors.map((sponsor) => <SponsorLogo key={`g4-${sponsor.id}`} sponsor={sponsor} />)}
                                {sponsors.map((sponsor) => <SponsorLogo key={`g5-${sponsor.id}`} sponsor={sponsor} />)}
                                {sponsors.map((sponsor) => <SponsorLogo key={`g6-${sponsor.id}`} sponsor={sponsor} />)}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
