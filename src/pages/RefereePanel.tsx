import { useState } from 'react';
import { Logo } from '@/components/Logo';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { CourtCard } from '@/components/CourtCard';
import { ScorePanel } from '@/components/ScorePanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Court } from '@/types/beach-tennis';
import { useCourtData } from '@/hooks/useCourtData';
import { LayoutGrid, Users, Settings } from 'lucide-react';

const RefereePanel = () => {
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [isConnected] = useState(true);
  const { courts, updateScore, togglePause, resetScore } = useCourtData();

  const handleCourtSelect = (court: Court) => {
    setSelectedCourt(court);
  };

  const handleBack = () => {
    setSelectedCourt(null);
  };

  // Find the updated court when it's selected
  const currentCourt = selectedCourt 
    ? courts.find(c => c.id === selectedCourt.id) || selectedCourt 
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="header-gradient px-4 py-4">
        <div className="flex items-center justify-between">
          <Logo size="sm" showSubtitle={false} />
          <ConnectionStatus isConnected={isConnected} />
        </div>
      </header>

      {/* Main Content */}
      {currentCourt ? (
        <ScorePanel
          court={currentCourt}
          onBack={handleBack}
          onScoreChange={updateScore}
          onTogglePause={togglePause}
          onResetScore={resetScore}
        />
      ) : (
        <Tabs defaultValue="quadras" className="flex-1 flex flex-col">
          <div className="border-b border-border bg-card">
            <TabsList className="w-full justify-start rounded-none border-0 bg-transparent h-auto p-0">
              <TabsTrigger
                value="quadras"
                className="touch-tab data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent data-[state=active]:shadow-none"
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Quadras
              </TabsTrigger>
              <TabsTrigger
                value="atletas"
                className="touch-tab data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent data-[state=active]:shadow-none"
              >
                <Users className="mr-2 h-4 w-4" />
                Atletas
              </TabsTrigger>
              <TabsTrigger
                value="config"
                className="touch-tab data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent data-[state=active]:shadow-none"
              >
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="quadras" className="flex-1 p-4 space-y-4 mt-0">
            <div className="space-y-3">
              {courts.map((court) => (
                <CourtCard
                  key={court.id}
                  court={court}
                  onClick={handleCourtSelect}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="atletas" className="flex-1 p-4 mt-0">
            <div className="glass-card rounded-xl p-6 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Lista de Atletas</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie os atletas cadastrados no torneio.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="config" className="flex-1 p-4 mt-0">
            <div className="glass-card rounded-xl p-6 text-center">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Configurações</h3>
              <p className="text-sm text-muted-foreground">
                Ajuste as configurações do torneio e quadras.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Footer - Only show when not in score panel */}
      {!currentCourt && (
        <footer className="bg-secondary py-3 text-center border-t border-border">
          <p className="text-xs text-muted-foreground">
            © 2026 Beach Tennis Manager. Developed for better sports.
          </p>
        </footer>
      )}
    </div>
  );
};

export default RefereePanel;
