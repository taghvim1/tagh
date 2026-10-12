# Graph Report - tagh  (2026-10-11)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 935 nodes · 2656 edges · 47 communities (44 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d6025c51`
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
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45

## God Nodes (most connected - your core abstractions)
1. `react` - 59 edges
2. `faNum()` - 49 edges
3. `Destination` - 25 edges
4. `CalendarPage()` - 25 edges
5. `TravelSuggestions()` - 25 edges
6. `Favorites()` - 22 edges
7. `Tour` - 20 edges
8. `fromGregorian()` - 20 edges
9. `useDarkMode()` - 19 edges
10. `Season` - 18 edges

## Surprising Connections (you probably didn't know these)
- `series()` --calls--> `fromGregorian()`  [EXTRACTED]
  tests/weather.test.ts → src/lib/jalali.ts
- `mk()` --calls--> `createTracker()`  [EXTRACTED]
  tests/analytics.test.ts → src/analytics/tracker.ts
- `makeDeps()` --calls--> `parseForecast()`  [EXTRACTED]
  tests/weather.test.ts → src/weather/current/client.ts
- `Props` --references--> `TourOrganizer`  [EXTRACTED]
  src/admin/components/OrganizerForm.tsx → src/tour-organizers/types.ts
- `guest()` --calls--> `memoryKV()`  [EXTRACTED]
  tests/analytics.test.ts → src/analytics/ids.ts

## Import Cycles
- None detected.

## Communities (47 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (67): trackRoute(), useAnalytics(), AdminApp, App(), AppChrome(), Props, svg, box (+59 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (45): lines(), num(), Props, fromDraft(), fromTourDraft(), TourDraft, TourResult, DURATIONS (+37 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (36): AdminApp(), AdminLayout(), Props, Props, Sidebar(), Props, Topbar(), ComingSoon() (+28 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (39): ParsedDate, parseJalaliInput(), toLatinDigits(), toPersianDigits(), Calendar(), CalendarProps, LONG_PRESS_MS, DateHeader() (+31 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (34): react-dom, tracker, CalendarData, DEFAULT, initCalendarData(), isValid(), listeners, Occasion (+26 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (32): auditEntry(), clearConsent(), CONSENT_KINDS, consentSummary(), loadConsentRecords(), NO_CONSENT, POLICY_VERSION, recordConsent() (+24 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (25): ApiUnavailableError, createDemoApi(), OfferDraft, UsersApi, Page, ACTIVE_WINDOW_DAYS, AudienceCounts, DashboardStats (+17 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (28): ApprovalCheck, arr(), draftRepo, isHttpOrPath(), LEVELS, parseAiDestinations(), ParsedItem, ParseResult (+20 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (26): destName(), EVENT_LABEL, fmtDate(), Props, UserDetailView(), destName(), FilterForm(), fixBool() (+18 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (24): ProfileRecord, UserDetail, UserSummary, AccountState, alreadyMerged(), GuestBundle, mergeGuestIntoAccount(), mergeInner() (+16 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (17): buildPrompt(), checkApproval(), AiGenerator, AiUnavailableError, createRemoteAiGenerator(), req(), ImageResult, AiSuggestions() (+9 more)

