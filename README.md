# 🎾 Beach Tennis Manager

> **Ecossistema digital de alta performance para gestão de torneios de Beach Tennis.**
> *Desenvolvido pela Módulo Web.*

O **Beach Tennis Manager** transforma a experiência de torneios, oferecendo controle total para árbitros e transparência em tempo real para o público e atletas.

---

## 🚀 Visão Geral

O projeto resolve a desconexão entre o que acontece na quadra e o que é exibido para a torcida. Substituímos fichas de papel e placares manuais por um ecossistema integrado:

1.  **Central do Árbitro (Mobile):** PWA focado em UX para atualização de placar com "zero atrito".
2.  **Painel da Arena (TV):** Interface de alto contraste ("Modo Aeroporto") que exibe jogos, chamadas e resultados em tempo real.
3.  **Backoffice do Organizador:** Gestão de inscritos, categorias e chaves.

## 🛠️ Stack Tecnológica

Construído sobre a **Modulo Platform** com foco em escalabilidade e "Zero Manutenção".

-   **Core:** React + Vite (SPA ultra-rápida).
-   **Estilização:** Tailwind CSS + Shadcn/ui (Design System personalizado).
-   **Database:** Firebase Realtime Database (Sync imediato Árbitro ↔ TV).
-   **Infra:** Vercel + PWA.

## 📦 Estrutura do Projeto

O desenvolvimento é dividido em 4 Sprints estratégicas (Total: 10 dias):

| Sprint | Foco | Entregáveis Principais |
| :--- | :--- | :--- |
| **01** | **Fundação** | Setup, Design System, Cadastro de Atletas. |
| **02** | **Árbitro** | Painel Mobile de Arbitragem, Lógica de Score. |
| **03** | **Arena** | Dashboard TV, Sync Realtime, "Modo Aeroporto". |
| **04** | **Polimento** | Responsividade fina, Chaveamento Simples (Over-delivery). |

## 💻 Instalação e Desenvolvimento

Ambiente Local:

```bash
# 1. Clone o repositório
git clone https://github.com/claudiojas/hubPageDemonstration.git beach-tennis-manager
cd beach-tennis-manager

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente (Crie .env.local)
# Solicite as chaves do Firebase ao Tech Lead (Cláudio)

# 4. Inicie o servidor dev
npm run dev
```

## 🎨 Design System

As cores e tipografia seguem a identidade visual aprovada:

-   **Primary:** `#0088cc` (Azul Vibrante)
-   **Background:** Clean/White para Backoffice, Dark para Arena.
-   **Fontes:** *Inter* (UI) e *Bebas Neue* (Placares/Destaques).

---

© 2026 **Módulo Web**. *Transformando ideias em produtos digitais.*
