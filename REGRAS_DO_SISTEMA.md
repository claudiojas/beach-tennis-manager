# 🎾 Guia do Sistema de Competição - Beach Tennis Manager

Este documento detalha as regras técnicas de organização de torneios implementadas no sistema **Beach Tennis Manager**, seguindo os padrões oficiais das federações de Beach Tennis (CBT/FPT). O objetivo é garantir total transparência para organizadores e atletas.

---

## 1. Fase de Grupos (Round Robin)

O sistema organiza as duplas em grupos de forma inteligente para garantir o equilíbrio e a rotatividade das quadras.

### Regras de Organização:
*   **Tamanho dos Grupos**: O sistema prioriza grupos de **3 ou 4 duplas**.
*   **Equilíbrio de Jogos**: Nenhum grupo terá uma diferença maior que 1 dupla em relação aos outros. (Ex: Para 10 duplas, o sistema criará um grupo de 4 e dois grupos de 3).
*   **Critérios de Classificação**:
    1.  **Número de Vitórias** (Maior pontuação).
    2.  **Saldo de Games** (Games Ganhos - Games Perdidos).
    3.  **Games Pró** (Total de games marcados).

## 2. Fase Mata-Mata (Chaveamento Inteligente)

O Beach Tennis Manager utiliza um algoritmo de **Chaveamento Dinâmico**, o que permite que o torneio siga para a fase final mesmo com números "quebrados" de duplas classificadas.

### Seeding e Cruzamentos (Mérito Esportivo):
O sistema segue o princípio de que os melhores classificados devem ser protegidos e recompensados por suas campanhas:
*   **Cruzamento 1º vs 2º**: Sempre que possível, o sistema emparelha um campeão de grupo contra o segundo colocado de outro (ex: 1º do Grupo A vs 2º do Grupo B). Isolar duplas do mesmo grupo na fase inicial do mata-mata é prioritário.
*   **Ranking Técnico Geral**: Em casos de múltiplos grupos (ex: 5 grupos), o sistema ranqueia todos os 1º colocados entre si e todos os 2º colocados separadamente usando:
    1.  **Percentual de Vitórias** (Ajuste para grupos de tamanhos diferentes).
    2.  **Saldo de Sets**.
    3.  **Saldo de Games**.
*   **Distribuição Equilibrada**: O melhor 1º colocado enfrenta o pior 2º colocado qualificado, mantendo o equilíbrio técnico da chave.
*   **Passagem Direta (Bye)**: Se o número de duplas não completar uma chave perfeita (ex: 10 duplas para 8 vagas), os melhores ranqueados recebem **"Bye"** (passagem direta para a próxima rodada) seguindo a ordem do ranking.

---

## 3. Conferência e Transparência (Mata-Mata)

*   **Modal de Classificação**: Antes de gerar o mata-mata, o organizador tem acesso ao botão **"Classificação"** na aba de Chaves. Este modal exibe a performance exata de cada dupla com destaque em verde para os classificados, garantindo que o chaveamento seja auditável e justo.
*   **Destaque em Tempo Real**: Os resultados são processados instantaneamente, permitindo que a geração das chaves ocorra assim que o último jogo de um grupo é finalizado no Admin.

---

## 4. Gestão de Placar e Arena

Para garantir a agilidade e simplicidade na operação do torneio:

*   **Lógica de Quadra Única**: O sistema impede que uma quadra receba dois jogos ao mesmo tempo, emitindo alertas visuais no Admin.
*   **Início Automatizado**: Ao vincular uma quadra a um jogo no Admin, o jogo entra automaticamente em status **"Em Andamento"**.
*   **Finalização Inteligente**: Ao inserir o placar final (baseado nas regras da CBT), o sistema finaliza a partida e libera a quadra automaticamente para o próximo jogo.
*   **Celebração na Arena**: O **Painel da Arena (TV/Telão)** exibe automaticamente os campeões de cada categoria com animações celebrativas assim que a final é registrada no sistema.

---
*Gerado automaticamente pelo ecossistema Beach Tennis Manager - Tecnologia a serviço do esporte.*
