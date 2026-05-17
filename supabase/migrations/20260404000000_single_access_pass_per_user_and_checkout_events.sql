create table "public"."stripe_checkout_events" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "checkout_session_id" text not null,
    "plan" text not null,
    "granted_tokens" integer not null default 0,
    "created_at" timestamp with time zone default now()
);

alter table "public"."stripe_checkout_events" enable row level security;

create unique index "stripe_checkout_events_pkey" on "public"."stripe_checkout_events" using btree ("id");
create unique index "stripe_checkout_events_checkout_session_id_key" on "public"."stripe_checkout_events" using btree ("checkout_session_id");

alter table "public"."stripe_checkout_events"
  add constraint "stripe_checkout_events_pkey"
  primary key using index "stripe_checkout_events_pkey";

alter table "public"."stripe_checkout_events"
  add constraint "stripe_checkout_events_checkout_session_id_key"
  unique using index "stripe_checkout_events_checkout_session_id_key";

alter table "public"."stripe_checkout_events"
  add constraint "stripe_checkout_events_plan_check"
  check ((plan = any (array['FREE'::text, 'LITE'::text, 'PRO'::text]))) not valid;

alter table "public"."stripe_checkout_events"
  validate constraint "stripe_checkout_events_plan_check";

alter table "public"."stripe_checkout_events"
  add constraint "stripe_checkout_events_user_id_fkey"
  foreign key ("user_id") references auth.users(id) on delete cascade not valid;

alter table "public"."stripe_checkout_events"
  validate constraint "stripe_checkout_events_user_id_fkey";

grant delete on table "public"."stripe_checkout_events" to "anon";
grant insert on table "public"."stripe_checkout_events" to "anon";
grant references on table "public"."stripe_checkout_events" to "anon";
grant select on table "public"."stripe_checkout_events" to "anon";
grant trigger on table "public"."stripe_checkout_events" to "anon";
grant truncate on table "public"."stripe_checkout_events" to "anon";
grant update on table "public"."stripe_checkout_events" to "anon";

grant delete on table "public"."stripe_checkout_events" to "authenticated";
grant insert on table "public"."stripe_checkout_events" to "authenticated";
grant references on table "public"."stripe_checkout_events" to "authenticated";
grant select on table "public"."stripe_checkout_events" to "authenticated";
grant trigger on table "public"."stripe_checkout_events" to "authenticated";
grant truncate on table "public"."stripe_checkout_events" to "authenticated";
grant update on table "public"."stripe_checkout_events" to "authenticated";

grant delete on table "public"."stripe_checkout_events" to "service_role";
grant insert on table "public"."stripe_checkout_events" to "service_role";
grant references on table "public"."stripe_checkout_events" to "service_role";
grant select on table "public"."stripe_checkout_events" to "service_role";
grant trigger on table "public"."stripe_checkout_events" to "service_role";
grant truncate on table "public"."stripe_checkout_events" to "service_role";
grant update on table "public"."stripe_checkout_events" to "service_role";

create policy "Users can access their own stripe_checkout_events"
on "public"."stripe_checkout_events"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));

insert into "public"."stripe_checkout_events" (
  "user_id",
  "checkout_session_id",
  "plan",
  "granted_tokens",
  "created_at"
)
select
  "user_id",
  "stripe_checkout_session_id",
  "plan",
  coalesce("quota_chat_tokens", 0),
  "created_at"
from "public"."access_passes"
where "stripe_checkout_session_id" is not null
on conflict ("checkout_session_id") do nothing;

with ranked_access_passes as (
  select
    "id",
    "user_id",
    "plan",
    row_number() over (
      partition by "user_id"
      order by "created_at" desc nulls last, "id" desc
    ) as "row_num",
    sum(coalesce("quota_chat_tokens", 0)) over (partition by "user_id") as "total_quota_chat_tokens",
    sum(coalesce("used_chat_tokens", 0)) over (partition by "user_id") as "total_used_chat_tokens"
  from "public"."access_passes"
),
latest_access_passes as (
  select *
  from ranked_access_passes
  where "row_num" = 1
)
update "public"."access_passes" as ap
set
  "plan" = latest_access_passes."plan",
  "quota_chat_tokens" = latest_access_passes."total_quota_chat_tokens",
  "used_chat_tokens" = latest_access_passes."total_used_chat_tokens"
from latest_access_passes
where ap."id" = latest_access_passes."id";

with ranked_access_passes as (
  select
    "id",
    row_number() over (
      partition by "user_id"
      order by "created_at" desc nulls last, "id" desc
    ) as "row_num"
  from "public"."access_passes"
)
delete from "public"."access_passes" as ap
using ranked_access_passes
where ap."id" = ranked_access_passes."id"
  and ranked_access_passes."row_num" > 1;

create unique index "access_passes_user_id_key"
on "public"."access_passes" using btree ("user_id");

alter table "public"."access_passes"
  drop column if exists "stripe_checkout_session_id";
