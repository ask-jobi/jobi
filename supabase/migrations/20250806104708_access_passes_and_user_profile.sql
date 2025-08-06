create table "public"."access_passes" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "plan" text not null,
    "source" text not null default 'stripe'::text,
    "start_at" timestamp with time zone not null,
    "end_at" timestamp with time zone not null,
    "quota_full_optimize" integer not null default 0,
    "used_full_optimize" integer not null default 0,
    "quota_block_optimize" integer not null default 0,
    "used_block_optimize" integer not null default 0,
    "quota_motivation_letter" integer not null default 0,
    "used_motivation_letter" integer not null default 0,
    "stripe_checkout_session_id" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."access_passes" enable row level security;

create table "public"."user_profiles" (
    "id" uuid not null,
    "stripe_customer_id" text,
    "created_at" timestamp without time zone default now()
);


alter table "public"."user_profiles" enable row level security;

CREATE UNIQUE INDEX access_passes_pkey ON public.access_passes USING btree (id);

CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id);

alter table "public"."access_passes" add constraint "access_passes_pkey" PRIMARY KEY using index "access_passes_pkey";

alter table "public"."user_profiles" add constraint "user_profiles_pkey" PRIMARY KEY using index "user_profiles_pkey";

alter table "public"."access_passes" add constraint "access_passes_plan_check" CHECK ((plan = ANY (ARRAY['FREE'::text, 'LITE'::text, 'PRO'::text]))) not valid;

alter table "public"."access_passes" validate constraint "access_passes_plan_check";

alter table "public"."access_passes" add constraint "access_passes_source_check" CHECK ((source = ANY (ARRAY['free'::text, 'admin'::text, 'stripe'::text]))) not valid;

alter table "public"."access_passes" validate constraint "access_passes_source_check";

alter table "public"."access_passes" add constraint "access_passes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."access_passes" validate constraint "access_passes_user_id_fkey";

alter table "public"."user_profiles" add constraint "user_profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_id_fkey";

grant delete on table "public"."access_passes" to "anon";

grant insert on table "public"."access_passes" to "anon";

grant references on table "public"."access_passes" to "anon";

grant select on table "public"."access_passes" to "anon";

grant trigger on table "public"."access_passes" to "anon";

grant truncate on table "public"."access_passes" to "anon";

grant update on table "public"."access_passes" to "anon";

grant delete on table "public"."access_passes" to "authenticated";

grant insert on table "public"."access_passes" to "authenticated";

grant references on table "public"."access_passes" to "authenticated";

grant select on table "public"."access_passes" to "authenticated";

grant trigger on table "public"."access_passes" to "authenticated";

grant truncate on table "public"."access_passes" to "authenticated";

grant update on table "public"."access_passes" to "authenticated";

grant delete on table "public"."access_passes" to "service_role";

grant insert on table "public"."access_passes" to "service_role";

grant references on table "public"."access_passes" to "service_role";

grant select on table "public"."access_passes" to "service_role";

grant trigger on table "public"."access_passes" to "service_role";

grant truncate on table "public"."access_passes" to "service_role";

grant update on table "public"."access_passes" to "service_role";

grant delete on table "public"."user_profiles" to "anon";

grant insert on table "public"."user_profiles" to "anon";

grant references on table "public"."user_profiles" to "anon";

grant select on table "public"."user_profiles" to "anon";

grant trigger on table "public"."user_profiles" to "anon";

grant truncate on table "public"."user_profiles" to "anon";

grant update on table "public"."user_profiles" to "anon";

grant delete on table "public"."user_profiles" to "authenticated";

grant insert on table "public"."user_profiles" to "authenticated";

grant references on table "public"."user_profiles" to "authenticated";

grant select on table "public"."user_profiles" to "authenticated";

grant trigger on table "public"."user_profiles" to "authenticated";

grant truncate on table "public"."user_profiles" to "authenticated";

grant update on table "public"."user_profiles" to "authenticated";

grant delete on table "public"."user_profiles" to "service_role";

grant insert on table "public"."user_profiles" to "service_role";

grant references on table "public"."user_profiles" to "service_role";

grant select on table "public"."user_profiles" to "service_role";

grant trigger on table "public"."user_profiles" to "service_role";

grant truncate on table "public"."user_profiles" to "service_role";

grant update on table "public"."user_profiles" to "service_role";

create policy "Users can access their own access_passes"
on "public"."access_passes"
as permissive
for all
to public
using ((user_id = auth.uid()));


create policy "Enable insert for users based on user_id"
on "public"."user_profiles"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = id));


create policy "Enable users to view their own data only"
on "public"."user_profiles"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = id));



