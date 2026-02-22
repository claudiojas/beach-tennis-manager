import { MatchResult } from '@/types/beach-tennis';

interface ResultsTickerProps {
  results: MatchResult[];
}

export const ResultsTicker = ({ results }: ResultsTickerProps) => {
  if (results.length === 0) return null;

  const tickerContent = results.map((result, index) => (
    <span key={index} className="inline-flex items-center mx-24">
      <div className="flex items-center gap-6">
        <span className="font-black text-primary text-xs tracking-[0.4em] uppercase opacity-40 italic border-r-2 border-white/10 pr-6">{result.courtName}</span>
        <div className="flex items-center gap-6">
          <span className="text-white font-black text-xl tracking-tighter uppercase">{result.teamANames}</span>
          <div className="flex items-center bg-black/60 px-5 py-2 rounded-2xl border-2 border-[#CEFD03]/40 shadow-[0_0_25px_rgba(206,253,3,0.3)]">
            <span className="font-black text-[#CEFD03] text-4xl tabular-nums tracking-tighter">{result.scoreA}</span>
            <span className="mx-3 text-white/20 font-light text-2xl">:</span>
            <span className="font-black text-[#CEFD03] text-4xl tabular-nums tracking-tighter">{result.scoreB}</span>
          </div>
          <span className="text-white font-black text-xl tracking-tighter uppercase">{result.teamBNames}</span>
        </div>
      </div>
    </span>
  ));

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[#020617] border-t-4 border-[#CEFD03]/30 overflow-hidden z-50 shadow-[0_-20px_60px_rgba(0,0,0,0.8)]">
      <div className="py-6">
        <div className="flex items-center">
          <div className="bg-[#CEFD03] text-black px-8 py-3 text-lg font-black uppercase shrink-0 tracking-[0.25em] italic ml-8 rounded-xl shadow-[0_0_30px_rgba(206,253,3,0.5)]">
            Resultados
          </div>
          <div className="overflow-hidden flex-1">
            <div className="ticker-animation whitespace-nowrap flex items-center h-full">
              <div className="flex text-white font-black text-2xl uppercase tracking-[0.1em] antialiased">
                {tickerContent}
                {tickerContent}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
