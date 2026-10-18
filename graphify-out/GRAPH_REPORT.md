# Graph Report - tagh  (2026-10-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1497 nodes · 4269 edges · 69 communities (53 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6324cb2a`
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

## God Nodes (most connected - your core abstractions)
1. `faNum()` - 80 edges
2. `react` - 75 edges
3. `Store` - 37 edges
4. `CalendarPage()` - 37 edges
5. `Destination` - 28 edges
6. `fromGregorian()` - 28 edges
7. `WeatherPage()` - 26 edges
8. `TravelSuggestions()` - 24 edges
9. `useDarkMode()` - 23 edges
10. `Tour` - 22 edges

## Surprising Connections (you probably didn't know these)
- `series()` --calls--> `fromGregorian()`  [EXTRACTED]
  tests/weather.test.ts → src/lib/jalali.ts
- `makeDeps()` --calls--> `parseForecast()`  [EXTRACTED]
  tests/weather.test.ts → src/weather/current/client.ts
- `mk()` --calls--> `createTracker()`  [EXTRACTED]
  tests/analytics.test.ts → src/analytics/tracker.ts
- `FeedSnapshot` --references--> `FeedKind`  [EXTRACTED]
  src/feed/remote.ts → src/feed/topics.ts
- `MergeResult` --references--> `AccountMergeLog`  [EXTRACTED]
  src/analytics/merge.ts → src/analytics/types.ts

## Import Cycles
- None detected.

