# RPIKit v2 — Design Document

> Rewrite completo do RPIKit, inspirado em OpenSpec, BMAD-METHOD e Compound Engineering.
> Mantém a simplicidade do pipeline Research → Plan → Implement, expandido para 7 fases com 13 agentes com personalidade.

## Inspirações

| Repo | O que se tira |
|------|---------------|
| **OpenSpec** | Delta specs (só capturam o que muda), archiving com timestamp |
| **BMAD-METHOD** | Agentes com personalidade, Party Mode, adversarial review, quick flow, project-context.md |
| **Compound Engineering** | Knowledge compounding (docs/solutions/), multi-agent review paralelo, brainstorming estruturado, ultra-thinking deep dive |

---

## Arquitectura de Comandos

### Comando principal: `/rpi <feature>`

Auto-detecta a próxima fase e executa-a. Só funciona se a feature já existe.

```
/rpi oauth          → tem REQUEST.md? → Phase 2: Research
/rpi oauth          → tem RESEARCH.md? → Phase 3: Plan
/rpi oauth          → tem PLAN.md? → Phase 4: Implement
/rpi oauth          → tem IMPLEMENT.md? → Phase 5: Simplify
/rpi oauth          → simplify done? → Phase 6: Review
/rpi oauth          → review PASS? → Phase 7: Docs
```

Se a feature não existe: `Feature 'oauth' not found. Run /rpi:new oauth to start.`

### Entry point

```
/rpi:new oauth            → Luna entrevista, cria REQUEST.md
/rpi:new oauth --quick    → quick flow (request → mini-plan → implement)
```

### Escape hatches (correr fase específica)

```
/rpi:research oauth       → forçar (re)correr research
/rpi:plan oauth           → forçar (re)gerar plan
/rpi:implement oauth      → forçar (re)implementar
/rpi:simplify oauth       → forçar simplify
/rpi:review oauth         → forçar review
/rpi:docs oauth           → forçar docs
```

### Utilitários

```
/rpi:init                 → configurar RPIKit + gerar project-context.md
/rpi:status               → ver todas as features e fases
/rpi:party "tema"         → debate multi-agente
/rpi:learn                → guardar solução/insight manualmente
/rpi:archive oauth        → merge delta → specs, delete feature
/rpi:onboarding           → primeira vez, analisa codebase, guia o user
```

### Flags globais

```
--quick          → quick flow (skip research + plan completo)
--skip=phase     → pular fase(s) específica(s)
--force          → re-correr fase mesmo que artefactos existam
--from=phase     → começar a partir de uma fase específica
```

**Total: 14 comandos** (1 flow + 1 new + 6 fases + 6 utilitários)

---

## Agentes (13)

| # | Nome | Persona | Fase(s) | Papel |
|---|------|---------|---------|-------|
| 1 | **Luna** | Analista curiosa, faz perguntas incómodas | Request | Elicitar requisitos, escrever REQUEST.md |
| 2 | **Atlas** | Explorador metódico, conhece cada canto do código | Research | Analisar codebase, padrões, convenções |
| 3 | **Scout** | Investigador externo, pesquisa tudo lá fora | Research | Viabilidade técnica, libs, riscos |
| 4 | **Mestre** | Arquitecto pragmático, odeia over-engineering | Plan | Decisões técnicas, eng.md, PLAN.md, delta/ |
| 5 | **Clara** | PM focada em valor, corta scope sem dó | Plan | Requisitos produto, pm.md, priorização |
| 6 | **Pixel** | UX designer empático, pensa no utilizador | Plan | Fluxos UX, ux.md *(condicional — só frontend)* |
| 7 | **Forge** | Executor disciplinado, segue o plano à risca | Implement | Implementar tasks, commit por task |
| 8 | **Sage** | Tester rigoroso, encontra os edge cases | Implement + Review | Gerar testes, verificar coverage |
| 9 | **Razor** | Simplificador implacável, elimina o desnecessário | Simplify | Dead code, reuso, complexidade |
| 10 | **Hawk** | Revisor adversarial, procura problemas | Review | Code review geral, qualidade, padrões |
| 11 | **Shield** | Sentinela de segurança, paranóico por natureza | Review | Security, OWASP, secrets, injection |
| 12 | **Quill** | Escritor claro e conciso | Docs | README, changelogs, documentação |
| 13 | **Nexus** | Sintetizador e facilitador, une perspectivas | Cross-phase + Party | Merge outputs, facilitar debates |

### Agentes por fase

- **Request:** Luna
- **Research:** Atlas + Scout → Nexus (síntese)
- **Plan:** Mestre + Clara + Pixel (condicional) → Nexus (validação)
- **Implement:** Forge + Sage (se TDD)
- **Simplify:** Razor
- **Review:** Hawk + Shield + Sage (paralelo) → Nexus (síntese)
- **Docs:** Quill
- **Party Mode:** Nexus (facilitador) + 3-5 agentes relevantes
- **Archive:** Nexus (merge delta → specs)

---

## Estrutura de Directórios

