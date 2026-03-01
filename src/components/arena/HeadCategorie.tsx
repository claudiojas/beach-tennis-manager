interface HeadCategorieProps {
    currentTime: Date;
    category: string;
    tournamentName: string;
}

export function HeadCategorie({ currentTime, category, tournamentName }: HeadCategorieProps) {
    return (
        <>
            {/* Header de Categoria */}
            <div className={`
                flex items-center justify-between 
                border-l-8 border-primary pl-6 py-2 md:py-4 z-10 
                bg-black w-[1440px] h-[80px] pr-8
                absolute -top-10 md:-top-8 -left-8 -right-6
            `}>

                {/* 1. Esquerda - Nome do Torneio */}
                <div className="flex flex-col items-start min-w-[200px] max-w-[400px]">
                    <p className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-0.5">Operações Arena</p>
                    <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter leading-none truncate w-full">
                        {tournamentName}
                    </h2>
                </div>

                {/* 2. Centro - Etiqueta da Categoria */}
                <div className="flex-1 flex items-center justify-center px-4">
                    <div className="inline-flex items-center gap-1.5 bg-primary/20 border border-primary/30 px-4 py-1 md:py-1.5 rounded-full backdrop-blur-sm">
                        <p className="text-primary font-black uppercase tracking-[0.2em] text-[9px] md:text-xs">
                            Categoria <span className="text-white ml-1 text-[10px] md:text-sm">{category}</span>
                        </p>
                    </div>
                </div>

                {/* 3. Direita - Relógio */}
                <div className="flex flex-col items-end min-w-[150px]">
                    <span className="text-xl md:text-3xl font-black font-mono text-white/20">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>

            </div>
        </>
    );
}