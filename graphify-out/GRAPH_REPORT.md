# Graph Report - tagh  (2026-10-16)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1420 nodes · 4061 edges · 71 communities (54 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6d33d806`
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
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56

## God Nodes (most connected - your core abstractions)
1. `faNum()` - 76 edges
2. `react` - 75 edges
3. `Store` - 37 edges
4. `CalendarPage()` - 33 edges
5. `Destination` - 28 edges
6. `fromGregorian()` - 27 edges
7. `WeatherPage()` - 26 edges
8. `TravelSuggestions()` - 24 edges
9. `useDarkMode()` - 23 edges
10. `Tour` - 22 edges

## Surprising Connections (you probably didn't know these)
- `makeDeps()` --calls--> `parseForecast()`  [EXTRACTED]
  tests/weather.test.ts → src/weather/current/client.ts
- `guest()` --calls--> `getOrCreateInstallation()`  [EXTRACTED]
  tests/analytics.test.ts → src/analytics/installation.ts
- `mk()` --calls--> `createTracker()`  [EXTRACTED]
  tests/analytics.test.ts → src/analytics/tracker.ts
- `series()` --calls--> `fromGregorian()`  [EXTRACTED]
  tests/weather.test.ts → src/lib/jalali.ts
- `createAiService()` --indirect_call--> `dupKey()`  [INFERRED]
  server/src/ai/service.ts → server/src/domain/schema.ts

## Import Cycles
- None detected.

## Communities (71 total, 17 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (90): react, Calendar(), CalendarProps, LONG_PRESS_MS, CenterModal(), Props, DykTile(), FeedPopup() (+82 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (60): AppChrome(), Props, svg, Dock(), item(), Luggage(), Note(), Plane() (+52 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (41): buildPlan(), DATE_TAG, disableDateNotification(), enableDateNotification(), EnableResult, ensureTitleScript(), notificationState(), Plan (+33 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (38): ApprovalCheck, arr(), isHttpOrPath(), LEVELS, parseAiDestinations(), ParsedItem, ParseResult, RATINGS (+30 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (36): canFeedTransition(), FEED_KINDS, FEED_STATUSES, FEED_TRANSITIONS, FeedContent, feedContentSchema, feedGenSchema, FeedImage (+28 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (23): @electric-sql/pglite, @electric-sql/pglite-socket, postgres, vitest, walk(), bundles, dir, files (+15 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (32): clearConsent(), CONSENT_KINDS, consentSummary(), DEFAULT_CONSENT, loadConsentRecords(), NO_CONSENT, POLICY_VERSION, recordConsent() (+24 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (31): SEED_COORDINATES, TEXT, WeatherError, FORECAST_DAYS, Acc, add(), analyzeSeries(), avg() (+23 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (29): zod, validateTemplate(), AiService, imageQueriesFor(), AiSettings, aiSettingsSchema, DEFAULT_AI_SETTINGS, saveAiSettings() (+21 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (31): Status, SuggestionContent, State, createPgStore(), image(), IMAGE_COLS, iso(), json() (+23 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (28): DEFAULT_TEMPLATE, renderPrompt(), call(), Fetch, geminiGenerate(), geminiOnce(), httpsOnly(), ImageCandidate (+20 more)

