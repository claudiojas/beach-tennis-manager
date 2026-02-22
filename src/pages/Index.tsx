import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { Smartphone, Monitor, ShieldCheck } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="header-gradient px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <Logo size="lg" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Escolha seu Painel
          </h2>
          <p className="text-lg text-muted-foreground">
            Selecione a interface adequada para sua função no torneio.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Organizer Panel Card */}
          <Card className="glass-card group hover:shadow-xl transition-all duration-300 border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Painel do Organizador</CardTitle>
              <CardDescription>
                Gestão completa de atletas, arenas e torneios. Controle total do evento.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-muted-foreground mb-6 space-y-2">
                <li>✓ Cadastro global de atletas</li>
                <li>✓ Configuração de categorias</li>
                <li>✓ Gestão de Ranking e Inscritos</li>
              </ul>
              <Button asChild variant="default" className="w-full h-12 shadow-lg hover:shadow-primary/20">
                <Link to="/admin">Acessar Organizador</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Referee Panel Card */}
          <Card className="glass-card group hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                <Smartphone className="h-8 w-8 text-indigo-500" />
              </div>
              <CardTitle className="text-xl">Painel do Árbitro</CardTitle>
              <CardDescription>
                Interface mobile-first para árbitros controlarem as quadras e placares.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-muted-foreground mb-6 space-y-2">
                <li>✓ Controle de placar instantâneo</li>
                <li>✓ Login rápido via PIN de quadra</li>
                <li>✓ Súmula digital automática</li>
              </ul>
              <Button asChild variant="secondary" className="w-full h-12">
                <Link to="/arbitro">Acessar Arbitragem</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Arena Panel Card */}
          <Card className="glass-card group hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <Monitor className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-xl">Painel da Arena</CardTitle>
              <CardDescription>
                Dashboard de transmissão para Smart TVs com placares estilo aeroporto.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-muted-foreground mb-6 space-y-2">
                <li>✓ Visual de alto impacto para TVs</li>
                <li>✓ Próximas chamadas de jogos</li>
                <li>✓ Ticker de últimos resultados</li>
              </ul>
              <Button asChild variant="outline" className="w-full h-12 border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                <Link to="/arena">Acessar Transmissão</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-secondary/50 py-8 mt-12 border-t border-border/50">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 Beach Tennis Manager. Developed for better sports.
          </p>
        </div>
      </footer>
    </div>
  );
};


export default Index;
