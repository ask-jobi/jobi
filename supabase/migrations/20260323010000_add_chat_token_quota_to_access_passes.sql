alter table "public"."access_passes"
add column if not exists "quota_chat_tokens" integer not null default 0,
add column if not exists "used_chat_tokens" integer not null default 0;