### Community 11 - "Community 11"
Cohesion: 0.17
Nodes (32): faNum(), Arc(), Dialog(), iso2(), isoDay(), jalaliShort(), Sel, Sky() (+24 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (28): assertCan(), auditEntry(), ForbiddenError, Permission, ROLE_PERMISSIONS, ApiUnavailableError, createDemoApi(), OfferDraft (+20 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (22): fastify, AppDeps, buildApp(), loadConfig(), Db, eventRoutes(), feedPublicRoutes(), publicRoutes() (+14 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (25): EventDraft, EventForm(), Props, Actions(), Badge(), EventTable(), Props, Modal() (+17 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (21): destName(), EVENT_LABEL, fmtDate(), Props, UserDetailView(), destName(), FilterForm(), fixBool() (+13 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (25): trackDestinationView(), trackSeason(), AdvancedFilter(), Props, ChipGroup(), Props, getSaved(), Saved (+17 more)

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (26): ProfileRecord, UserDetail, UserSummary, AccountState, alreadyMerged(), GuestBundle, mergeGuestIntoAccount(), mergeInner() (+18 more)

### Community 18 - "Community 18"
Cohesion: 0.15
Nodes (21): AiDraftRecord, Props, SuggestionsPreview(), DestinationCard(), deg(), DestinationContent(), Props, GalleryImage (+13 more)

### Community 19 - "Community 19"
Cohesion: 0.20
Nodes (22): DestinationForm(), AreaField(), CheckGroup(), lab(), lines(), num(), Opt, Row() (+14 more)

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (19): subscribeSelectedDate(), useSelectedDate(), useDarkMode(), useThemeColorMeta(), DestinationDetails(), Favorites(), Opened, TourDetails() (+11 more)

### Community 21 - "Community 21"
Cohesion: 0.20
Nodes (20): Column, DataTable(), FormState, ManageDestinations(), ManageTourOrganizers(), FormState, ManageTours(), nextId() (+12 more)

### Community 22 - "Community 22"
Cohesion: 0.13
Nodes (21): fileToDataUrl(), MAX_IMAGE_BYTES, IMG_LABEL, AiMeta, ApiError, Detail, diffContent(), DiffLine (+13 more)

### Community 24 - "Community 24"
Cohesion: 0.15
Nodes (22): AdminFeedItem, factsToText(), FEED_STATUS_LABEL, FEED_TABS, FeedContent, FeedFact, FeedGenResponse, FeedGenResult (+14 more)

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (21): ApiSettings(), Name, SecretRow(), SECRETS, SetupChecklist(), STORAGE_MSG, WikimediaTest(), SuggestionDetail() (+13 more)

### Community 26 - "Community 26"
Cohesion: 0.15
Nodes (13): AdminApp(), AdminLayout(), Props, Props, Sidebar(), Props, Topbar(), ComingSoon() (+5 more)

### Community 27 - "Community 27"
Cohesion: 0.19
Nodes (15): Icon(), IconName, PATHS, Props, QuickAction(), Section(), Props, StatCard() (+7 more)

### Community 28 - "Community 28"
Cohesion: 0.18
Nodes (19): ALL, BUDGET_OPTIONS, COMPANION_OPTIONS, DATE_OPTIONS, dateFmt, DIFFICULTY_OPTIONS, DURATION_OPTIONS, EMPTY_TOUR_FILTERS (+11 more)

### Community 29 - "Community 29"
Cohesion: 0.16
Nodes (14): tracker, useAnalytics(), App(), Routes(), CONSENT_TEXT, box, lazyWithRetry(), reload() (+6 more)

### Community 30 - "Community 30"
Cohesion: 0.14
Nodes (15): ENUMS_TEXT, EXTRA_RULES, REQUIRED_PLACEHOLDERS, BUDGETS, COMPANIONS, contentSchema, DURATIONS, LEVELS (+7 more)

### Community 31 - "Community 31"
Cohesion: 0.16
Nodes (14): deg(), ERROR_TEXT, WeatherCard(), fmt, formatClock(), msUntilNextMinute(), useNow(), weatherCodeText() (+6 more)

### Community 32 - "Community 32"
Cohesion: 0.23
Nodes (15): applyFilters(), isActive(), MAX_PER_SECTION, recommend(), seasonKey(), HUMID, isExtreme(), isSeasonSuitable() (+7 more)

### Community 33 - "Community 33"
Cohesion: 0.16
Nodes (15): browserDeps, Coords, createWeatherStore(), fetchFor(), run(), Persisted, POS_ERR, REFRESH_MS (+7 more)

### Community 34 - "Community 34"
Cohesion: 0.12
Nodes (16): engines, node, name, private, type, version, @fastify/rate-limit, @fastify/static (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.19
Nodes (7): Props, FormState, createLocalRepository(), Repository, seedOrganizers(), organizerRepo, TourOrganizer

### Community 36 - "Community 36"
Cohesion: 0.16
Nodes (14): buildDemoProfiles(), CITIES, NAMES, rng(), SEASONS, TYPES, computeInterests(), DEFAULT_WEIGHTS (+6 more)

### Community 37 - "Community 37"
Cohesion: 0.28
Nodes (14): finiteOrNull(), buildAirQualityUrl(), buildForecastUrl(), col(), dayMeans(), fetchForecast(), first(), HOURLY_HOURS (+6 more)

### Community 38 - "Community 38"
Cohesion: 0.28
Nodes (12): Props, Seed, seedTours(), LegacyTour, migrateLegacyTours(), styleOf(), addDays(), durationLabel() (+4 more)

### Community 39 - "Community 39"
Cohesion: 0.19
Nodes (12): createRemoteApi(), req(), NotReadyError, memoryKV(), account(), data, ev(), guest() (+4 more)

### Community 40 - "Community 40"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, lib, module, moduleResolution, outDir, rootDir, skipLibCheck (+5 more)

### Community 41 - "Community 41"
Cohesion: 0.19
Nodes (9): buildPrompt(), checkApproval(), AiGenerator, AiUnavailableError, createRemoteAiGenerator(), req(), ImageResult, item() (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.20
Nodes (12): Badge(), DetailsButton(), Props, UserTable(), DEFAULT_USER_FILTERS, filterUsers(), MOCK_USERS, normalize() (+4 more)

### Community 43 - "Community 43"
Cohesion: 0.18
Nodes (9): createHttpTransport(), destMeta(), startAutoFlush(), trackFavorite(), trackRoute(), BackendNotConnectedError, EventProps, Transport (+1 more)

### Community 44 - "Community 44"
Cohesion: 0.15
Nodes (12): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, resolveJsonModule (+4 more)

### Community 45 - "Community 45"
Cohesion: 0.18
Nodes (11): dependencies, fastify, @fastify/rate-limit, @fastify/static, jalaali-js, postgres, react, react-dom (+3 more)

### Community 46 - "Community 46"
Cohesion: 0.25
Nodes (9): draftRepo, AiSuggestions(), BADGE, ListResp, SOURCE, STATUS_ORDER, Suggestion, Link() (+1 more)

### Community 47 - "Community 47"
Cohesion: 0.29
Nodes (7): FavButton(), FavoriteKind, listeners, Store, subscribe(), toggleFavorite(), useFavorites()

### Community 48 - "Community 48"
Cohesion: 0.20
Nodes (10): devDependencies, @electric-sql/pglite, @electric-sql/pglite-socket, @types/node, @types/react, @types/react-dom, typescript, vite (+2 more)

### Community 49 - "Community 49"
Cohesion: 0.20
Nodes (10): scripts, build, build:server, dev, dev:server, preview, start, start:api (+2 more)

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (8): consentCtx, consentSchema, envelope, EVENT_TYPES, eventSchema, int, iso, short

### Community 51 - "Community 51"
Cohesion: 0.31
Nodes (6): items, listeners, subscribe(), useRemote(), PublicSuggestion, REMOTE_ID_BASE

### Community 52 - "Community 52"
Cohesion: 0.29
Nodes (6): build, buildCommand, deploy, healthcheckPath, startCommand, $schema

### Community 53 - "Community 53"
Cohesion: 0.47
Nodes (5): DateHeader(), formatIn(), fromGregorian(), MONTHS, series()

### Community 54 - "Community 54"
Cohesion: 0.60
Nodes (5): buildGeocodeUrl(), keyOf(), read(), reverseGeocode(), roundCoord()

## Knowledge Gaps
- **280 isolated node(s):** `CalendarDay`, `Props`, `Props`, `HistoryState`, `LinkProps` (+275 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 394 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 11`, `Community 14`, `Community 15`, `Community 16`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 24`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 31`, `Community 33`, `Community 34`, `Community 35`, `Community 43`, `Community 46`, `Community 47`, `Community 51`?**
  _High betweenness centrality (0.271) - this node is a cross-community bridge._
- **Why does `faNum()` connect `Community 11` to `Community 0`, `Community 1`, `Community 35`, `Community 46`, `Community 14`, `Community 15`, `Community 16`, `Community 18`, `Community 20`, `Community 21`, `Community 22`, `Community 53`, `Community 24`, `Community 25`, `Community 31`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `vitest` connect `Community 5` to `Community 34`, `Community 3`, `Community 9`, `Community 10`, `Community 13`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **What connects `CalendarDay`, `Props`, `Props` to the rest of the system?**
  _280 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05123428039124359 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05261261261261261 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09143686502177069 - nodes in this community are weakly interconnected._