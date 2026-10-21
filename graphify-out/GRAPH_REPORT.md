# Graph Report - tagh  (2026-10-20)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1652 nodes · 4739 edges · 76 communities (60 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 77 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8f801eab`
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

## God Nodes (most connected - your core abstractions)
1. `faNum()` - 89 edges
2. `react` - 81 edges
3. `Store` - 39 edges
4. `CalendarPage()` - 36 edges
5. `useDarkMode()` - 29 edges
6. `Destination` - 28 edges
7. `fromGregorian()` - 28 edges
8. `useThemeColorMeta()` - 27 edges
9. `WeatherPage()` - 25 edges
10. `SettingsPage()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `makeDeps()` --calls--> `parseForecast()`  [EXTRACTED]
  tests/weather.test.ts → src/weather/current/client.ts
- `series()` --calls--> `fromGregorian()`  [EXTRACTED]
  tests/weather.test.ts → src/lib/jalali.ts
- `guest()` --calls--> `memoryKV()`  [EXTRACTED]
  tests/analytics.test.ts → src/analytics/ids.ts
- `guest()` --calls--> `getOrCreateInstallation()`  [EXTRACTED]
  tests/analytics.test.ts → src/analytics/installation.ts
- `Version` --references--> `SuggestionContent`  [EXTRACTED]
  src/admin/suggestions/api.ts → src/travel/suggestionContent.ts

## Import Cycles
- None detected.

## Communities (76 total, 16 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (85): Column, DataTable(), DestinationForm(), AreaField(), CheckGroup(), lab(), lines(), num() (+77 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (58): ParsedDate, parseJalaliInput(), toLatinDigits(), toPersianDigits(), Calendar(), CalendarProps, LONG_PRESS_MS, DateHeader() (+50 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (46): engines, node, name, private, type, version, @electric-sql/pglite, @electric-sql/pglite-socket (+38 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (48): DykTile(), svg, Thumb(), TileProps, TopicTile(), useTapGuard(), EMPTY, FeedItem (+40 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (38): clearConsent(), CONSENT_KINDS, consentSummary(), DEFAULT_CONSENT, loadConsentRecords(), NO_CONSENT, POLICY_VERSION, recordConsent() (+30 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (41): canFeedTransition(), FEED_KINDS, FEED_STATUSES, FEED_TRANSITIONS, FeedContent, feedContentSchema, feedGenSchema, FeedImage (+33 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (40): zod, BY_CODE, createGhasedak(), call(), fail(), Ghasedak, GhasedakDeps, SMS_ERROR_FA (+32 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (38): ENUMS_TEXT, EXTRA_RULES, REQUIRED_PLACEHOLDERS, validateTemplate(), activeTemplate(), AiService, imageQueriesFor(), AiSettings (+30 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (36): trackDestinationView(), trackSeason(), AdvancedFilter(), Props, ChipGroup(), Props, common, Props (+28 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (31): SEED_COORDINATES, TEXT, WeatherError, FORECAST_DAYS, Acc, add(), analyzeSeries(), avg() (+23 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (33): Status, SuggestionContent, consentCtx, consentSchema, envelope, EVENT_TYPES, eventSchema, int (+25 more)

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (34): fromGregorian(), Arc(), Dialog(), iso2(), isoDay(), jalaliShort(), Sel, Sky() (+26 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (26): auditEntry(), ApiUnavailableError, createDemoApi(), OfferDraft, UsersApi, Page, ACTIVE_WINDOW_DAYS, AudienceCounts (+18 more)

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (28): DEFAULT_TEMPLATE, renderPrompt(), call(), Fetch, geminiGenerate(), geminiOnce(), httpsOnly(), ImageCandidate (+20 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (33): ChecklistCategory, TRIP_TYPES, TripType, addItem(), allTypes(), categoriesOf(), ChecklistState, clean() (+25 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (26): buildPlan(), DATE_TAG, disableDateNotification(), enableDateNotification(), ensureTitleScript(), notificationState(), Plan, PlanHour (+18 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (27): levelOpts, ratingOpts, blankSeason(), DestinationDraft, DraftResult, SeasonDraft, seasonToDraft(), toDraft() (+19 more)

### Community 17 - "Community 17"
Cohesion: 0.19
Nodes (29): AiSuggestions(), ApiSettings(), SecretRow(), WikimediaTest(), FeedAdmin(), FeedCard(), ERR_FA, LogEntry (+21 more)

### Community 18 - "Community 18"
Cohesion: 0.17
Nodes (28): visible(), EnableResult, listeners, occasionPrefsKey(), put(), setAncientCelebrations(), setNationalDays(), setReligiousDays() (+20 more)

### Community 19 - "Community 19"
Cohesion: 0.10
Nodes (26): fileToDataUrl(), MAX_IMAGE_BYTES, Name, SECRETS, SetupChecklist(), STORAGE_MSG, IMG_LABEL, AiMeta (+18 more)

### Community 20 - "Community 20"
Cohesion: 0.14
Nodes (24): AuthState, AuthUser, deleteAccount(), getAuth(), http(), listeners, logout(), refreshAuth() (+16 more)

### Community 21 - "Community 21"
Cohesion: 0.08
Nodes (17): vite, @vitejs/plugin-react, walk(), bundles, dir, files, out, root (+9 more)

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (24): EventDraft, EventForm(), Props, Actions(), Badge(), EventTable(), Props, Modal() (+16 more)

### Community 23 - "Community 23"
Cohesion: 0.10
Nodes (22): ApprovalCheck, arr(), buildPrompt(), checkApproval(), draftRepo, isHttpOrPath(), LEVELS, parseAiDestinations() (+14 more)

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (23): destName(), EVENT_LABEL, fmtDate(), Props, UserDetailView(), destName(), FilterForm(), fixBool() (+15 more)

### Community 25 - "Community 25"
Cohesion: 0.17
Nodes (24): ProfileRecord, UserDetail, UserSummary, AccountState, alreadyMerged(), GuestBundle, mergeGuestIntoAccount(), mergeInner() (+16 more)

### Community 27 - "Community 27"
Cohesion: 0.17
Nodes (17): Icon(), IconName, PATHS, Props, QuickAction(), Props, Section(), Props (+9 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (20): AppChrome(), Props, svg, Drawer(), Icon(), fmt, NotificationsPanel(), Props (+12 more)

### Community 29 - "Community 29"
Cohesion: 0.16
Nodes (20): AdminFeedItem, factsToText(), FEED_STATUS_LABEL, FEED_TABS, FeedContent, FeedFact, FeedGenResponse, FeedGenResult (+12 more)

### Community 30 - "Community 30"
Cohesion: 0.25
Nodes (16): INITIAL, Settings(), Switch(), useDarkMode(), useThemeColorMeta(), Favorites(), Opened, TourDetails() (+8 more)

### Community 31 - "Community 31"
Cohesion: 0.16
Nodes (12): AiDraftRecord, Props, FormState, SeasonalRecommendations(), Props, Destination, createLocalRepository(), Repository (+4 more)

### Community 32 - "Community 32"
Cohesion: 0.14
Nodes (16): deg(), ERROR_TEXT, WeatherCard(), fmt, formatClock(), msUntilNextMinute(), useNow(), NotifWeather (+8 more)

### Community 33 - "Community 33"
Cohesion: 0.14
Nodes (15): ANCIENT, buildYears(), classify(), cleanTitle(), INTERNATIONAL, keyOf(), KINDS, RELIGIOUS (+7 more)

### Community 34 - "Community 34"
Cohesion: 0.25
Nodes (12): SuggestionsPreview(), DestinationCard(), deg(), DestinationContent(), GalleryImage, ImageGallery(), locationLabel(), DestinationDetails() (+4 more)

### Community 35 - "Community 35"
Cohesion: 0.15
Nodes (12): createHttpTransport(), startAutoFlush(), tracker, EventProps, addNotification(), AppNotification, commit(), items (+4 more)

### Community 36 - "Community 36"
Cohesion: 0.16
Nodes (15): browserDeps, Coords, createWeatherStore(), fetchFor(), run(), Persisted, POS_ERR, REFRESH_MS (+7 more)

### Community 37 - "Community 37"
Cohesion: 0.17
Nodes (16): CalendarData, DEFAULT, initCalendarData(), isValid(), KIND_LABEL, listeners, Occasion, OccasionItem (+8 more)

### Community 38 - "Community 38"
Cohesion: 0.16
Nodes (14): buildDemoProfiles(), CITIES, NAMES, rng(), SEASONS, TYPES, computeInterests(), DEFAULT_WEIGHTS (+6 more)

### Community 39 - "Community 39"
Cohesion: 0.17
Nodes (12): BASE, ChecklistItem, COLOR_HUES, DOCS, ELEC, HEALTH, IconKey, PATHS (+4 more)

### Community 40 - "Community 40"
Cohesion: 0.31
Nodes (13): FeedPopup(), overlayActive(), popOverlay(), pushOverlay(), stateOf(), useOverlay(), getSelectedDate(), listeners (+5 more)

### Community 41 - "Community 41"
Cohesion: 0.22
Nodes (13): idbGet(), idbSet(), run(), entries, initHistoricalClimate(), listeners, loadFailures(), publish() (+5 more)

### Community 42 - "Community 42"
Cohesion: 0.28
Nodes (14): finiteOrNull(), buildAirQualityUrl(), buildForecastUrl(), col(), dayMeans(), fetchForecast(), first(), HOURLY_HOURS (+6 more)

### Community 43 - "Community 43"
Cohesion: 0.32
Nodes (14): DIGITS, maskPhone(), normalizeIranMobile(), toLatinDigits(), createAuthService(), deleteAccount(), loadSettings(), requestOtp() (+6 more)

### Community 44 - "Community 44"
Cohesion: 0.20
Nodes (9): AdminApp(), AdminLayout(), Props, Props, Sidebar(), Props, Topbar(), ComingSoon() (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.28
Nodes (12): SeasonClimate, MAX_PER_SECTION, recommend(), HUMID, isExtreme(), isSeasonSuitable(), RAIN, rainHumidityScore() (+4 more)

### Community 46 - "Community 46"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, lib, module, moduleResolution, outDir, rootDir, skipLibCheck (+5 more)

### Community 47 - "Community 47"
Cohesion: 0.20
Nodes (12): Badge(), DetailsButton(), Props, UserTable(), DEFAULT_USER_FILTERS, filterUsers(), MOCK_USERS, normalize() (+4 more)

### Community 48 - "Community 48"
Cohesion: 0.23
Nodes (10): trackRoute(), AdminApp, App(), Routes(), box, lazyWithRetry(), reload(), RouteBoundary (+2 more)

### Community 49 - "Community 49"
Cohesion: 0.31
Nodes (9): react, CenterModal(), Props, ICONS, Props, FilterSheet(), Props, useAnimatedMount() (+1 more)

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (10): createSecrets(), get(), decrypt(), encrypt(), ENV_VAR, keyBytes(), kvKey(), SECRET_NAMES (+2 more)

### Community 51 - "Community 51"
Cohesion: 0.21
Nodes (10): createRemoteApi(), req(), NotReadyError, account(), data, ev(), guest(), NOW (+2 more)

### Community 52 - "Community 52"
Cohesion: 0.15
Nodes (12): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, resolveJsonModule (+4 more)

### Community 53 - "Community 53"
Cohesion: 0.27
Nodes (9): items, listeners, refreshRemoteSuggestions(), subscribe(), toRemoteDestinations(), useRemote(), contentToDestination(), PublicSuggestion (+1 more)

### Community 54 - "Community 54"
Cohesion: 0.18
Nodes (11): dependencies, fastify, @fastify/rate-limit, @fastify/static, jalaali-js, postgres, react, react-dom (+3 more)

### Community 55 - "Community 55"
Cohesion: 0.18
Nodes (11): scripts, build, build:server, dev, dev:server, import:holidays, preview, start (+3 more)

### Community 56 - "Community 56"
Cohesion: 0.20
Nodes (10): devDependencies, @electric-sql/pglite, @electric-sql/pglite-socket, @types/node, @types/react, @types/react-dom, typescript, vite (+2 more)

### Community 57 - "Community 57"
Cohesion: 0.29
Nodes (6): build, buildCommand, deploy, healthcheckPath, startCommand, $schema

### Community 58 - "Community 58"
Cohesion: 0.43
Nodes (5): useAnalytics(), CONSENT_TEXT, Perm, PrivacyPage(), readPerm()

### Community 59 - "Community 59"
Cohesion: 0.48
Nodes (6): Dock(), item(), Luggage(), Note(), Plane(), svg

### Community 60 - "Community 60"
Cohesion: 0.60
Nodes (5): buildGeocodeUrl(), keyOf(), read(), reverseGeocode(), roundCoord()

## Knowledge Gaps
- **350 isolated node(s):** `Column`, `Opt`, `FormState`, `FormState`, `TourResult` (+345 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 469 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 49` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 8`, `Community 11`, `Community 14`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 22`, `Community 24`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 31`, `Community 32`, `Community 34`, `Community 35`, `Community 36`, `Community 37`, `Community 39`, `Community 40`, `Community 41`, `Community 44`, `Community 48`, `Community 53`, `Community 58`, `Community 59`?**
  _High betweenness centrality (0.330) - this node is a cross-community bridge._
- **Why does `faNum()` connect `Community 17` to `Community 0`, `Community 1`, `Community 34`, `Community 3`, `Community 32`, `Community 39`, `Community 8`, `Community 41`, `Community 11`, `Community 14`, `Community 19`, `Community 20`, `Community 22`, `Community 24`, `Community 27`, `Community 28`, `Community 29`, `Community 30`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `vitest` connect `Community 2` to `Community 16`, `Community 13`, `Community 21`, `Community 5`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `Column`, `Opt`, `FormState` to the rest of the system?**
  _350 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05164797825348284 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07806841046277666 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.052214452214452214 - nodes in this community are weakly interconnected._