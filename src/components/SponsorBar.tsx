import React from 'react';

interface Sponsor {
    id: string;
    name: string;
    logoUrl: string;
}

const MOCK_SPONSORS: Sponsor[] = [
    { id: '1', name: 'Wilson', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Wilson_logo.svg' },
    { id: '2', name: 'Adidas', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg' },
    { id: '3', name: 'Babolat', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Babolat_Logo.svg' },
    { id: '4', name: 'Nike', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' },
    { id: '5', name: 'Red Bull', logoUrl: 'https://upload.wikimedia.org/wikipedia/pt/b/b3/Red_bull_logo.png' },
];

export const SponsorBar = () => {
    // Componente interno para garantir tamanho único e centralização de cada logo
    const SponsorLogo = ({ sponsor }: { sponsor: Sponsor }) => (
        <div className="inline-flex items-center justify-center w-[120px] h-8 mx-8">
            <img
                src={sponsor.logoUrl}
                alt={sponsor.name}
                className="max-h-full max-w-full object-contain brightness-0 invert grayscale opacity-40 hover:opacity-100 transition-all duration-300"
            />
        </div>
    );

    return (
        <div className="w-full bg-slate-900/60 backdrop-blur-md border-b border-white/5 py-4 overflow-hidden relative shadow-2xl">
            <div className="flex items-center">
                {/* Visual Fading Gradients */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-900 via-slate-900/40 to-transparent z-10" />

                <div className="ticker-animation whitespace-nowrap flex items-center h-8">
                    {/* Groups of logos to create infinite effect */}
                    <div className="flex items-center">
                        {MOCK_SPONSORS.map((sponsor) => <SponsorLogo key={`g1-${sponsor.id}`} sponsor={sponsor} />)}
                        {MOCK_SPONSORS.map((sponsor) => <SponsorLogo key={`g2-${sponsor.id}`} sponsor={sponsor} />)}
                        {MOCK_SPONSORS.map((sponsor) => <SponsorLogo key={`g3-${sponsor.id}`} sponsor={sponsor} />)}
                        {MOCK_SPONSORS.map((sponsor) => <SponsorLogo key={`g4-${sponsor.id}`} sponsor={sponsor} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};
