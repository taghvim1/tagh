# Graph Report - tagh  (2026-10-15)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1312 nodes · 3769 edges · 62 communities (46 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `61657a0a`
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
- `guest()` --calls--> `getOrCreateInstallation()`  [EXTRACTED]
  tests/analytics.test.ts → src/analytics/installation.ts
- `mk()` --calls--> `createTracker()`  [EXTRACTED]
  tests/analytics.test.ts → src/analytics/tracker.ts
- `Props` --references--> `TourOrganizer`  [EXTRACTED]
  src/admin/components/OrganizerForm.tsx → src/tour-organizers/types.ts

## Import Cycles
- None detected.

## Communities (62 total, 16 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (78): tracker, trackRoute(), useAnalytics(), AdminApp, App(), Routes(), AppChrome(), Props (+70 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (72): react, AdminApp(), AdminLayout(), Props, Props, Sidebar(), Props, Topbar() (+64 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (52): ParsedDate, parseJalaliInput(), toLatinDigits(), toPersianDigits(), Calendar(), CalendarProps, LONG_PRESS_MS, Body() (+44 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (37): buildPrompt(), checkApproval(), AiGenerator, AiUnavailableError, createRemoteAiGenerator(), req(), ImageResult, buildPlan() (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (39): react-dom, startAutoFlush(), fmt, NotificationsPanel(), Props, CalendarData, DEFAULT, initCalendarData() (+31 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (40): ApprovalCheck, arr(), draftRepo, isHttpOrPath(), LEVELS, parseAiDestinations(), ParsedItem, ParseResult (+32 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (27): @electric-sql/pglite, @electric-sql/pglite-socket, fastify, postgres, vitest, AppDeps, buildApp(), Config (+19 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (32): auditEntry(), Permission, ROLE_PERMISSIONS, clearConsent(), CONSENT_KINDS, consentSummary(), DEFAULT_CONSENT, loadConsentRecords() (+24 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (33): zod, ENUMS_TEXT, EXTRA_RULES, REQUIRED_PLACEHOLDERS, validateTemplate(), activeTemplate(), AiService, imageQueriesFor() (+25 more)

### Community 9 - "Community 9"
Cohesion: 0.16
Nodes (33): faNum(), Arc(), Dialog(), iso2(), isoDay(), jalaliShort(), Sel, Sky() (+25 more)

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (26): DEFAULT_TEMPLATE, renderPrompt(), call(), Fetch, geminiGenerate(), geminiOnce(), httpsOnly(), ImageCandidate (+18 more)

