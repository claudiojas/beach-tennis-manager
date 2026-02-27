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

---

## 2. Fase Mata-Mata (Chaveamento Inteligente)

O Beach Tennis Manager utiliza um algoritmo de **Chaveamento Dinâmico**, o que permite que o torneio siga para a fase final mesmo com números "quebrados" de duplas classificadas.

### Sistema de "Cabeças de Chave" e "Byes":
Sempre que o número de duplas classificadas não for uma potência de 2 (2, 4, 8, 16...), o sistema aplica a regra de **Bye** (Descanso):
*   **Ranking Técnico Geral**: O sistema analisa o desempenho de todos os classificados de todos os grupos juntas.
*   **Mérito Esportivo**: As duplas com melhor campanha técnica (mais vitórias e melhor saldo de games) são designadas como **Cabeças de Chave**.
*   **Passagem Direta (Bye)**: Os Cabeças de Chave passam automaticamente para a rodada seguinte (ex: direto para Semifinal ou Quartas) sem precisar jogar a rodada preliminar.
*   **Rodada de Play-in**: As duplas com campanhas inferiores disputam as vagas restantes na chave em jogos eliminatórios preliminares.

---

## 3. Arbitragem e Segurança

Para garantir a integridade dos resultados e a facilidade de uso pelos árbitros na areia:

*   **Acesso Simplificado**: Árbitros acessam o sistema via QR Code direto nas quadras, sem necessidade de logins individuais.
*   **Trava de Dispositivo**: Uma vez que uma partida é iniciada por um árbitro, ela fica "travada" para o dispositivo dele. Isso impede que outro árbitro interfira ou altere o placar acidentalmente.
*   **Bloqueio de Simultaneidade**: O sistema impede que a mesma quadra ou a mesma partida sejam iniciadas simultaneamente em dois lugares diferentes, garantindo que o placar oficial seja único e seguro.

---

## 4. Gestão de Quadras

*   **Quadra Única**: O sistema impede que uma quadra receba dois jogos ao mesmo tempo.
*   **Sincronização em Tempo Real**: Assim que o árbitro marca um ponto no celular, o placar é atualizado instantaneamente no **Painel da Arena (TV)** e no **Link Público** dos torcedores.

---
*Gerado automaticamente pelo ecossistema Beach Tennis Manager - Tecnologia a serviço do esporte.*
