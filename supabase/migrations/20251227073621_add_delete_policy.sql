create policy "Enable delete for users based on user_id"
on "public"."job_applications"
as PERMISSIVE
for DELETE
to public
using (
    (select auth.uid()) = user_id
);

create policy "Enable all for authenticated users"
on "public"."jobs"
as PERMISSIVE
for UPDATE
to authenticated
using (
    true
);


create policy "Enable delete for users based on user_id"
on "public"."resumes"
as PERMISSIVE
for DELETE
to public
using (
(select auth.uid()) = user_id
);
