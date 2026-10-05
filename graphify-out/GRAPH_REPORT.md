# Graph Report - tagh  (2026-10-04)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 250 nodes · 553 edges · 12 communities (10 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a446234a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10

## God Nodes (most connected - your core abstractions)
1. `react` - 19 edges
2. `faNum()` - 18 edges
3. `TravelSuggestions()` - 14 edges
4. `CalendarPage()` - 12 edges
5. `weekdayIndex()` - 10 edges
6. `Link()` - 10 edges
7. `compilerOptions` - 10 edges
8. `Destination` - 9 edges
9. `JalaliDate` - 8 edges
10. `parseJalaliInput()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Props` --references--> `Destination`  [EXTRACTED]
  src/components/DestinationCard.tsx → src/data/destinations.ts
- `RecommendResult` --references--> `Destination`  [EXTRACTED]
  src/data/recommend.ts → src/data/destinations.ts
- `Scored` --references--> `Destination`  [EXTRACTED]
  src/data/recommend.ts → src/data/destinations.ts
- `Props` --references--> `IconName`  [EXTRACTED]
  src/admin/components/QuickAction.tsx → src/admin/components/Icon.tsx
- `Props` --references--> `IconName`  [EXTRACTED]
  src/admin/components/StatCard.tsx → src/admin/components/Icon.tsx

## Import Cycles
- None detected.

## Communities (12 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (36): react, react-dom, AdminApp, App(), ChipGroup(), Props, DestinationCard(), Props (+28 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (30): ParsedDate, parseJalaliInput(), toLatinDigits(), toPersianDigits(), Calendar(), CalendarProps, DateHeader(), formatIn() (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (31): dependencies, jalaali-js, react, react-dom, serve, @types/jalaali-js, devDependencies, @types/react (+23 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (22): Icon(), IconName, PATHS, Props, QuickAction(), Props, StatCard(), ACTIONS (+14 more)

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (21): EventDraft, EventForm(), Props, Actions(), Badge(), EventTable(), Props, Modal() (+13 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (14): AdminApp(), AdminLayout(), Props, Section(), Props, Sidebar(), Props, Topbar() (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.26
Nodes (15): BREAKS, d2gYear(), d2j(), div(), firstWeekday(), g2d(), isLeap(), j2d() (+7 more)

### Community 7 - "Community 7"
Cohesion: 0.25
Nodes (13): Badge(), DetailsButton(), Props, UserTable(), DEFAULT_USER_FILTERS, filterUsers(), MOCK_USERS, normalize() (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (11): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (5): build, buildCommand, deploy, startCommand, $schema

## Knowledge Gaps
- **66 isolated node(s):** `Props`, `ParsedDate`, `Occasion`, `CalendarDay`, `Props` (+61 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 72 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 7`?**
  _High betweenness centrality (0.312) - this node is a cross-community bridge._
- **Why does `faNum()` connect `Community 1` to `Community 0`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **What connects `Props`, `ParsedDate`, `Occasion` to the rest of the system?**
  _66 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0975177304964539 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.13756613756613756 - nodes in this community are weakly interconnected._