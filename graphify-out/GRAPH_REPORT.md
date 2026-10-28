# Graph Report - tagh  (2026-10-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1846 nodes · 5277 edges · 82 communities (67 shown, 15 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b76e7b13`
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
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67

## God Nodes (most connected - your core abstractions)
1. `faNum()` - 94 edges
2. `react` - 88 edges
3. `Store` - 42 edges
4. `CalendarPage()` - 36 edges
5. `useDarkMode()` - 31 edges
6. `buildApp()` - 29 edges
7. `useThemeColorMeta()` - 29 edges
8. `Destination` - 28 edges
9. `fromGregorian()` - 28 edges
10. `useOverlay()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `makeDeps()` --calls--> `parseForecast()`  [EXTRACTED]
  tests/weather.test.ts → src/weather/current/client.ts
- `guest()` --calls--> `memoryKV()`  [EXTRACTED]
  tests/analytics.test.ts → src/analytics/ids.ts
- `guest()` --calls--> `getOrCreateInstallation()`  [EXTRACTED]
  tests/analytics.test.ts → src/analytics/installation.ts
- `series()` --calls--> `fromGregorian()`  [EXTRACTED]
  tests/weather.test.ts → src/lib/jalali.ts
- `Props` --references--> `Season`  [EXTRACTED]
  src/components/SeasonPicker.tsx → src/data/destinations.ts

## Import Cycles
- None detected.

## Communities (82 total, 15 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (91): Column, DataTable(), DestinationForm(), AreaField(), CheckGroup(), lab(), lines(), num() (+83 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (73): ParsedDate, parseJalaliInput(), toLatinDigits(), toPersianDigits(), Calendar(), CalendarProps, LONG_PRESS_MS, DykTile() (+65 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (69): BASE, ChecklistCategory, ChecklistItem, COLOR_HUES, DOCS, ELEC, HEALTH, IconKey (+61 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (41): EMPTY, http(), https(), listeners, read(), refreshFeed(), sanitizeFeed(), snap (+33 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (40): AiService, bookingFor(), BY_VEHICLE, FLIGHT, STAY, DEFAULT_PACKAGE_PROMPT, PACKAGE_REQUIRED, PACKAGE_SCHEMA_TEXT (+32 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (38): AppDeps, BY_CODE, createGhasedak(), call(), fail(), Ghasedak, GhasedakDeps, SMS_ERROR_FA (+30 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (34): clearConsent(), CONSENT_KINDS, consentSummary(), DEFAULT_CONSENT, loadConsentRecords(), NO_CONSENT, POLICY_VERSION, recordConsent() (+26 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (36): canFeedTransition(), FEED_KINDS, FEED_STATUSES, FEED_TRANSITIONS, FeedContent, feedContentSchema, feedGenSchema, FeedImage (+28 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (33): fileToDataUrl(), MAX_IMAGE_BYTES, Name, SECRETS, STORAGE_MSG, IMG_LABEL, BADGE, ListResp (+25 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (34): Status, SuggestionContent, consentCtx, consentSchema, envelope, EVENT_TYPES, eventSchema, int (+26 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (32): AuthProfile, AuthState, AuthUser, cached, getAuth(), getInstallId(), http(), listeners (+24 more)

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (35): faNum(), MONTHS, WEEKDAYS, Arc(), Dialog(), iso2(), isoDay(), jalaliShort() (+27 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (25): fastify, vitest, buildApp(), loadConfig(), schema, createMicroCache(), sendCacheable(), eventRoutes() (+17 more)

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (34): Modal(), AiSuggestions(), ApiSettings(), SecretRow(), SetupChecklist(), WikimediaTest(), FeedAdmin(), FeedCard() (+26 more)

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (27): destName(), EVENT_LABEL, fmtDate(), Props, UserDetailView(), LOG_FA, Real, Row() (+19 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (28): DEFAULT_TEMPLATE, renderPrompt(), call(), Fetch, geminiGenerate(), geminiOnce(), httpsOnly(), ImageCandidate (+20 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (27): buildPlan(), DATE_TAG, disableDateNotification(), enableDateNotification(), EnableResult, ensureTitleScript(), notificationState(), Plan (+19 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (28): AiDraftRecord, levelOpts, Props, ratingOpts, blankSeason(), DestinationDraft, DraftResult, SeasonDraft (+20 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (30): trackSeason(), AdvancedFilter(), Props, ChipGroup(), Props, Props, Season, getSaved() (+22 more)

### Community 19 - "Community 19"
Cohesion: 0.07
Nodes (24): engines, node, name, private, type, version, @electric-sql/pglite, @electric-sql/pglite-socket (+16 more)

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (27): assertCan(), auditEntry(), ForbiddenError, Permission, ROLE_PERMISSIONS, createDemoApi(), OfferDraft, ACTIVE_WINDOW_DAYS (+19 more)

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (27): b64(), BUDGETS, fetchJob(), JobState, json(), preparePush(), PushSubJSON, StartOutcome (+19 more)

### Community 22 - "Community 22"
Cohesion: 0.13
Nodes (23): SEED_COORDINATES, TEXT, WeatherError, FORECAST_DAYS, buildArchiveUrl(), DAILY_VARS, fetchArchive(), historyRange() (+15 more)

### Community 23 - "Community 23"
Cohesion: 0.13
Nodes (24): EventDraft, EventForm(), Props, Actions(), Badge(), EventTable(), Props, buildEvents() (+16 more)

### Community 24 - "Community 24"
Cohesion: 0.19
Nodes (26): visible(), listeners, occasionPrefsKey(), put(), setAncientCelebrations(), setNationalDays(), setReligiousDays(), Settings (+18 more)

### Community 25 - "Community 25"
Cohesion: 0.11
Nodes (21): ApprovalCheck, arr(), buildPrompt(), checkApproval(), draftRepo, isHttpOrPath(), LEVELS, parseAiDestinations() (+13 more)

### Community 26 - "Community 26"
Cohesion: 0.10
Nodes (23): buildDemoProfiles(), CITIES, NAMES, rng(), SEASONS, TYPES, computeInterests(), DEFAULT_WEIGHTS (+15 more)

### Community 27 - "Community 27"
Cohesion: 0.17
Nodes (24): ProfileRecord, UserDetail, UserSummary, AccountState, alreadyMerged(), GuestBundle, mergeGuestIntoAccount(), mergeInner() (+16 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (18): SuggestionsPreview(), DestinationCard(), deg(), DestinationContent(), GalleryImage, ImageGallery(), locationLabel(), useSelectedDate() (+10 more)

### Community 29 - "Community 29"
Cohesion: 0.14
Nodes (22): zod, validateTemplate(), activeTemplate(), AiSettings, aiSettingsSchema, DEFAULT_AI_SETTINGS, saveAiSettings(), canTransition() (+14 more)

### Community 31 - "Community 31"
Cohesion: 0.15
Nodes (19): Icon(), IconName, PATHS, Props, QuickAction(), Props, Section(), Props (+11 more)

### Community 32 - "Community 32"
Cohesion: 0.14
Nodes (21): Props, AdminFeedItem, factsToText(), FEED_STATUS_LABEL, FEED_TABS, FeedContent, FeedFact, FeedGenResponse (+13 more)

### Community 33 - "Community 33"
Cohesion: 0.15
Nodes (14): react, AdminApp(), AdminLayout(), Props, Props, Sidebar(), Props, Topbar() (+6 more)

### Community 34 - "Community 34"
Cohesion: 0.16
Nodes (16): react-dom, idbGet(), idbSet(), run(), addNotification(), registerServiceWorker(), entries, initHistoricalClimate() (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.14
Nodes (12): walk(), createJsonStore(), empty(), bodies, Call, mk(), Responder, content() (+4 more)

### Community 36 - "Community 36"
Cohesion: 0.14
Nodes (16): deg(), ERROR_TEXT, WeatherCard(), fmt, formatClock(), msUntilNextMinute(), useNow(), NotifWeather (+8 more)

### Community 37 - "Community 37"
Cohesion: 0.13
Nodes (16): ENUMS_TEXT, EXTRA_RULES, REQUIRED_PLACEHOLDERS, SCHEMA_TEXT, BUDGETS, COMPANIONS, contentSchema, DURATIONS (+8 more)

### Community 38 - "Community 38"
Cohesion: 0.16
Nodes (13): web-push, createPusher(), Pusher, createSecrets(), get(), decrypt(), encrypt(), ENV_VAR (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.19
Nodes (15): Dock(), item(), Luggage(), Note(), Plane(), svg, ICONS, Props (+7 more)

### Community 40 - "Community 40"
Cohesion: 0.14
Nodes (15): ANCIENT, buildYears(), classify(), cleanTitle(), INTERNATIONAL, keyOf(), KINDS, RELIGIOUS (+7 more)

### Community 41 - "Community 41"
Cohesion: 0.27
Nodes (17): DIGITS, maskPhone(), normalizeIranMobile(), toLatinDigits(), createAuthService(), deleteAccount(), deleteAccountById(), loadSettings() (+9 more)

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (14): trackRoute(), AdminApp, App(), Routes(), registerInstallation(), box, lazyWithRetry(), reload() (+6 more)

### Community 43 - "Community 43"
Cohesion: 0.24
Nodes (15): SeasonClimate, applyFilters(), MAX_PER_SECTION, recommend(), seasonKey(), HUMID, isExtreme(), isSeasonSuitable() (+7 more)

### Community 44 - "Community 44"
Cohesion: 0.16
Nodes (15): browserDeps, Coords, createWeatherStore(), fetchFor(), run(), Persisted, POS_ERR, REFRESH_MS (+7 more)

### Community 45 - "Community 45"
Cohesion: 0.18
Nodes (13): createRegistry(), flush(), schedule(), tx(), LogType, Person, ProfileInput, listQuery (+5 more)

### Community 46 - "Community 46"
Cohesion: 0.18
Nodes (15): DEFAULT, initCalendarData(), isValid(), KIND_LABEL, listeners, Occasion, OccasionItem, OccasionKind (+7 more)

### Community 47 - "Community 47"
Cohesion: 0.28
Nodes (14): finiteOrNull(), buildAirQualityUrl(), buildForecastUrl(), col(), dayMeans(), fetchForecast(), first(), HOURLY_HOURS (+6 more)

### Community 48 - "Community 48"
Cohesion: 0.14
Nodes (14): dependencies, fastify, @fastify/compress, @fastify/rate-limit, @fastify/static, jalaali-js, postgres, react (+6 more)

### Community 49 - "Community 49"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, lib, module, moduleResolution, outDir, rootDir, skipLibCheck (+5 more)

### Community 50 - "Community 50"
Cohesion: 0.20
Nodes (12): Badge(), DetailsButton(), Props, UserTable(), DEFAULT_USER_FILTERS, filterUsers(), MOCK_USERS, normalize() (+4 more)

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (10): destMeta(), trackDestinationView(), trackFavorite(), FavButton(), FavoriteKind, listeners, Store, subscribe() (+2 more)

### Community 52 - "Community 52"
Cohesion: 0.27
Nodes (10): tracker, useAnalytics(), deleteAccount(), CONSENT_TEXT, useDarkMode(), useThemeColorMeta(), Perm, PrivacyPage() (+2 more)

### Community 53 - "Community 53"
Cohesion: 0.24
Nodes (12): DateHeader(), formatIn(), fromGregorian(), Acc, add(), analyzeSeries(), avg(), finish() (+4 more)

### Community 54 - "Community 54"
Cohesion: 0.22
Nodes (10): commit(), isPackageSaved(), list, listeners, removePackage(), savePackage(), subscribe(), useSavedPackages() (+2 more)

### Community 55 - "Community 55"
Cohesion: 0.23
Nodes (11): Cost(), money(), PackageView(), range(), Slides(), BookingSite, CostItem, imagesOf() (+3 more)

### Community 56 - "Community 56"
Cohesion: 0.15
Nodes (12): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, resolveJsonModule (+4 more)

### Community 57 - "Community 57"
Cohesion: 0.24
Nodes (9): design(), FetchFn, gemini(), input, json(), mk(), post(), sleep() (+1 more)

### Community 58 - "Community 58"
Cohesion: 0.26
Nodes (9): common, Props, SeasonIcon(), SeasonPicker(), SeasonKey, SeasonInfo, SEASONS, PublicSuggestion (+1 more)

### Community 59 - "Community 59"
Cohesion: 0.18
Nodes (11): scripts, build, build:server, dev, dev:server, import:holidays, preview, start (+3 more)

### Community 60 - "Community 60"
Cohesion: 0.20
Nodes (10): devDependencies, @electric-sql/pglite, @electric-sql/pglite-socket, @types/node, @types/react, @types/react-dom, typescript, vite (+2 more)

### Community 61 - "Community 61"
Cohesion: 0.20
Nodes (5): bundles, dir, files, out, root

### Community 62 - "Community 62"
Cohesion: 0.27
Nodes (9): PublicUser, authRoutes(), cookie(), installBody, phoneBody, profileBody, readCookie(), SESSION_COOKIE (+1 more)

### Community 63 - "Community 63"
Cohesion: 0.22
Nodes (6): createHttpTransport(), startAutoFlush(), BackendNotConnectedError, EventProps, Transport, MOCK_DESTINATIONS

### Community 64 - "Community 64"
Cohesion: 0.29
Nodes (4): PRECACHE, put(), ApiUnavailableError, req()

### Community 65 - "Community 65"
Cohesion: 0.29
Nodes (6): build, buildCommand, deploy, healthcheckPath, startCommand, $schema

### Community 66 - "Community 66"
Cohesion: 0.40
Nodes (5): content(), makers, row(), season, SQL

### Community 67 - "Community 67"
Cohesion: 0.60
Nodes (5): buildGeocodeUrl(), keyOf(), read(), reverseGeocode(), roundCoord()

## Knowledge Gaps
- **405 isolated node(s):** `Column`, `Opt`, `FormState`, `FormState`, `TourResult` (+400 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 536 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 33` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 8`, `Community 10`, `Community 11`, `Community 13`, `Community 14`, `Community 17`, `Community 18`, `Community 19`, `Community 21`, `Community 23`, `Community 24`, `Community 28`, `Community 31`, `Community 32`, `Community 34`, `Community 36`, `Community 39`, `Community 42`, `Community 44`, `Community 46`, `Community 51`, `Community 52`, `Community 54`, `Community 55`, `Community 63`?**
  _High betweenness centrality (0.376) - this node is a cross-community bridge._
- **Why does `zod` connect `Community 29` to `Community 4`, `Community 37`, `Community 5`, `Community 7`, `Community 9`, `Community 12`, `Community 45`, `Community 19`, `Community 62`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `fastify` connect `Community 12` to `Community 35`, `Community 4`, `Community 5`, `Community 7`, `Community 9`, `Community 45`, `Community 19`, `Community 57`, `Community 29`, `Community 62`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **What connects `Column`, `Opt`, `FormState` to the rest of the system?**
  _405 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05283836878471752 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06818181818181818 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05935938877461064 - nodes in this community are weakly interconnected._