```
rpi/
├── context.md                          # "constituição" do projecto
├── specs/                              # verdade actual do sistema
│   ├── auth/
│   │   └── session-management.md
│   ├── payments/
│   │   └── stripe-checkout.md
│   └── ...
├── solutions/                          # knowledge compounding
│   ├── performance/
│   ├── security/
│   ├── database/
│   ├── testing/
│   ├── architecture/
│   ├── patterns/
│   └── decisions/                      # outputs do party mode
└── features/                           # features activas
    └── oauth/
        ├── REQUEST.md                  # output da Luna
        ├── research/
        │   └── RESEARCH.md             # output do Atlas + Scout + Nexus
        ├── delta/                      # o que vai mudar nas specs
        │   ├── ADDED/
        │   │   └── oauth-providers.md
        │   ├── MODIFIED/
        │   │   └── session-management.md
        │   └── REMOVED/
        ├── plan/
        │   ├── PLAN.md                 # tasks checklist (Mestre)
        │   ├── eng.md                  # spec técnica (Mestre)
        │   ├── pm.md                   # spec produto (Clara)
        │   └── ux.md                   # spec UX (Pixel, condicional)
        └── implement/
            └── IMPLEMENT.md            # tracking de execução (Forge)
```

---

## Workflow por Fase

### Phase 1: Request (`/rpi:new`)

**Agente:** Luna

1. Luna entrevista o dev com perguntas adaptativas
2. Deriva slug do nome da feature
3. Se `--quick`: max 2 perguntas, gera mini-plan inline
4. Detecta complexidade (S/M/L/XL) e sugere quick flow se S

**Output:** `rpi/features/{slug}/REQUEST.md`

### Phase 2: Research (`/rpi:research`)

**Agentes:** Atlas + Scout + Nexus

1. Atlas analisa codebase em paralelo com Scout
   - Atlas: ficheiros relevantes, padrões, arquitectura, specs existentes
   - Scout: viabilidade técnica, libs, benchmarks, riscos
2. Scout pesquisa `rpi/solutions/` para soluções relevantes
3. Se Atlas e Scout divergem → Nexus activa mini-debate (party mode inline)
4. Nexus sintetiza outputs num RESEARCH.md coerente
5. Popula `delta/` com specs do estado actual relevante

**Output:** `RESEARCH.md` com veredicto GO | GO with concerns | NO-GO

### Phase 3: Plan (`/rpi:plan`)

**Agentes:** Mestre + Clara + Pixel (condicional) + Nexus

1. Mestre lê RESEARCH.md + REQUEST.md + context.md + specs relevantes
2. Mestre gera eng.md (decisões técnicas, approach)
3. Clara gera pm.md (requisitos produto, acceptance criteria)
4. Pixel gera ux.md se frontend detectado
5. Mestre gera PLAN.md com tasks numeradas, deps, ficheiros
6. Mestre gera `delta/` (ADDED, MODIFIED, REMOVED)
7. Nexus valida coerência entre eng.md, pm.md e PLAN.md

**Output:** `PLAN.md` + `eng.md` + `pm.md` + `ux.md` (condicional) + `delta/`

### Phase 4: Implement (`/rpi:implement`)

**Agentes:** Forge + Sage (se TDD)

1. Forge lê PLAN.md + eng.md + context.md
2. Para cada task:
   a. Lê ficheiros target (CONTEXT_READ obrigatório)
   b. Se TDD: Sage gera testes antes, Forge implementa para passar
   c. Implementa seguindo padrões detectados
   d. Commit por task
   e. Report: DONE | BLOCKED | DEVIATED
3. Actualiza IMPLEMENT.md com status de cada task

**Output:** `IMPLEMENT.md` actualizado, código implementado

### Phase 5: Simplify (`/rpi:simplify`)

**Agente:** Razor

1. Razor lê o diff total da implementação
2. Verifica 3 dimensões em paralelo:
   a. Reuso: código duplicado, oportunidades de extracção
   b. Qualidade: naming, complexidade, code smells
   c. Eficiência: algoritmos, queries, imports desnecessários
3. Aplica fixes directamente
4. Commit com resumo das mudanças

**Output:** Código simplificado, IMPLEMENT.md actualizado

### Phase 6: Review (`/rpi:review`)

**Agentes:** Hawk + Shield + Sage (paralelo) → Nexus (síntese)

1. Hawk faz review adversarial geral:
   - Ultra-thinking deep dive (5 perspectivas: dev, ops, user, security, business)
   - Forçado a encontrar problemas (zero findings = re-análise)
   - Classifica: P1 (bloqueia) | P2 (deve fix) | P3 (nice-to-have)
2. Shield faz audit de segurança:
   - OWASP Top 10, secrets, injection, auth bypass
   - Edge cases e boundary conditions
3. Sage verifica test coverage:
   - Módulos sem testes, paths não cobertos
   - Sugere testes que faltam
4. Nexus sintetiza findings num report
5. Se P1 encontrados: FAIL com lista de fixes obrigatórios
6. Se knowledge compounding relevante: grava auto em `rpi/solutions/`

**Output:** Veredicto PASS | PASS with concerns | FAIL

### Phase 7: Docs (`/rpi:docs`)

**Agente:** Quill

