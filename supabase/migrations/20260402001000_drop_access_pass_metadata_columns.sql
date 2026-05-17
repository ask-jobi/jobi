alter table "public"."access_passes"
drop constraint if exists "access_passes_source_check";

alter table "public"."access_passes"
drop column if exists "source",
drop column if exists "start_at",
drop column if exists "end_at";