### Community 11 - "Community 11"
Cohesion: 0.10
Nodes (24): destName(), EVENT_LABEL, fmtDate(), Props, UserDetailView(), destName(), FilterForm(), fixBool() (+16 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (24): SuggestionsPreview(), trackSeason(), Props, DestinationCard(), deg(), DestinationContent(), GalleryImage, ImageGallery() (+16 more)

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (26): Status, SuggestionContent, State, createPgStore(), image(), IMAGE_COLS, iso(), json() (+18 more)

### Community 14 - "Community 14"
Cohesion: 0.07
Nodes (27): devDependencies, @electric-sql/pglite, @electric-sql/pglite-socket, @types/node, @types/react, @types/react-dom, typescript, vite (+19 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (27): ProfileRecord, UserDetail, UserSummary, AccountState, alreadyMerged(), GuestBundle, mergeGuestIntoAccount(), mergeInner() (+19 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (24): assertCan(), ForbiddenError, ApiUnavailableError, createDemoApi(), OfferDraft, ACTIVE_WINDOW_DAYS, AudienceCounts, DashboardStats (+16 more)

### Community 17 - "Community 17"
Cohesion: 0.19
Nodes (23): DestinationForm(), AreaField(), CheckGroup(), lab(), lines(), num(), Opt, Row() (+15 more)

### Community 18 - "Community 18"
Cohesion: 0.16
Nodes (24): buildTourDayMap(), useTourDays(), addDays(), ALL, BUDGET_OPTIONS, COMPANION_OPTIONS, DATE_OPTIONS, dateFmt (+16 more)

### Community 19 - "Community 19"
Cohesion: 0.10
Nodes (15): walk(), bundles, dir, files, out, root, SCHEMA_TEXT, addApprovedImage() (+7 more)

### Community 20 - "Community 20"
Cohesion: 0.17
Nodes (21): EventDraft, EventForm(), Props, Actions(), Badge(), EventTable(), Props, Modal() (+13 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (19): SEED_COORDINATES, WeatherError, FORECAST_DAYS, buildArchiveUrl(), DAILY_VARS, fetchArchive(), historyRange(), parseArchive() (+11 more)

### Community 23 - "Community 23"
Cohesion: 0.19
Nodes (15): Icon(), IconName, PATHS, Props, QuickAction(), Section(), Props, StatCard() (+7 more)

### Community 24 - "Community 24"
Cohesion: 0.16
Nodes (17): AdvancedFilter(), ChipGroup(), Props, ALL, applyFilters(), BUDGET_OPTIONS, COMPANION_OPTIONS, DURATION_OPTIONS (+9 more)

### Community 25 - "Community 25"
Cohesion: 0.15
Nodes (14): deg(), ERROR_TEXT, WeatherCard(), fmt, formatClock(), msUntilNextMinute(), useNow(), TEXT (+6 more)

### Community 26 - "Community 26"
Cohesion: 0.20
Nodes (12): Column, DataTable(), FormState, ManageDestinations(), FormState, ManageTourOrganizers(), nextId(), seedOrganizers() (+4 more)

### Community 27 - "Community 27"
Cohesion: 0.16
Nodes (15): browserDeps, Coords, createWeatherStore(), fetchFor(), run(), Persisted, POS_ERR, REFRESH_MS (+7 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (13): AiDraftRecord, Props, Version, Props, Destination, RecommendResult, items, listeners (+5 more)

### Community 29 - "Community 29"
Cohesion: 0.16
Nodes (14): buildDemoProfiles(), CITIES, NAMES, rng(), SEASONS, TYPES, computeInterests(), DEFAULT_WEIGHTS (+6 more)

### Community 30 - "Community 30"
Cohesion: 0.20
Nodes (14): DateHeader(), formatIn(), fromGregorian(), MONTHS, WEEKDAYS, Acc, add(), analyzeSeries() (+6 more)

### Community 31 - "Community 31"
Cohesion: 0.26
Nodes (13): SeasonClimate, MAX_PER_SECTION, recommend(), HUMID, isExtreme(), isSeasonSuitable(), RAIN, rainHumidityScore() (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.28
Nodes (14): finiteOrNull(), buildAirQualityUrl(), buildForecastUrl(), col(), dayMeans(), fetchForecast(), first(), HOURLY_HOURS (+6 more)

### Community 33 - "Community 33"
Cohesion: 0.27
Nodes (12): Props, Seed, seedTours(), LegacyTour, migrateLegacyTours(), styleOf(), durationLabel(), tourDays() (+4 more)

### Community 34 - "Community 34"
Cohesion: 0.20
Nodes (11): createSecrets(), get(), decrypt(), encrypt(), ENV_VAR, keyBytes(), kvKey(), SECRET_NAMES (+3 more)

### Community 35 - "Community 35"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, lib, module, moduleResolution, outDir, rootDir, skipLibCheck (+5 more)

### Community 36 - "Community 36"
Cohesion: 0.20
Nodes (12): Badge(), DetailsButton(), Props, UserTable(), DEFAULT_USER_FILTERS, filterUsers(), MOCK_USERS, normalize() (+4 more)

### Community 37 - "Community 37"
Cohesion: 0.23
Nodes (6): SeasonalRecommendations(), createLocalRepository(), Repository, useRepository(), destinationRepo, useDestinations()

### Community 38 - "Community 38"
Cohesion: 0.20
Nodes (12): memoryKV(), safeKV(), notConnectedTransport, OUTBOX_MAX, account(), data, ev(), guest() (+4 more)

### Community 39 - "Community 39"
Cohesion: 0.15
Nodes (12): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, resolveJsonModule (+4 more)

### Community 40 - "Community 40"
Cohesion: 0.21
Nodes (8): createHttpTransport(), destMeta(), trackDestinationView(), trackFavorite(), BackendNotConnectedError, EventProps, Transport, MOCK_DESTINATIONS

### Community 41 - "Community 41"
Cohesion: 0.18
Nodes (11): dependencies, fastify, @fastify/rate-limit, @fastify/static, jalaali-js, postgres, react, react-dom (+3 more)

### Community 42 - "Community 42"
Cohesion: 0.20
Nodes (10): issuesOf(), consentCtx, consentSchema, envelope, EVENT_TYPES, eventRoutes(), eventSchema, int (+2 more)

### Community 43 - "Community 43"
Cohesion: 0.51
Nodes (9): FormState, ManageTours(), findOrganizer(), useOrganizers(), formatDate(), formatPrice(), TourDayPopup(), TourOne() (+1 more)

### Community 44 - "Community 44"
Cohesion: 0.20
Nodes (10): scripts, build, build:server, dev, dev:server, preview, start, start:api (+2 more)

### Community 45 - "Community 45"
Cohesion: 0.29
Nodes (6): build, buildCommand, deploy, healthcheckPath, startCommand, $schema

### Community 46 - "Community 46"
Cohesion: 0.60
Nodes (5): buildGeocodeUrl(), keyOf(), read(), reverseGeocode(), roundCoord()

## Knowledge Gaps
- **259 isolated node(s):** `Props`, `Store`, `Opened`, `Props`, `Props` (+254 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 367 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 1` to `Community 0`, `Community 2`, `Community 4`, `Community 5`, `Community 9`, `Community 11`, `Community 12`, `Community 14`, `Community 17`, `Community 18`, `Community 20`, `Community 23`, `Community 24`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 37`, `Community 40`, `Community 43`?**
  _High betweenness centrality (0.289) - this node is a cross-community bridge._
- **Why does `faNum()` connect `Community 9` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 11`, `Community 43`, `Community 12`, `Community 20`, `Community 25`, `Community 26`, `Community 30`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `vitest` connect `Community 6` to `Community 10`, `Community 19`, `Community 5`, `Community 14`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `Props`, `Store`, `Opened` to the rest of the system?**
  _259 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.052019044260271555 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05867665418227216 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08432539682539683 - nodes in this community are weakly interconnected._