### Community 11 - "Community 11"
Cohesion: 0.19
Nodes (19): EventDraft, EventForm(), Props, Actions(), Badge(), EventTable(), Props, DEFAULT_FILTERS (+11 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (19): AdvancedFilter(), ChipGroup(), Props, ALL, applyFilters(), BUDGET_OPTIONS, COMPANION_OPTIONS, DURATION_OPTIONS (+11 more)

### Community 13 - "Community 13"
Cohesion: 0.19
Nodes (15): Icon(), IconName, PATHS, Props, QuickAction(), Section(), Props, StatCard() (+7 more)

### Community 14 - "Community 14"
Cohesion: 0.25
Nodes (13): react, Column, DataTable(), DestinationForm(), Modal(), Props, FormState, ManageDestinations() (+5 more)

### Community 15 - "Community 15"
Cohesion: 0.23
Nodes (14): finiteOrNull(), WeatherError, buildArchiveUrl(), DAILY_VARS, fetchArchive(), historyRange(), parseArchive(), coordinatesOf() (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (10): fastify, @fastify/rate-limit, @fastify/static, postgres, AppDeps, buildApp(), Config, createDb() (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.22
Nodes (6): FormState, createLocalRepository(), Repository, seedOrganizers(), organizerRepo, TourOrganizer

### Community 18 - "Community 18"
Cohesion: 0.16
Nodes (14): buildDemoProfiles(), CITIES, NAMES, rng(), SEASONS, TYPES, computeInterests(), DEFAULT_WEIGHTS (+6 more)

### Community 19 - "Community 19"
Cohesion: 0.21
Nodes (11): destMeta(), trackDestinationView(), trackFavorite(), EventProps, FavButton(), FavoriteKind, listeners, Store (+3 more)

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (12): AiDraftRecord, Props, DestinationDraft, SuggestionsPreview(), DestinationCard(), deg(), DestinationContent(), Props (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.31
Nodes (12): AreaField(), CheckGroup(), lab(), Opt, Row(), SelectField(), TextField(), val() (+4 more)

### Community 22 - "Community 22"
Cohesion: 0.22
Nodes (11): memoryKV(), safeKV(), getOrCreateInstallation(), account(), data, ev(), guest(), mk() (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.23
Nodes (12): deg(), ERROR_TEXT, WeatherCard(), fmt, formatClock(), msUntilNextMinute(), useNow(), TEXT (+4 more)

### Community 24 - "Community 24"
Cohesion: 0.28
Nodes (12): SeasonClimate, MAX_PER_SECTION, recommend(), HUMID, isExtreme(), isSeasonSuitable(), RAIN, rainHumidityScore() (+4 more)

### Community 25 - "Community 25"
Cohesion: 0.14
Nodes (13): engines, node, name, private, type, version, jalaali-js, serve (+5 more)

### Community 27 - "Community 27"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, lib, module, moduleResolution, outDir, rootDir, skipLibCheck (+5 more)

### Community 28 - "Community 28"
Cohesion: 0.20
Nodes (12): Badge(), DetailsButton(), Props, UserTable(), DEFAULT_USER_FILTERS, filterUsers(), MOCK_USERS, normalize() (+4 more)

### Community 29 - "Community 29"
Cohesion: 0.21
Nodes (9): buildForecastUrl(), fetchForecast(), first(), parseForecast(), makeDeps(), Pos, sample, series() (+1 more)

### Community 30 - "Community 30"
Cohesion: 0.23
Nodes (10): browserDeps, Coords, Persisted, POS_ERR, REFRESH_MS, WeatherDeps, WeatherState, weatherStore (+2 more)

### Community 31 - "Community 31"
Cohesion: 0.26
Nodes (11): Acc, add(), analyzeSeries(), avg(), finish(), newAcc(), RAINY_DAY_MM, round1() (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (12): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, resolveJsonModule (+4 more)

### Community 33 - "Community 33"
Cohesion: 0.33
Nodes (10): trackSeason(), Props, getSaved(), Saved, saveState(), TravelSuggestions(), activeFilterCount(), EMPTY_FILTERS (+2 more)

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (11): dependencies, fastify, @fastify/rate-limit, @fastify/static, jalaali-js, postgres, react, react-dom (+3 more)

### Community 35 - "Community 35"
Cohesion: 0.22
Nodes (8): Base, Derived, DestinationInput, make(), mode(), R, SEED_COORDINATES, withDerived()

### Community 36 - "Community 36"
Cohesion: 0.20
Nodes (10): scripts, build, build:server, dev, dev:server, preview, start, start:api (+2 more)

### Community 37 - "Community 37"
Cohesion: 0.20
Nodes (5): bundles, dir, files, out, root

### Community 38 - "Community 38"
Cohesion: 0.22
Nodes (4): vite, @vitejs/plugin-react, precache(), walk()

### Community 39 - "Community 39"
Cohesion: 0.36
Nodes (8): common, Props, SeasonIcon(), SeasonPicker(), Season, SeasonKey, SeasonInfo, SEASONS

### Community 40 - "Community 40"
Cohesion: 0.31
Nodes (6): vitest, zod, loadConfig(), schema, cfg(), site()

### Community 41 - "Community 41"
Cohesion: 0.25
Nodes (8): devDependencies, @types/node, @types/react, @types/react-dom, typescript, vite, @vitejs/plugin-react, vitest

### Community 42 - "Community 42"
Cohesion: 0.33
Nodes (5): build, buildCommand, deploy, startCommand, $schema

### Community 43 - "Community 43"
Cohesion: 0.60
Nodes (5): buildGeocodeUrl(), keyOf(), read(), reverseGeocode(), roundCoord()

### Community 45 - "Community 45"
Cohesion: 1.00
Nodes (3): createWeatherStore(), fetchFor(), run()

## Knowledge Gaps
- **199 isolated node(s):** `Props`, `Props`, `State`, `Settings`, `Opened` (+194 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 256 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 14` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 7`, `Community 8`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 17`, `Community 19`, `Community 20`, `Community 21`, `Community 23`, `Community 25`, `Community 30`, `Community 33`?**
  _High betweenness centrality (0.362) - this node is a cross-community bridge._
- **Why does `faNum()` connect `Community 3` to `Community 0`, `Community 33`, `Community 4`, `Community 8`, `Community 10`, `Community 11`, `Community 14`, `Community 17`, `Community 20`, `Community 23`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `Destination` connect `Community 20` to `Community 0`, `Community 1`, `Community 33`, `Community 35`, `Community 7`, `Community 10`, `Community 12`, `Community 14`, `Community 15`, `Community 18`, `Community 21`, `Community 24`, `Community 29`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `Props`, `Props`, `State` to the rest of the system?**
  _199 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0712461695607763 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09361393323657474 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08067375886524823 - nodes in this community are weakly interconnected._