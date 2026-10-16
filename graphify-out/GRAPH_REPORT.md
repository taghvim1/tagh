# Graph Report - tagh  (2026-10-15)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1313 nodes · 3774 edges · 66 communities (50 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2c735ed2`
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
- Community 51

## God Nodes (most connected - your core abstractions)
1. `faNum()` - 72 edges
2. `react` - 72 edges
3. `Store` - 36 edges
4. `CalendarPage()` - 29 edges
5. `Destination` - 28 edges
6. `fromGregorian()` - 27 edges
7. `WeatherPage()` - 26 edges
8. `TravelSuggestions()` - 24 edges
9. `useDarkMode()` - 23 edges
10. `Tour` - 22 edges

## Surprising Connections (you probably didn't know these)
- `makeDeps()` --calls--> `parseForecast()`  [EXTRACTED]
  tests/weather.test.ts → src/weather/current/client.ts
- `series()` --calls--> `fromGregorian()`  [EXTRACTED]
  tests/weather.test.ts → src/lib/jalali.ts
- `mk()` --calls--> `createTracker()`  [EXTRACTED]
  tests/analytics.test.ts → src/analytics/tracker.ts
- `MergeResult` --references--> `AccountMergeLog`  [EXTRACTED]
  src/analytics/merge.ts → src/analytics/types.ts
- `createAiService()` --indirect_call--> `dupKey()`  [INFERRED]
  server/src/ai/service.ts → server/src/domain/schema.ts

## Import Cycles
- None detected.

## Communities (66 total, 16 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (84): Column, DataTable(), DestinationForm(), AreaField(), CheckGroup(), lab(), lines(), num() (+76 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (75): AdminApp(), draftRepo, AdminLayout(), Props, Props, Sidebar(), Props, Topbar() (+67 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (63): ParsedDate, parseJalaliInput(), toLatinDigits(), toPersianDigits(), Calendar(), CalendarProps, LONG_PRESS_MS, DateHeader() (+55 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (38): buildPlan(), DATE_TAG, disableDateNotification(), enableDateNotification(), EnableResult, ensureTitleScript(), notificationState(), PlanDay (+30 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (27): @electric-sql/pglite, @electric-sql/pglite-socket, fastify, postgres, vitest, AppDeps, buildApp(), Config (+19 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (33): zod, ENUMS_TEXT, EXTRA_RULES, REQUIRED_PLACEHOLDERS, validateTemplate(), activeTemplate(), AiService, imageQueriesFor() (+25 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (29): clearConsent(), CONSENT_KINDS, consentSummary(), DEFAULT_CONSENT, loadConsentRecords(), NO_CONSENT, POLICY_VERSION, recordConsent() (+21 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (26): auditEntry(), ApiUnavailableError, createDemoApi(), OfferDraft, UsersApi, Page, ACTIVE_WINDOW_DAYS, AudienceCounts (+18 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (31): buildDemoProfiles(), CITIES, NAMES, rng(), SEASONS, TYPES, ProfileRecord, UserDetail (+23 more)

