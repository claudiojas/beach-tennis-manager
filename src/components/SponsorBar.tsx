import React, { useState, useEffect, useMemo } from 'react';
import { sponsorService } from '@/services/sponsorService';
import { Sponsor } from '@/types/beach-tennis';

export const SponsorBar = () => {
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);

    useEffect(() => {
        const unsubscribe = sponsorService.subscribeAll((data) => {
            setSponsors(data || []);
        });
        return () => unsubscribe();
    }, []);

    const logoList = useMemo(() => {
        const SponsorLogo = ({ sponsor, idPrefix }: { sponsor: Sponsor, idPrefix: string }) => (
            <div className="inline-flex items-center justify-center w-[140px] h-11 mx-8 shrink-0">
                <img
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    loading="eager"
                    className="max-w-full max-h-full object-contain brightness-0 invert opacity-70 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ backfaceVisibility: 'hidden' }}
                />
            </div>
        );

        return (
            <div className="ticker-animation whitespace-nowrap flex items-center will-change-transform">
                <div className="flex items-center">
                    {sponsors.map((sponsor) => <SponsorLogo key={`${sponsor.id}-1`} idPrefix="g1" sponsor={sponsor} />)}
                </div>
                <div className="flex items-center">
                    {sponsors.map((sponsor) => <SponsorLogo key={`${sponsor.id}-2`} idPrefix="g2" sponsor={sponsor} />)}
                </div>
            </div>
        );
    }, [sponsors]);

    if (sponsors.length === 0) return null;

    return (
        <div className="w-full bg-slate-900/60 backdrop-blur-md border-t border-white/5 py-1 overflow-hidden relative shadow-2xl shrink-0 z-50">
            <div className="flex items-center h-[50px]">
                {/* Visual Fading Gradients */}
                <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-slate-900 via-slate-900/60 to-transparent z-10" />

                {logoList}
            </div>
        </div>
    );
};
