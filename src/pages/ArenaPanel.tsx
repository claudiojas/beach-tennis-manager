import { ArenaHeader } from '@/components/ArenaHeader';
import { ArenaCourtCard } from '@/components/ArenaCourtCard';
import { ResultsTicker } from '@/components/ResultsTicker';
import { useCourtData } from '@/hooks/useCourtData';

const ArenaPanel = () => {
  const { courts, results } = useCourtData();
  const tournamentName = 'Torneio Open Verão 2026';

  // Find the court with active game to highlight
  const activeCourts = courts.filter(c => c.status === 'em_jogo');
  const highlightedCourtId = activeCourts.length > 0 ? activeCourts[0].id : null;

  return (
    <div className="arena-theme arena-fullscreen flex flex-col bg-background">
      {/* Header */}
      <ArenaHeader tournamentName={tournamentName} />

      {/* Courts Grid */}
      <main className="flex-1 p-6 pb-20 overflow-hidden">
        <div className="court-grid h-full">
          {courts.map((court) => (
            <ArenaCourtCard
              key={court.id}
              court={court}
              isHighlighted={court.id === highlightedCourtId}
            />
          ))}
        </div>
      </main>

      {/* Results Ticker */}
      <ResultsTicker results={results} />
    </div>
  );
};

export default ArenaPanel;
