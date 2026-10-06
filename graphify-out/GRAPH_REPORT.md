# Graph Report - tagh  (2026-10-06)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 291 nodes · 659 edges · 14 communities (12 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `21a68955`
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

## God Nodes (most connected - your core abstractions)
1. `faNum()` - 20 edges
2. `react` - 20 edges
3. `TravelSuggestions()` - 16 edges
4. `Link()` - 14 edges
5. `JalaliDate` - 11 edges
6. `CalendarPage()` - 11 edges
7. `Destination` - 10 edges
8. `Season` - 10 edges
9. `weekdayIndex()` - 10 edges
10. `compilerOptions` - 10 edges

## Surprising Connections (you probably didn't know these)
- `RecommendResult` --references--> `Destination`  [EXTRACTED]
  src/data/recommend.ts → src/data/destinations.ts
- `Scored` --references--> `Destination`  [EXTRACTED]
  src/data/recommend.ts → src/data/destinations.ts
- `Props` --references--> `Season`  [EXTRACTED]
  src/components/TripDate.tsx → src/data/destinations.ts
- `RecommendInput` --references--> `Season`  [EXTRACTED]
  src/data/recommend.ts → src/data/destinations.ts
- `Props` --references--> `EventItem`  [EXTRACTED]
  src/admin/components/EventForm.tsx → src/admin/data/events.ts

## Import Cycles
- None detected.

## Communities (14 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (39): ChipGroup(), Props, DestinationCard(), Props, Base, BUDGETS, Destination, DURATIONS (+31 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (38): ParsedDate, parseJalaliInput(), toLatinDigits(), toPersianDigits(), Calendar(), CalendarProps, DateHeader(), formatIn() (+30 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (31): dependencies, jalaali-js, react, react-dom, serve, @types/jalaali-js, devDependencies, @types/react (+23 more)

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (22): react, EventDraft, EventForm(), Props, Actions(), Badge(), EventTable(), Props (+14 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (19): react-dom, AdminApp, App(), clamp(), Drawer(), Icon(), ICONS, Props (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.19
Nodes (15): Icon(), IconName, PATHS, Props, QuickAction(), Section(), Props, StatCard() (+7 more)

### Community 6 - "Community 6"
Cohesion: 0.21
Nodes (10): AdminApp(), AdminLayout(), Props, Props, Sidebar(), Props, Topbar(), ComingSoon() (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.26
Nodes (15): BREAKS, d2gYear(), d2j(), div(), firstWeekday(), g2d(), isLeap(), j2d() (+7 more)

### Community 8 - "Community 8"
Cohesion: 0.25
Nodes (13): Badge(), DetailsButton(), Props, UserTable(), DEFAULT_USER_FILTERS, filterUsers(), MOCK_USERS, normalize() (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (9): recommend(), RecommendInput, SEASON_BY_MONTH, WEIGHTS, BUDGETS, DURATIONS, EMPTY_FILTERS, TravelFilters (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (11): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (5): build, buildCommand, deploy, startCommand, $schema

## Knowledge Gaps
- **76 isolated node(s):** `Props`, `Base`, `ParsedDate`, `Occasion`, `CalendarDay` (+71 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 86 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 8`?**
  _High betweenness centrality (0.287) - this node is a cross-community bridge._
- **Why does `faNum()` connect `Community 1` to `Community 8`, `Community 0`, `Community 3`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `Link()` connect `Community 4` to `Community 0`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `Props`, `Base`, `ParsedDate` to the rest of the system?**
  _76 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0935374149659864 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12411347517730496 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._