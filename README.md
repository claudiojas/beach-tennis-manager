# 🎾 Beach Tennis Manager: A Revolução na Gestão de Torneios

O **Beach Tennis Manager** é um ecossistema digital de alta performance projetado para transformar a experiência de torneios de Beach Tennis. Mais do que um simples marcador de pontos, é uma plataforma de sincronização em tempo real que conecta organizadores, árbitros e atletas através de uma interface premium e intuitiva.

---

## � A Ideia & Visão de Produto

O projeto nasceu de uma necessidade latente no mercado de eventos esportivos: **a eliminação do papel e do delay.** 

Tradicionalmente, torneios sofrem com a demora na atualização de resultados e a confusão na gestão de quadras. Nossa visão foi criar um "sistema nervoso central" para o evento, onde:
1.  **O Árbitro é a autoridade digital:** Munido apenas de um celular, ele atualiza o mundo sobre o que acontece na quadra em milissegundos.
2.  **A Arena é viva:** As TVs do evento não são mais estáticas; elas narram visualmente o drama dos jogos ao vivo.
3.  **O Público está conectado:** Através de QR Codes, cada espectador tem um placar de bolso, sentindo a energia do torneio em tempo real.

O foco é a **Experiência do Usuário (UX)**, utilizando gatilhos mentais de performance e uma estética inspirada em marcas de luxo digital (Stripe, Linear, KarCash).

---

## 🛠️ Tecnologias Aplicadas

O sistema foi construído com o que há de mais moderno no ecossistema JavaScript para garantir escalabilidade e latência zero:

-   **Frontend:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) (Velocidade e reatividade)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/) (Design consistente e responsivo)
-   **Backend & Real-time:** [Firebase Realtime Database](https://firebase.google.com/docs/database) (WebSockets para sincronização instantânea)
-   **Icons & Visual:** [Lucide React](https://lucide.dev/)
-   **Lógica de Sincronização:** Técnica proprietária de *Multi-Path Data Sync* para espelhamento de dados entre partidas e quadras.

---

## 🚀 Principais Módulos

### 1. Painel Administrativo (O Cérebro)
Gestão global de categorias, atletas, arenas e quadras. Inclui **Chaveamento Inteligente** com seeding oficial, garantindo cruzamentos justos (1º vs 2º) e um **Modal de Classificação** auditável para conferência de resultados.

### 2. Painel de Controle (Operação)
Interface otimizada para o Admin, com atribuição rápida de quadras e finalização automática de jogos seguindo as regras da CBT.

### 3. Arena Panel (A Emoção)
Modo carrossel dinâmico para TVs e telões. Exibe placares "Ao Vivo", próximos jogos e, ao finalizar uma categoria, revela o **"Grande Campeão"** com visuais premium, troféus e animações de celebração.

### 4. Public View (O Engajamento)
Visão simplificada e elegante para atletas e torcedores (Mobile-App style), acessível via QR Code, com abas dedicadas para resultados e chaves em tempo real. **Inclui novos filtros inteligentes por categoria (Dropdown) para navegação fluida em eventos de grande porte.**

---

## 🛡️ Segurança e Robustez

-   **Integridade de Dados:** Sincronização em tempo real via Firebase, garantindo que o placar na TV nunca esteja atrasado em relação à mesa de controle.
-   **Gestão de Contingência:** O Admin possui autoridade total para editar placares, liberar quadras e ajustar chaves remotamente.
-   **Resiliência:** Persistência de dados local integrada para suportar instabilidades momentâneas de rede.

---

## 💻 Como Iniciar

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure as variáveis do [Firebase](https://console.firebase.google.com/)
4. Rode em desenvolvimento: `npm run dev`

---

<p align="center">
  <img src="https://github.com/user-attachments/assets/d3d40543-ceab-4edf-8517-89bbb7fd6441" width="150"/>
  <img src="https://github.com/user-attachments/assets/f39e5537-68f3-4658-be70-d608d4756108" width="150"/>
  <img src="https://github.com/user-attachments/assets/f1f5d268-31f9-488b-972c-2fd737974870" width="150"/>
  <img src="https://github.com/user-attachments/assets/2b5ad079-40d8-4a66-a4a6-1d9a52999b3a" width="150"/>
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/9bbfb3d6-350b-42c7-8a77-b0e53a264bd8" width="150"/>
  <img src="https://github.com/user-attachments/assets/21e11249-f4c2-45cc-ab80-f5c5f322a748" width="150"/>
  <img src="https://github.com/user-attachments/assets/d9abcae3-1af9-415d-be56-fcc9a222488f" width="150"/>
  <img src="https://github.com/user-attachments/assets/a574d52c-ab8d-4a86-8df5-17684427d60f" width="150"/>
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/b69d6f80-b51e-4f3b-a0ab-d717423f91a4" width="150"/>
  <img src="https://github.com/user-attachments/assets/1a449ce0-11d4-476a-94d5-27d951770a97" width="150"/>
</p>

---

© 2026 **Módulo Web Technology**. Fundado por Cláudio Soares.
*Transformando ideias em produtos digitais de alta performance.*
https://www.moduloweb.com.br/
