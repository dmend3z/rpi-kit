# Project Doc Generator

## Summary
Skill do RPIKit que analisa automaticamente um codebase existente e gera documentação completa — CLAUDE.md, AGENTS.md, README.md, e templates custom. Funciona como uma skill que o Claude invoca automaticamente quando deteta que um projeto precisa de documentação, ou manualmente via comando.

## Problem
Projetos existentes frequentemente carecem de documentação adequada, o que afeta três áreas:
1. **Onboarding de devs** — Novos developers perdem horas/dias a entender a estrutura, padrões, e convenções de um projeto sem docs
2. **Docs desatualizados** — Documentação manual fica rapidamente desatualizada em relação ao código real
3. **Setup de contexto AI** — Projetos sem CLAUDE.md/AGENTS.md não aproveitam o potencial do Claude Code, que depende deste contexto para ser eficaz

## Target Users
- Developers que adoptam Claude Code em projetos existentes
- Teams que precisam de onboarding rápido para novos membros
- Qualquer utilizador do RPIKit que queira documentação auto-gerada e mantida

## Requirements

### Análise Automática do Codebase
- Detetar linguagens, frameworks, e ferramentas usadas
- Mapear estrutura de diretórios e padrões de organização
- Identificar APIs (REST, GraphQL, etc.) e endpoints
- Detetar padrões de arquitetura (MVC, Clean Architecture, etc.)
- Analisar dependências e versões
- Identificar convenções de código (naming, estilo, testes)

### Outputs Gerados
- **CLAUDE.md** — Contexto para o Claude Code: regras, estrutura, convenções, comandos úteis
- **AGENTS.md** — Lista de agentes disponíveis e quando usá-los
- **README.md** — Overview do projeto, setup, usage, contribuição
- **Templates custom** — Suporte para templates definidos pelo utilizador (ex: ADRs, API docs)

### Análise Incremental
- Detetar o que mudou desde a última geração
- Atualizar apenas secções afetadas (não reescrever tudo)
- Mostrar diff do que vai mudar antes de aplicar

### Atualização Contínua
- Possibilidade de re-correr para atualizar docs existentes
- Preservar secções editadas manualmente pelo utilizador
- Marcar secções auto-geradas vs manuais

## Constraints
- Deve funcionar como Skill do RPIKit (invocação automática pelo Claude quando relevante)
- Deve também ter um comando manual (`/rpi:docs` ou similar) para uso explícito
- Não deve sobrescrever conteúdo manual sem confirmação
- Deve funcionar em qualquer linguagem/framework (não apenas Node.js)
- Análise deve ser read-only — nunca modificar código fonte
- Performance: deve completar análise de projetos médios (~500 ficheiros) em tempo razoável

## References
- Skill `doc-gen` do forja plugin (`forja--research--planning--forja-plan--forja-plan`) — gera CLAUDE.md/AGENTS.md/README.md
- Agent `doc-gen` existente no RPIKit — já tem capacidade de gerar estes ficheiros
- Skill `claude-md-management:claude-md-improver` — audita e melhora CLAUDE.md existentes
- Agent `gsd-codebase-mapper` — analisa codebase com agentes paralelos

## Complexity Estimate
XL — Sistema completo com análise de codebase multi-linguagem, geração de múltiplos outputs, análise incremental com diffs, atualização contínua com preservação de conteúdo manual, e suporte a templates custom. Requer research profundo sobre como analisar diferentes tipos de projetos e manter docs sincronizados.
