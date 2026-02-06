--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
    ('00000000-0000-0000-0000-000000000000', 'bb8c460b-746d-4276-93d2-b0a10b3f2bf5', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"mock_normal@mail.com","user_id":"ebbf0df2-92bc-4411-9aa4-85dd9eb62b34","user_phone":""}}', '2025-07-25 14:03:30.846823+00', '');

--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
    ('00000000-0000-0000-0000-000000000000', 'ebbf0df2-92bc-4411-9aa4-85dd9eb62b34', 'authenticated', 'authenticated', 'mock_normal@mail.com', '$2a$10$CNBF58J8f3UeIs7ee90HZe4KZL6sIEnVeyCMIrrlsuVYsqBd5P3Iu', '2025-07-25 14:03:30.851847+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-07-25 14:03:30.829263+00', '2025-07-25 14:03:30.852833+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);

--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
    ('ebbf0df2-92bc-4411-9aa4-85dd9eb62b34', 'ebbf0df2-92bc-4411-9aa4-85dd9eb62b34', '{"sub": "ebbf0df2-92bc-4411-9aa4-85dd9eb62b34", "email": "mock_normal@mail.com", "email_verified": false, "phone_verified": false}', 'email', '2025-07-25 14:03:30.844323+00', '2025-07-25 14:03:30.844357+00', '2025-07-25 14:03:30.844357+00', 'e94fe083-43db-49d6-9f07-d0994f5801cf');


INSERT INTO "storage"."buckets" (id, name, public) VALUES ('upload-resumes', 'upload-resumes', true);
