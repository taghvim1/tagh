-- طرح PostgreSQL متناظر با server/src/store/types.ts (هنوز اجرا/آزمایش‌شده روی PostgreSQL واقعی نیست).
-- ذخیره‌سازی فعلی آزمایشی و فایل JSON است؛ هنگام انتقال، یک پیاده‌سازی Store برای PostgreSQL بنویسید که همین طرح را بخواند.
create table if not exists travel_suggestions (
  id bigserial primary key,
  status text not null check (status in ('draft','pending_review','approved','published','rejected','archived')),
  source text not null check (source in ('manual','ai','import')),
  name text not null,
  country text not null,
  content jsonb not null,
  version integer not null default 1,
  cover_image_id bigint,
  reject_reason text,
  ai_meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists travel_suggestions_status_idx on travel_suggestions (status, updated_at desc);
create unique index if not exists travel_suggestions_published_unique on travel_suggestions (lower(name), lower(country)) where status = 'published';

create table if not exists travel_suggestion_versions (
  id bigserial primary key,
  suggestion_id bigint not null references travel_suggestions(id) on delete cascade,
  version integer not null,
  content jsonb not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (suggestion_id, version)
);

create table if not exists travel_suggestion_images (
  id bigserial primary key,
  suggestion_id bigint not null references travel_suggestions(id) on delete cascade,
  url text not null,
  thumb_url text,
  provider text not null,
  source_url text,
  author text,
  license text,
  license_url text,
  attribution text,
  status text not null check (status in ('candidate','approved','rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists prompt_templates (
  id bigserial primary key,
  version integer not null unique,
  text text not null,
  note text not null default '',
  active boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists prompt_templates_one_active on prompt_templates (active) where active;

-- تنظیمات غیرمحرمانه و کلیدهای رمزنگاری‌شده (AES-256-GCM؛ کلید رمزنگاری فقط در متغیر محیطی است)
create table if not exists app_settings (key text primary key, value text not null, updated_at timestamptz not null default now());