### Community 9 - "Community 9"
Cohesion: 0.16
Nodes (32): fromGregorian(), Arc(), Dialog(), iso2(), isoDay(), jalaliShort(), Sel, Sky() (+24 more)

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (26): DEFAULT_TEMPLATE, renderPrompt(), call(), Fetch, geminiGenerate(), geminiOnce(), httpsOnly(), ImageCandidate (+18 more)

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (26): Status, SuggestionContent, State, createPgStore(), image(), IMAGE_COLS, iso(), json() (+18 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (26): destName(), EVENT_LABEL, fmtDate(), Props, UserDetailView(), destName(), FilterForm(), fixBool() (+18 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (27): devDependencies, @electric-sql/pglite, @electric-sql/pglite-socket, @types/node, @types/react, @types/react-dom, typescript, vite (+19 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (25): CalendarData, DEFAULT, initCalendarData(), isValid(), listeners, Occasion, publish(), refresh() (+17 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (21): SEED_COORDINATES, TEXT, WeatherError, FORECAST_DAYS, buildArchiveUrl(), DAILY_VARS, fetchArchive(), historyRange() (+13 more)

### Community 16 - "Community 16"
Cohesion: 0.10
Nodes (15): walk(), bundles, dir, files, out, root, SCHEMA_TEXT, addApprovedImage() (+7 more)

### Community 18 - "Community 18"
Cohesion: 0.17
Nodes (20): Props, getSaved(), Saved, saveState(), activeFilterCount(), ALL, BUDGET_OPTIONS, COMPANION_OPTIONS (+12 more)

### Community 19 - "Community 19"
Cohesion: 0.19
Nodes (19): EventDraft, EventForm(), Props, Actions(), Badge(), EventTable(), Props, DEFAULT_FILTERS (+11 more)

### Community 20 - "Community 20"
Cohesion: 0.18
Nodes (19): DestinationDraft, SeasonClimate, SeasonKey, applyFilters(), MAX_PER_SECTION, recommend(), seasonKey(), HUMID (+11 more)

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (14): react-dom, createHttpTransport(), destMeta(), startAutoFlush(), trackDestinationView(), tracker, trackSeason(), useAnalytics() (+6 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (16): levelOpts, ratingOpts, SeasonalRecommendations(), Base, BUDGETS, COMPANIONS, Derived, DestinationInput (+8 more)

### Community 23 - "Community 23"
Cohesion: 0.13
Nodes (17): deg(), ERROR_TEXT, WeatherCard(), fmt, formatClock(), msUntilNextMinute(), useNow(), NotifWeather (+9 more)

### Community 24 - "Community 24"
Cohesion: 0.19
Nodes (15): AiDraftRecord, Props, deg(), DestinationContent(), Props, GalleryImage, ImageGallery(), common (+7 more)

### Community 25 - "Community 25"
Cohesion: 0.16
Nodes (17): AppChrome(), Props, svg, Drawer(), Icon(), fmt, NotificationsPanel(), Props (+9 more)

### Community 26 - "Community 26"
Cohesion: 0.21
Nodes (12): react, AdvancedFilter(), CenterModal(), Props, ChipGroup(), Props, ICONS, Props (+4 more)

### Community 27 - "Community 27"
Cohesion: 0.19
Nodes (15): ApprovalCheck, arr(), isHttpOrPath(), LEVELS, parseAiDestinations(), ParsedItem, ParseResult, RATINGS (+7 more)

### Community 28 - "Community 28"
Cohesion: 0.24
Nodes (12): Icon(), IconName, PATHS, Props, QuickAction(), Section(), Props, StatCard() (+4 more)

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (14): browserDeps, Coords, createWeatherStore(), fetchFor(), run(), Persisted, POS_ERR, REFRESH_MS (+6 more)

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (9): buildPrompt(), checkApproval(), AiGenerator, AiUnavailableError, createRemoteAiGenerator(), req(), ImageResult, item() (+1 more)

### Community 31 - "Community 31"
Cohesion: 0.19
Nodes (13): memoryKV(), safeKV(), getOrCreateInstallation(), notConnectedTransport, OUTBOX_MAX, account(), data, ev() (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.20
Nodes (12): trackRoute(), AdminApp, App(), Routes(), box, lazyWithRetry(), reload(), RouteBoundary (+4 more)

### Community 33 - "Community 33"
Cohesion: 0.29
Nodes (12): useThemeColorMeta(), TourDetails(), Tours(), findOrganizer(), useOrganizers(), activeTourFilterCount(), selectTours(), tourSeason() (+4 more)

### Community 34 - "Community 34"
Cohesion: 0.28
Nodes (14): finiteOrNull(), buildAirQualityUrl(), buildForecastUrl(), col(), dayMeans(), fetchForecast(), first(), HOURLY_HOURS (+6 more)

### Community 35 - "Community 35"
Cohesion: 0.31
Nodes (13): SuggestionsPreview(), DestinationCard(), SeasonIcon(), SeasonPicker(), useSelectedDate(), useDarkMode(), DestinationDetails(), Favorites() (+5 more)

### Community 36 - "Community 36"
Cohesion: 0.20
Nodes (11): createSecrets(), get(), decrypt(), encrypt(), ENV_VAR, keyBytes(), kvKey(), SECRET_NAMES (+3 more)

### Community 37 - "Community 37"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, lib, module, moduleResolution, outDir, rootDir, skipLibCheck (+5 more)

### Community 38 - "Community 38"
Cohesion: 0.20
Nodes (12): Badge(), DetailsButton(), Props, UserTable(), DEFAULT_USER_FILTERS, filterUsers(), MOCK_USERS, normalize() (+4 more)

### Community 39 - "Community 39"
Cohesion: 0.23
Nodes (10): SeasonDraft, Level, Rating, items, listeners, subscribe(), useRemote(), PublicSuggestion (+2 more)

### Community 40 - "Community 40"
Cohesion: 0.15
Nodes (12): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, resolveJsonModule (+4 more)

### Community 41 - "Community 41"
Cohesion: 0.27
Nodes (8): trackFavorite(), FavButton(), FavoriteKind, listeners, Store, subscribe(), toggleFavorite(), useFavorites()

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (11): dependencies, fastify, @fastify/rate-limit, @fastify/static, jalaali-js, postgres, react, react-dom (+3 more)

### Community 43 - "Community 43"
Cohesion: 0.20
Nodes (10): issuesOf(), consentCtx, consentSchema, envelope, EVENT_TYPES, eventRoutes(), eventSchema, int (+2 more)

### Community 44 - "Community 44"
Cohesion: 0.31
Nodes (10): nowISO(), alreadyMerged(), GuestBundle, mergeGuestIntoAccount(), mergeInner(), MergeInput, MergeResult, uniq() (+2 more)

### Community 45 - "Community 45"
Cohesion: 0.20
Nodes (10): scripts, build, build:server, dev, dev:server, preview, start, start:api (+2 more)

### Community 46 - "Community 46"
Cohesion: 0.33
Nodes (9): Acc, add(), analyzeSeries(), avg(), finish(), newAcc(), RAINY_DAY_MM, round1() (+1 more)

### Community 47 - "Community 47"
Cohesion: 0.29
Nodes (6): build, buildCommand, deploy, healthcheckPath, startCommand, $schema

### Community 48 - "Community 48"
Cohesion: 0.73
Nodes (5): overlayActive(), popOverlay(), pushOverlay(), stateOf(), useOverlay()

### Community 49 - "Community 49"
Cohesion: 0.60
Nodes (5): buildGeocodeUrl(), keyOf(), read(), reverseGeocode(), roundCoord()

### Community 51 - "Community 51"
Cohesion: 0.67
Nodes (3): INITIAL, Settings(), Switch()

## Knowledge Gaps
- **259 isolated node(s):** `Column`, `Opt`, `Props`, `FormState`, `FormState` (+254 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 367 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 26` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 9`, `Community 12`, `Community 13`, `Community 14`, `Community 18`, `Community 19`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 25`, `Community 28`, `Community 29`, `Community 32`, `Community 33`, `Community 35`, `Community 39`, `Community 41`, `Community 48`, `Community 51`?**
  _High betweenness centrality (0.299) - this node is a cross-community bridge._
- **Why does `faNum()` connect `Community 2` to `Community 0`, `Community 1`, `Community 33`, `Community 35`, `Community 9`, `Community 12`, `Community 14`, `Community 18`, `Community 19`, `Community 23`, `Community 24`, `Community 25`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `vitest` connect `Community 4` to `Community 16`, `Community 10`, `Community 13`, `Community 22`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `Column`, `Opt`, `Props` to the rest of the system?**
  _259 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05246523388116309 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.055633473585787754 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08258408258408259 - nodes in this community are weakly interconnected._