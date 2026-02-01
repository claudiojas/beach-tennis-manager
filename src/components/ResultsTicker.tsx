import { MatchResult } from '@/types/beach-tennis';

interface ResultsTickerProps {
  results: MatchResult[];
}

export const ResultsTicker = ({ results }: ResultsTickerProps) => {
  if (results.length === 0) return null;

  const tickerContent = results.map((result, index) => (
    <span key={index} className="inline-flex items-center mx-8">
      <span className="font-bold text-primary">{result.courtName}:</span>
      <span className="ml-2">{result.teamANames}</span>
      <span className="mx-2 font-bold text-accent">{result.scoreA}-{result.scoreB}</span>
      <span>{result.teamBNames}</span>
    </span>
  ));

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-secondary/90 backdrop-blur-sm border-t border-border overflow-hidden">
      <div className="py-3">
        <div className="flex items-center">
          <span className="bg-primary text-primary-foreground px-4 py-1 text-sm font-bold uppercase shrink-0">
            Últimos Resultados
          </span>
          <div className="overflow-hidden flex-1">
            <div className="ticker-animation whitespace-nowrap">
              {tickerContent}
              {tickerContent} {/* Duplicate for seamless loop */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
