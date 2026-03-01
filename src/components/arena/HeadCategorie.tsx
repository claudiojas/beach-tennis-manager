interface currentTime {
    currentTime: Date;
    category: string;
}


export function HeadCategorie({ currentTime, category }: currentTime) {
    return (
        <>
            {/* Header de Categoria */}
            <div className={`
                flex items-end gap-16 md:justify-between 
                border-l-8 border-primary pl-6 py-1 md:py-4 z-10 
                bg-black w-[1440px] h-[80px] pr-8

                absolute -top-10 md:-top-8 -left-8 -right-6
                `}>
                <div>
                    <p className="text-primary font-black uppercase tracking-[0.4em] text-xs mb-1">Operações Arena</p>
                    <h2 className="text-xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                        Categoria {category}
                    </h2>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xl md:text-3xl font-black font-mono text-white/20">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            </div>
        </>
    );
}