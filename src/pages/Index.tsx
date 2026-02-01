import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { Smartphone, Monitor } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="header-gradient px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <Logo size="lg" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Escolha seu Painel
          </h2>
          <p className="text-lg text-muted-foreground">
            Selecione a interface adequada para sua função no torneio.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Referee Panel Card */}
          <Card className="glass-card group hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Painel do Árbitro</CardTitle>
              <CardDescription>
                Interface mobile-first para árbitros controlarem as quadras e placares em tempo real.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-muted-foreground mb-6 space-y-2">
                <li>✓ Controle de placar com botões grandes</li>
                <li>✓ Otimizado para uso com uma mão</li>
                <li>✓ Status de quadras em tempo real</li>
              </ul>
              <Button asChild className="w-full h-12">
                <Link to="/arbitro">Acessar Painel do Árbitro</Link>
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
                Dashboard de transmissão para Smart TVs com placares em tempo real estilo aeroporto.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-muted-foreground mb-6 space-y-2">
                <li>✓ Visual de alto impacto para TVs</li>
                <li>✓ Placar gigante visível a 5+ metros</li>
                <li>✓ Ticker de últimos resultados</li>
              </ul>
              <Button asChild variant="outline" className="w-full h-12 border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                <Link to="/arena">Acessar Painel da Arena</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-secondary py-6 mt-12 border-t border-border">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            © 2026 Beach Tennis Manager. Developed for better sports.
          </p>
          <Button variant="link" size="sm" asChild className="text-muted-foreground/50 hover:text-primary">
            <Link to="/admin">Acesso Organizador</Link>
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Index;