## Communities (69 total, 16 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (85): Column, DataTable(), DestinationForm(), AreaField(), CheckGroup(), lab(), lines(), num() (+77 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (75): AdminFeedItem, factsToText(), FEED_STATUS_LABEL, FEED_TABS, FeedContent, FeedFact, FeedGenResponse, FeedGenResult (+67 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (58): ParsedDate, parseJalaliInput(), toLatinDigits(), toPersianDigits(), Calendar(), CalendarProps, LONG_PRESS_MS, DateHeader() (+50 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (39): clearConsent(), CONSENT_KINDS, consentSummary(), DEFAULT_CONSENT, loadConsentRecords(), NO_CONSENT, POLICY_VERSION, recordConsent() (+31 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (42): canFeedTransition(), FEED_KINDS, FEED_STATUSES, FEED_TRANSITIONS, FeedContent, feedContentSchema, feedGenSchema, FeedImage (+34 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (33): fastify, vitest, zod, SCHEMA_TEXT, AppDeps, buildApp(), Config, loadConfig() (+25 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (35): ENUMS_TEXT, EXTRA_RULES, REQUIRED_PLACEHOLDERS, validateTemplate(), activeTemplate(), AiService, imageQueriesFor(), AiSettings (+27 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (38): dependencies, fastify, @fastify/rate-limit, @fastify/static, jalaali-js, postgres, react, react-dom (+30 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (32): SEED_COORDINATES, TEXT, WeatherError, FORECAST_DAYS, Acc, add(), analyzeSeries(), avg() (+24 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (32): Status, SuggestionContent, createJsonStore(), empty(), State, createPgStore(), image(), IMAGE_COLS (+24 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (26): destName(), EVENT_LABEL, fmtDate(), Props, UserDetailView(), destName(), FilterForm(), fixBool() (+18 more)

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (28): DEFAULT_TEMPLATE, renderPrompt(), call(), Fetch, geminiGenerate(), geminiOnce(), httpsOnly(), ImageCandidate (+20 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (32): buildDemoProfiles(), CITIES, NAMES, rng(), SEASONS, TYPES, ProfileRecord, UserDetail (+24 more)

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (27): buildPlan(), DATE_TAG, disableDateNotification(), enableDateNotification(), EnableResult, ensureTitleScript(), notificationState(), Plan (+19 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (32): Arc(), Dialog(), iso2(), isoDay(), jalaliShort(), Sel, Sky(), Tile() (+24 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (26): auditEntry(), ApiUnavailableError, createDemoApi(), req(), OfferDraft, ACTIVE_WINDOW_DAYS, AudienceCounts, DashboardStats (+18 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (26): ApprovalCheck, arr(), draftRepo, isHttpOrPath(), LEVELS, parseAiDestinations(), ParsedItem, ParseResult (+18 more)

### Community 17 - "Community 17"
Cohesion: 0.17
Nodes (25): altitudes(), cos(), days(), fmtCache, J2000_MS, localDayStart(), localIso(), MOON_PHASE_FA (+17 more)

### Community 18 - "Community 18"
Cohesion: 0.10
Nodes (18): ANCIENT, buildYears(), classify(), cleanTitle(), INTERNATIONAL, keyOf(), KINDS, RELIGIOUS (+10 more)

### Community 19 - "Community 19"
Cohesion: 0.15
Nodes (22): EventDraft, EventForm(), Props, Actions(), Badge(), EventTable(), Props, buildEvents() (+14 more)

### Community 20 - "Community 20"
Cohesion: 0.10
Nodes (11): @electric-sql/pglite, @electric-sql/pglite-socket, postgres, walk(), bundles, dir, files, out (+3 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (20): Props, getSaved(), Saved, saveState(), activeFilterCount(), ALL, BUDGET_OPTIONS, COMPANION_OPTIONS (+12 more)

### Community 23 - "Community 23"
Cohesion: 0.23
Nodes (21): listeners, occasionPrefsKey(), put(), setAncientCelebrations(), setNationalDays(), setReligiousDays(), Settings, setWeatherCard() (+13 more)

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (15): react-dom, destMeta(), startAutoFlush(), trackDestinationView(), tracker, trackFavorite(), trackSeason(), EventProps (+7 more)

### Community 25 - "Community 25"
Cohesion: 0.16
Nodes (16): AiDraftRecord, Props, deg(), Props, GalleryImage, ImageGallery(), common, Props (+8 more)

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (19): DykTile(), FeedPopup(), svg, Thumb(), TileProps, TopicTile(), useTapGuard(), OccasionsPopup() (+11 more)

### Community 27 - "Community 27"
Cohesion: 0.19
Nodes (16): Icon(), IconName, PATHS, Props, QuickAction(), Props, Section(), Props (+8 more)

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (15): trackRoute(), useAnalytics(), AdminApp, App(), Routes(), CONSENT_TEXT, box, lazyWithRetry() (+7 more)

### Community 29 - "Community 29"
Cohesion: 0.14
Nodes (16): deg(), ERROR_TEXT, WeatherCard(), fmt, formatClock(), msUntilNextMinute(), useNow(), NotifWeather (+8 more)

### Community 30 - "Community 30"
Cohesion: 0.24
Nodes (15): INITIAL, Settings(), Switch(), useDarkMode(), TourDetails(), Tours(), findOrganizer(), useOrganizers() (+7 more)

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (16): AppChrome(), Props, svg, fmt, NotificationsPanel(), Props, useCalendarData(), addNotification() (+8 more)

### Community 32 - "Community 32"
Cohesion: 0.16
Nodes (19): DEFAULT, initCalendarData(), isValid(), listeners, Occasion, OccasionItem, OccasionKind, publish() (+11 more)

### Community 33 - "Community 33"
Cohesion: 0.19
Nodes (14): react, AdvancedFilter(), CenterModal(), Props, ChipGroup(), Props, Drawer(), Icon() (+6 more)

### Community 34 - "Community 34"
Cohesion: 0.31
Nodes (15): SuggestionsPreview(), DestinationCard(), DestinationContent(), fromGregorian(), listeners, subscribeSelectedDate(), useSelectedDate(), useThemeColorMeta() (+7 more)

### Community 35 - "Community 35"
Cohesion: 0.24
Nodes (15): SeasonClimate, applyFilters(), MAX_PER_SECTION, recommend(), seasonKey(), HUMID, isExtreme(), isSeasonSuitable() (+7 more)

### Community 36 - "Community 36"
Cohesion: 0.16
Nodes (15): browserDeps, Coords, createWeatherStore(), fetchFor(), run(), Persisted, POS_ERR, REFRESH_MS (+7 more)

### Community 37 - "Community 37"
Cohesion: 0.22
Nodes (13): SeasonDraft, Level, Rating, items, listeners, refreshRemoteSuggestions(), subscribe(), toRemoteDestinations() (+5 more)

### Community 38 - "Community 38"
Cohesion: 0.19
Nodes (13): memoryKV(), safeKV(), getOrCreateInstallation(), notConnectedTransport, OUTBOX_MAX, account(), data, ev() (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.22
Nodes (13): idbGet(), idbSet(), run(), entries, initHistoricalClimate(), listeners, loadFailures(), publish() (+5 more)

### Community 40 - "Community 40"
Cohesion: 0.28
Nodes (14): finiteOrNull(), buildAirQualityUrl(), buildForecastUrl(), col(), dayMeans(), fetchForecast(), first(), HOURLY_HOURS (+6 more)

### Community 41 - "Community 41"
Cohesion: 0.17
Nodes (10): buildPrompt(), checkApproval(), AiGenerator, AiUnavailableError, createRemoteAiGenerator(), req(), ImageResult, MOCK_DESTINATIONS (+2 more)

### Community 42 - "Community 42"
Cohesion: 0.20
Nodes (11): createSecrets(), get(), decrypt(), encrypt(), ENV_VAR, keyBytes(), kvKey(), SECRET_NAMES (+3 more)

### Community 43 - "Community 43"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, lib, module, moduleResolution, outDir, rootDir, skipLibCheck (+5 more)

### Community 44 - "Community 44"
Cohesion: 0.20
Nodes (12): Badge(), DetailsButton(), Props, UserTable(), DEFAULT_USER_FILTERS, filterUsers(), MOCK_USERS, normalize() (+4 more)

### Community 45 - "Community 45"
Cohesion: 0.22
Nodes (12): EMPTY, FeedSnapshot, http(), https(), listeners, read(), refreshFeed(), sanitizeFeed() (+4 more)

### Community 46 - "Community 46"
Cohesion: 0.15
Nodes (12): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, resolveJsonModule (+4 more)

### Community 47 - "Community 47"
Cohesion: 0.23
Nodes (8): SeasonalRecommendations(), Base, Derived, DestinationInput, make(), mode(), R, withDerived()

### Community 48 - "Community 48"
Cohesion: 0.18
Nodes (11): scripts, build, build:server, dev, dev:server, import:holidays, preview, start (+3 more)

### Community 49 - "Community 49"
Cohesion: 0.35
Nodes (10): BackLink(), current(), getPath(), goBack(), HistoryState, initHistory(), LinkProps, navigate() (+2 more)

### Community 50 - "Community 50"
Cohesion: 0.31
Nodes (5): AdminApp(), ComingSoon(), ADMIN_ROUTES, FEED_KINDS, FEED_TITLE

### Community 51 - "Community 51"
Cohesion: 0.33
Nodes (6): AdminLayout(), Props, Props, Sidebar(), Props, Topbar()

### Community 52 - "Community 52"
Cohesion: 0.29
Nodes (6): build, buildCommand, deploy, healthcheckPath, startCommand, $schema

### Community 53 - "Community 53"
Cohesion: 0.60
Nodes (5): buildGeocodeUrl(), keyOf(), read(), reverseGeocode(), roundCoord()

## Knowledge Gaps
- **304 isolated node(s):** `Props`, `Opt`, `TourResult`, `Column`, `FormState` (+299 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 418 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 33` to `Community 0`, `Community 1`, `Community 2`, `Community 7`, `Community 10`, `Community 14`, `Community 16`, `Community 19`, `Community 22`, `Community 23`, `Community 24`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 31`, `Community 32`, `Community 34`, `Community 36`, `Community 37`, `Community 39`, `Community 45`, `Community 47`, `Community 49`, `Community 50`, `Community 51`?**
  _High betweenness centrality (0.305) - this node is a cross-community bridge._
- **Why does `faNum()` connect `Community 1` to `Community 0`, `Community 2`, `Community 34`, `Community 39`, `Community 10`, `Community 14`, `Community 19`, `Community 22`, `Community 25`, `Community 26`, `Community 27`, `Community 29`, `Community 30`, `Community 31`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `Store` connect `Community 21` to `Community 4`, `Community 5`, `Community 6`, `Community 9`, `Community 42`, `Community 11`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `Props`, `Opt`, `TourResult` to the rest of the system?**
  _304 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05170004657661854 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0640218878248974 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0772635814889336 - nodes in this community are weakly interconnected._