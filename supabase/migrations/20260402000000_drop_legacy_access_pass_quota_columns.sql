alter table "public"."access_passes"
drop column if exists "quota_full_optimize",
drop column if exists "used_full_optimize",
drop column if exists "quota_block_optimize",
drop column if exists "used_block_optimize",
drop column if exists "quota_motivation_letter",
drop column if exists "used_motivation_letter";
