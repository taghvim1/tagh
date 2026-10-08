# Graph Report - tagh  (2026-10-08)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 470 nodes · 1291 edges · 16 communities (14 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d117a140`
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
- Community 11
- Community 12
- Community 13
- Community 14

## God Nodes (most connected - your core abstractions)
1. `react` - 38 edges
2. `faNum()` - 31 edges
3. `TravelSuggestions()` - 22 edges
4. `Destination` - 18 edges
5. `Season` - 17 edges
6. `AppChrome()` - 15 edges
7. `Tours()` - 15 edges
8. `Modal()` - 15 edges
9. `Tour` - 13 edges
10. `CalendarPage()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Props` --references--> `Destination`  [EXTRACTED]
  src/admin/components/DestinationForm.tsx → src/data/destinations.ts
- `Props` --references--> `Season`  [EXTRACTED]
  src/components/SeasonPicker.tsx → src/data/destinations.ts
- `Props` --references--> `Destination`  [EXTRACTED]
  src/admin/components/TourForm.tsx → src/data/destinations.ts
- `Props` --references--> `Destination`  [EXTRACTED]
  src/components/DestinationContent.tsx → src/data/destinations.ts
- `Props` --references--> `Season`  [EXTRACTED]
  src/components/DestinationContent.tsx → src/data/destinations.ts

## Import Cycles
- None detected.

## Communities (16 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (65): levelOpts, Props, ratingOpts, blankSeason(), DestinationDraft, DraftResult, fromDraft(), SeasonDraft (+57 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (50): react, INITIAL, Settings(), Switch(), AdminApp, App(), AdvancedFilter(), AppChrome() (+42 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (43): Column, DataTable(), DestinationForm(), AreaField(), CheckGroup(), lab(), lines(), num() (+35 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (33): dependencies, jalaali-js, react, react-dom, serve, @types/jalaali-js, devDependencies, @types/react (+25 more)

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (28): ParsedDate, parseJalaliInput(), toLatinDigits(), toPersianDigits(), Calendar(), CalendarProps, DateHeader(), formatIn() (+20 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (24): AdminApp(), AdminLayout(), Props, Props, Sidebar(), Props, Topbar(), ComingSoon() (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (22): react-dom, CalendarData, DEFAULT, initCalendarData(), isValid(), listeners, Occasion, publish() (+14 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (26): common, seedTours(), addDays(), ALL, BUDGET_OPTIONS, COMPANION_OPTIONS, DATE_OPTIONS, dateFmt (+18 more)

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (20): EventDraft, EventForm(), Props, Actions(), Badge(), EventTable(), Props, Props (+12 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (14): deg(), DestinationContent(), Props, locationLabel(), FavoriteKind, listeners, Store, subscribe() (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.24
Nodes (12): Icon(), IconName, PATHS, Props, QuickAction(), Section(), Props, StatCard() (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (13): Badge(), DetailsButton(), Props, UserTable(), DEFAULT_USER_FILTERS, filterUsers(), MOCK_USERS, normalize() (+5 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (12): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, resolveJsonModule (+4 more)

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (5): build, buildCommand, deploy, startCommand, $schema

## Knowledge Gaps
- **98 isolated node(s):** `DraftResult`, `Base`, `Derived`, `DestinationInput`, `R` (+93 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 116 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`?**
  _High betweenness centrality (0.391) - this node is a cross-community bridge._
- **Why does `faNum()` connect `Community 4` to `Community 1`, `Community 2`, `Community 8`, `Community 9`, `Community 11`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `DraftResult`, `Base`, `Derived` to the rest of the system?**
  _98 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06394027913015254 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09038461538461538 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08766803039158387 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.052564102564102565 - nodes in this community are weakly interconnected._