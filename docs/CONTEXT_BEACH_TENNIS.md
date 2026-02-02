# 🎾 CONTEXT_BEACH_TENNIS.md

## 1. Visão Geral do Projeto
O **Beach Tennis Manager** é um ecossistema digital desenvolvido pela **Módulo Web** para transformar a gestão de torneios de Beach Tennis. 
Diferente de planilhas e apps isolados, ele funciona como uma "Mesa de Comando Digital" que conecta Organizador, Árbitros e Público em tempo real.

## 2. O Cliente e a Dor
*   **Problema:** Gestão descentralizada. O árbitro não comunica bem com a mesa, e o público não sabe o que está acontecendo ou que horas vai jogar.
*   **Solução:** Um sistema centralizado onde a "Verdade do Jogo" (placar, status) é única e compartilhada instantaneamente com todos.

## 3. Arquitetura e Fluxo de Dados (Triangular)
O sistema opera em uma arquitetura de "Triângulo de Dados", onde o Firebase atua como o cérebro central.

1.  **Admin (Mesa):** Cria o torneio, cadastra jogos e define quem joga onde.
2.  **Árbitro (Quadra):** Recebe o jogo e atualiza o placar ponto a ponto.
3.  **Público (TV/Celular):** Apenas lê o estado atual do banco.

---

## 4. Perfis de Acesso e Segurança

### 👑 Super Admin (Organizador)
*   **Acesso:** Login seguro (Email/Senha).
*   **Poderes:** Acesso total. Cria torneios, cadastra atletas, edita qualquer placar, gera chaves.
*   **Auditoria:** O sistema registra alterações feitas pelo Admin (`editedBy: 'ADMIN'`).

### 🦓 Árbitro (Operacional)
*   **Acesso:** Simplificado via **PIN da Quadra** (ex: 1234). UX focada em agilidade (não exige login/senha pessoal).
*   **Poderes:** Restrito a atualizar o placar *apenas* da quadra onde fez check-in.
*   **Auditoria:** Alterações registradas como `editedBy: 'QUADRA_X'`.

### 📺 Arena & Torcida (Passivo)
*   **Acesso:** Público (Link aberto).
*   **Interfaces:**
    *   `/arena`: Layout "Aeroporto" (Landscape, alto contraste) para TVs grandes no local.
    *   `/live`: **"App do Torcedor"** (Mobile). Mostra agenda de jogos (horários estimados) e resultados ao vivo para os atletas acompanharem do próprio celular. (Over-delivery/Oceano Azul).

---

## 5. Cronograma e Sprints (Status Atual)

### Sprint 1: Fundação e Backoffice (Concluída ✅)
*   **Fundação:** Setup (Firebase + Auth + Design System).
*   **Atletas:** Cadastro, Listagem e Gestão Completa.
*   **Torneios:** Criação e Dashboard.
*   **Quadras:** CRUD, PINs e Proteção contra exclusão indevida.
*   **Partidas:** Criação (Simples/Duplas), Agendamento (Quadra/Horário) e Listagem.

### Sprint 2: Central do Árbitro (Próxima ⏭️)
*   Login via PIN da Quadra.
*   Interface "Mesa de DJ" para controle de placar.
*   Lógica de Pontuação (15/30/40/Game).

### Sprint 3: Arena e Transmissão
*   Dashboard p/ TV (Grid de Quadras).
*   **App do Torcedor (/live):** Agenda e Resultados em tempo real.

### Sprint 4: Over-delivery e Polimento
*   Sistema de Chaveamento Simples.
*   Refinamentos de Responsividade.

---

## 6. Protocolos de Segurança (Camada de Blindagem)
Para proteger as rotas administrativas em um ambiente web público:

1.  **Rotas Protegidas (Guarda):** O Frontend bloqueia o acesso a `/admin` e `/arbitro` se não houver autenticação/PIN válido, redirecionando para login.
2.  **SEO Blocking:** Arquivo `robots.txt` configurado para impedir indexação Google das páginas restritas.
3.  **Database Rules:** Regras do Firebase validam a permissão de escrita no Backend, impedindo ataques diretos à API.


---

## 7. Stack Tecnológica
*   **Frontend:** React + Vite + TailwindCSS.
*   **Database:** Firebase Realtime Database.
*   **Hospedagem:** Vercel.
*   **Conceito:** PWA (Funciona como App nativo).