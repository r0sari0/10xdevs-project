-- migration: disable_rls_policies
-- description: disables row level security and drops all related policies for generations, flashcards, and generation_error_logs tables.
-- created_at: 2025-10-09 12:00:00 utc

-- disable row level security and drop policies for 'generations' table
alter table generations disable row level security;

drop policy if exists "allow_anon_to_generations_select" on generations;
drop policy if exists "allow_anon_to_generations_insert" on generations;
drop policy if exists "allow_anon_to_generations_update" on generations;
drop policy if exists "allow_anon_to_generations_delete" on generations;
drop policy if exists "allow_authenticated_to_generations_select" on generations;
drop policy if exists "allow_authenticated_to_generations_insert" on generations;
drop policy if exists "allow_authenticated_to_generations_update" on generations;
drop policy if exists "allow_authenticated_to_generations_delete" on generations;

-- disable row level security and drop policies for 'flashcards' table
alter table flashcards disable row level security;

drop policy if exists "allow_anon_to_flashcards_select" on flashcards;
drop policy if exists "allow_anon_to_flashcards_insert" on flashcards;
drop policy if exists "allow_anon_to_flashcards_update" on flashcards;
drop policy if exists "allow_anon_to_flashcards_delete" on flashcards;
drop policy if exists "allow_authenticated_to_flashcards_select" on flashcards;
drop policy if exists "allow_authenticated_to_flashcards_insert" on flashcards;
drop policy if exists "allow_authenticated_to_flashcards_update" on flashcards;
drop policy if exists "allow_authenticated_to_flashcards_delete" on flashcards;

-- disable row level security and drop policies for 'generation_error_logs' table
alter table generation_error_logs disable row level security;

drop policy if exists "allow_anon_to_generation_error_logs_select" on generation_error_logs;
drop policy if exists "allow_anon_to_generation_error_logs_insert" on generation_error_logs;
drop policy if exists "allow_anon_to_generation_error_logs_update" on generation_error_logs;
drop policy if exists "allow_anon_to_generation_error_logs_delete" on generation_error_logs;
drop policy if exists "allow_authenticated_to_generation_error_logs_select" on generation_error_logs;
drop policy if exists "allow_authenticated_to_generation_error_logs_insert" on generation_error_logs;
drop policy if exists "allow_authenticated_to_generation_error_logs_update" on generation_error_logs;
drop policy if exists "allow_authenticated_to_generation_error_logs_delete" on generation_error_logs;