1. Quill lê REQUEST.md + PLAN.md + IMPLEMENT.md + delta/
2. Gera/actualiza README, changelog, API docs, inline docs
3. Commit com docs actualizados

**Output:** Documentação actualizada

### Archive (`/rpi:archive`)

**Agente:** Nexus

1. Merge `delta/` → `rpi/specs/` (ADDED copiado, MODIFIED aplicado, REMOVED apagado)
2. Se review encontrou soluções interessantes → grava em `rpi/solutions/`
3. Delete `rpi/features/{slug}/`
4. Histórico preservado no git

---

## Party Mode (`/rpi:party`)

```
/rpi:party "GraphQL vs REST para a API?"
/rpi:party oauth "como lidar com token refresh?"
```

**Facilitador:** Nexus

1. Nexus analisa o tema e selecciona 3-5 agentes relevantes
   - Tema técnico → Mestre + Atlas + Scout
   - Tema produto → Clara + Luna + Pixel
   - Tema misto → Mestre + Clara + Shield + Atlas
2. Cada agente responde em personagem com a sua perspectiva
3. Nexus identifica pontos de consenso e divergência
4. Se divergência: Nexus pede a cada agente para responder ao argumento oposto
5. Nexus sintetiza recomendação final com trade-offs

**Output:** Resumo com decisão recomendada. Opcionalmente grava em `rpi/solutions/decisions/`.

**Integração no research:** Se Atlas e Scout divergem em algo crítico, Nexus activa mini-debate antes da síntese.

---

## Knowledge Compounding

### Automático (no review)

Se Hawk/Shield encontram problema → dev fix → solução gravada em `rpi/solutions/{categoria}/{slug}.md`

Categorias auto-detectadas: `performance/`, `security/`, `database/`, `testing/`, `architecture/`, `patterns/`, `decisions/`

### Manual (`/rpi:learn`)

```
/rpi:learn                          → Nexus pergunta o que aprendeste
/rpi:learn "N+1 no Prisma"         → Nexus gera doc com contexto do código actual
```

### Formato

```markdown
# {Título}

## Problema
{sintomas, como se manifesta}

## Solução
{código, abordagem, o que funcionou}

## Prevenção
{como evitar no futuro}

## Contexto
Feature: {slug} | Data: {YYYY-MM-DD}
Ficheiros: {lista}
```

### Reuso

Durante research, Scout pesquisa `rpi/solutions/` automaticamente e inclui soluções relevantes no RESEARCH.md.

---

## Quick Flow

**Trigger automático:** Luna estima complexidade S → sugere quick flow.
**Trigger manual:** `--quick` flag.

```
Quick flow pipeline:
1. Luna faz 1-2 perguntas rápidas → REQUEST.md compacto
2. Skip research + plan completo
3. Forge recebe REQUEST.md + context.md directamente
4. Forge gera mini-plan inline (3-5 tasks max)
5. Implementa task a task
6. Razor faz simplify rápido
7. Skip review formal (só lint/tests)
8. Quill actualiza docs se necessário
```

**Safeguard:** Se Forge detecta complexidade > S durante implement → para e sugere correr research + plan completo.

---

## project-context.md

Gerado durante `/rpi:init`, separado do CLAUDE.md:

```markdown
# Project Context

## Stack
- Language: {language} {version}
- Framework: {framework} {version}
- Database: {db} via {orm}
- Testing: {test_framework}
- Styling: {approach}

## Conventions
- File naming: {pattern}
- Components: {pattern}
- Error handling: {pattern}
- API: {pattern}

## Architecture
- {directory}: {purpose}
- ...

## Rules
- {rule 1}
- {rule 2}
- ...
```

Agentes podem sugerir updates ao context.md quando detectam padrões novos. O dev aprova.

---

## Configuração (.rpi.yaml)

```yaml
version: 2

# Directórios
folder: rpi/features
specs_dir: rpi/specs
solutions_dir: rpi/solutions
context_file: rpi/context.md

# Execução
parallel_threshold: 8
commit_style: conventional
tdd: false

# Agentes condicionais
ux_agent: auto                 # auto | always | never

# Quick flow
quick_complexity: S

# Knowledge compounding
auto_learn: true

# Party mode
party_default_agents: 4
```

---

## Resumo

| Aspecto | Decisão |
|---------|---------|
| **Nome** | RPIKit v2 (rewrite completo) |
| **Pipeline** | 7 fases lineares, qualquer uma skipável |
| **Comandos** | 14 total (1 flow + 1 new + 6 fases + 6 utilitários) |
| **Agentes** | 13 com personas ricas |
| **Specs** | Delta specs: research cria baseline, plan cria delta, archive merge |
| **Directórios** | `rpi/specs/` + `rpi/solutions/` + `rpi/features/` + `rpi/context.md` |
| **Party Mode** | Standalone + integrado no research, facilitado por Nexus |
| **Knowledge** | Auto no review + `/rpi:learn` manual |
| **Quick Flow** | Auto-detect S + `--quick` flag, com safeguard |
| **Archiving** | Merge delta → specs, gravar solução, delete feature folder |
| **Config** | `.rpi.yaml` v2 com defaults sensatos |
