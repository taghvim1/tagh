# Graph Report - tagh  (2026-10-12)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1137 nodes · 3225 edges · 52 communities (47 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8c62e539`
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
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50

## God Nodes (most connected - your core abstractions)
1. `react` - 65 edges
2. `faNum()` - 56 edges
3. `Store` - 29 edges
4. `Destination` - 28 edges
5. `TravelSuggestions()` - 25 edges
6. `CalendarPage()` - 24 edges
7. `Favorites()` - 22 edges
8. `useDarkMode()` - 21 edges
9. `Tour` - 20 edges
10. `fromGregorian()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `series()` --calls--> `fromGregorian()`  [EXTRACTED]
  tests/weather.test.ts → src/lib/jalali.ts
- `guest()` --calls--> `getOrCreateInstallation()`  [EXTRACTED]
  tests/analytics.test.ts → src/analytics/installation.ts
- `mk()` --calls--> `createTracker()`  [EXTRACTED]
  tests/analytics.test.ts → src/analytics/tracker.ts
- `makeDeps()` --calls--> `parseForecast()`  [EXTRACTED]
  tests/weather.test.ts → src/weather/current/client.ts
- `AiDraftRecord` --references--> `Destination`  [EXTRACTED]
  src/admin/ai/drafts.ts → src/data/destinations.ts

## Import Cycles
- None detected.

## Communities (52 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (90): FormState, ManageTourOrganizers(), FormState, ManageTours(), AppChrome(), Props, svg, FavButton() (+82 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (60): AdminApp(), AdminLayout(), Props, Props, Sidebar(), Props, Topbar(), fileToDataUrl() (+52 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (54): react, react-dom, ASKED_KINDS, destMeta(), trackDestinationView(), tracker, trackFavorite(), trackRoute() (+46 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (39): DestinationForm(), levelOpts, Props, ratingOpts, AreaField(), CheckGroup(), lab(), lines() (+31 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (32): clearConsent(), CONSENT_KINDS, ConsentDecision, consentDecisions(), consentSummary(), kindsToAsk(), loadConsentRecords(), NO_CONSENT (+24 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (32): zod, DEFAULT_TEMPLATE, ENUMS_TEXT, REQUIRED_PLACEHOLDERS, SCHEMA_TEXT, validateTemplate(), AiService, AiSettings (+24 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (23): fastify, postgres, vitest, AppDeps, buildApp(), Config, loadConfig(), schema (+15 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (27): destName(), EVENT_LABEL, fmtDate(), Props, UserDetailView(), destName(), FilterForm(), fixBool() (+19 more)

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (26): Page, ProfileRecord, UserDetail, UserSummary, AccountState, alreadyMerged(), GuestBundle, mergeGuestIntoAccount() (+18 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (25): devDependencies, @types/node, @types/react, @types/react-dom, typescript, vite, @vitejs/plugin-react, vitest (+17 more)

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (24): auditEntry(), createDemoApi(), OfferDraft, ACTIVE_WINDOW_DAYS, AudienceCounts, DashboardStats, detailOf(), ENGAGEMENT_BANDS (+16 more)

### Community 11 - "Community 11"
Cohesion: 0.21
Nodes (22): renderPrompt(), braveSearch(), call(), Fetch, geminiGenerate(), httpsOnly(), ImageCandidate, pexelsImages() (+14 more)

### Community 12 - "Community 12"
Cohesion: 0.17
Nodes (21): EventDraft, EventForm(), Props, Actions(), Badge(), EventTable(), Props, Modal() (+13 more)

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (19): idbGet(), idbSet(), run(), addNotification(), AppNotification, commit(), items, listeners (+11 more)

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (18): SuggestionsPreview(), deg(), DestinationContent(), Props, locationLabel(), fromGregorian(), useSelectedDate(), DestinationDetails() (+10 more)

### Community 15 - "Community 15"
Cohesion: 0.20
Nodes (19): Calendar(), CalendarProps, LONG_PRESS_MS, DateHeader(), formatIn(), Chevron(), OccasionRow(), Props (+11 more)

### Community 17 - "Community 17"
Cohesion: 0.19
Nodes (15): Icon(), IconName, PATHS, Props, QuickAction(), Section(), Props, StatCard() (+7 more)

### Community 18 - "Community 18"
Cohesion: 0.15
Nodes (16): AiDraftRecord, ApprovalCheck, arr(), buildPrompt(), checkApproval(), draftRepo, isHttpOrPath(), LEVELS (+8 more)

### Community 19 - "Community 19"
Cohesion: 0.21
Nodes (15): SEED_COORDINATES, finiteOrNull(), WeatherError, buildArchiveUrl(), DAILY_VARS, fetchArchive(), historyRange(), parseArchive() (+7 more)

### Community 20 - "Community 20"
Cohesion: 0.18
Nodes (13): Base, BUDGETS, COMPANIONS, Derived, DestinationInput, DURATIONS, LEVEL_LABEL, make() (+5 more)

### Community 21 - "Community 21"
Cohesion: 0.20
Nodes (15): ALL, applyFilters(), BUDGET_OPTIONS, COMPANION_OPTIONS, DURATION_OPTIONS, isActive(), LABELS, normalize() (+7 more)

### Community 22 - "Community 22"
Cohesion: 0.13
Nodes (6): walk(), bundles, dir, files, out, root

### Community 23 - "Community 23"
Cohesion: 0.17
Nodes (12): memoryKV(), notConnectedTransport, OUTBOX_MAX, Transport, account(), data, ev(), guest() (+4 more)

### Community 24 - "Community 24"
Cohesion: 0.16
Nodes (14): buildDemoProfiles(), CITIES, NAMES, rng(), SEASONS, TYPES, computeInterests(), DEFAULT_WEIGHTS (+6 more)

### Community 25 - "Community 25"
Cohesion: 0.23
Nodes (12): useNotes(), getSelectedDate(), listeners, setSelectedDate(), subscribeSelectedDate(), listeners, Settings, showAncientCelebrations() (+4 more)

### Community 26 - "Community 26"
Cohesion: 0.28
Nodes (12): SeasonClimate, MAX_PER_SECTION, recommend(), HUMID, isExtreme(), isSeasonSuitable(), RAIN, rainHumidityScore() (+4 more)

### Community 27 - "Community 27"
Cohesion: 0.23
Nodes (12): CalendarData, DEFAULT, initCalendarData(), isValid(), listeners, Occasion, publish(), refresh() (+4 more)

### Community 29 - "Community 29"
Cohesion: 0.30
Nodes (12): Status, SuggestionContent, createJsonStore(), empty(), State, AiMeta, ImageRow, ImageStatus (+4 more)

### Community 30 - "Community 30"
Cohesion: 0.20
Nodes (11): createSecrets(), get(), decrypt(), encrypt(), ENV_VAR, keyBytes(), kvKey(), SECRET_NAMES (+3 more)

### Community 31 - "Community 31"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, lib, module, moduleResolution, outDir, rootDir, skipLibCheck (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.20
Nodes (12): Badge(), DetailsButton(), Props, UserTable(), DEFAULT_USER_FILTERS, filterUsers(), MOCK_USERS, normalize() (+4 more)

### Community 33 - "Community 33"
Cohesion: 0.27
Nodes (11): trackSeason(), Props, DestinationCard(), getSaved(), Saved, saveState(), TravelSuggestions(), activeFilterCount() (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (10): fmt, msUntilNextMinute(), useNow(), createWeatherStore(), fetchFor(), run(), Pos, sample (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.29
Nodes (9): Column, DataTable(), FormState, ManageDestinations(), SeasonalRecommendations(), Destination, matchesQuery(), destinationRepo (+1 more)

### Community 36 - "Community 36"
Cohesion: 0.28
Nodes (10): Body(), NotePopup(), Props, JalaliDate, getNote(), listeners, noteKey(), notes (+2 more)

### Community 37 - "Community 37"
Cohesion: 0.23
Nodes (10): browserDeps, Coords, Persisted, POS_ERR, REFRESH_MS, WeatherDeps, WeatherState, weatherStore (+2 more)

### Community 38 - "Community 38"
Cohesion: 0.26
Nodes (11): Acc, add(), analyzeSeries(), avg(), finish(), newAcc(), RAINY_DAY_MM, round1() (+3 more)

### Community 39 - "Community 39"
Cohesion: 0.15
Nodes (12): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, resolveJsonModule (+4 more)

### Community 40 - "Community 40"
Cohesion: 0.18
Nodes (11): dependencies, fastify, @fastify/rate-limit, @fastify/static, jalaali-js, postgres, react, react-dom (+3 more)

### Community 41 - "Community 41"
Cohesion: 0.31
Nodes (9): common, Props, SeasonIcon(), SeasonPicker(), Season, SeasonKey, RecommendResult, SeasonInfo (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.33
Nodes (9): deg(), ERROR_TEXT, WeatherCard(), formatClock(), TEXT, weatherCodeText(), WeatherIconName, useCurrentWeather() (+1 more)

### Community 43 - "Community 43"
Cohesion: 0.20
Nodes (10): scripts, build, build:server, dev, dev:server, preview, start, start:api (+2 more)

### Community 44 - "Community 44"
Cohesion: 0.31
Nodes (8): ParsedDate, parseJalaliInput(), toLatinDigits(), toPersianDigits(), Props, TripDate(), monthLength(), shiftMonth()

### Community 45 - "Community 45"
Cohesion: 0.25
Nodes (5): AiGenerator, AiUnavailableError, createRemoteAiGenerator(), req(), ImageResult

### Community 46 - "Community 46"
Cohesion: 0.29
Nodes (6): build, buildCommand, deploy, healthcheckPath, startCommand, $schema

### Community 47 - "Community 47"
Cohesion: 0.43
Nodes (5): buildForecastUrl(), fetchForecast(), first(), parseForecast(), makeDeps()

### Community 49 - "Community 49"
Cohesion: 0.60
Nodes (5): buildGeocodeUrl(), keyOf(), read(), reverseGeocode(), roundCoord()

## Knowledge Gaps
- **228 isolated node(s):** `Props`, `Props`, `Seed`, `FormState`, `FormState` (+223 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 317 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`, `Community 7`, `Community 9`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 17`, `Community 21`, `Community 25`, `Community 27`, `Community 33`, `Community 34`, `Community 35`, `Community 36`, `Community 37`, `Community 42`?**
  _High betweenness centrality (0.364) - this node is a cross-community bridge._
- **Why does `fastify` connect `Community 6` to `Community 9`, `Community 5`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `faNum()` connect `Community 0` to `Community 1`, `Community 33`, `Community 7`, `Community 42`, `Community 44`, `Community 12`, `Community 14`, `Community 15`, `Community 13`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `Props`, `Props`, `Seed` to the rest of the system?**
  _228 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.051077089825226935 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07074504442925496 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0579476861167002 - nodes in this community are weakly interconnected._