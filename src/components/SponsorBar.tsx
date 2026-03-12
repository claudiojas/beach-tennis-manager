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

    const repeatedSponsors = useMemo(() => {
        if (sponsors.length === 0) return [];
        let list = [...sponsors];
        // Ensure at least 15 items to cover most screens without gaps
        while (list.length > 0 && list.length < 15) {
            list = [...list, ...sponsors];
        }
        return list;
    }, [sponsors]);

    const logoList = useMemo(() => {
        const SponsorLogo = ({ sponsor }: { sponsor: Sponsor }) => (
            <div className="inline-flex items-center justify-center w-[110px] h-8 mx-10 shrink-0">
                <img
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    loading="eager"
                    className="max-w-full max-h-full object-contain hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ backfaceVisibility: 'hidden' }}
                />
            </div>
        );

        return (
            <div className="ticker-animation whitespace-nowrap flex items-center will-change-transform">
                <div className="flex items-center">
                    {repeatedSponsors.map((sponsor, i) => (
                        <SponsorLogo key={`g1-${sponsor.id}-${i}`} sponsor={sponsor} />
                    ))}
                </div>
                <div className="flex items-center">
                    {repeatedSponsors.map((sponsor, i) => (
                        <SponsorLogo key={`g2-${sponsor.id}-${i}`} sponsor={sponsor} />
                    ))}
                </div>
            </div>
        );
    }, [repeatedSponsors]);

    if (sponsors.length === 0) return null;

    return (
        <div className="w-full bg-black/80 backdrop-blur-xl border-t border-white/10 py-2 overflow-hidden relative shadow-[0_-10px_40px_rgba(0,0,0,0.5)] shrink-0 z-50">
            <div className="flex items-center h-[50px]">
                {/* Visual Fading Gradients */}
                <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-black via-black/60 to-transparent z-10" />

                {logoList}
            </div>
        </div>
    );
};
