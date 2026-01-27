# Supabase RPC API

Language: English | [繁體中文（台灣）](supabase-rpc-api.zh-TW.md)

This document describes the Postgres RPC functions exposed in Supabase.
Unless noted otherwise, functions live in the `public` schema and are invoked
via `supabase.rpc('function_name', { ... })`.

Trigger helpers (e.g. `handle_updated_at`) are not listed here.

## Table of contents

- [Supabase RPC API](#supabase-rpc-api)
  - [RPC function index](#rpc-function-index)
    - [Questions](#questions)
    - [Tags](#tags)
    - [Question tags](#question-tags)
    - [Exams](#exams)
    - [Flashcards](#flashcards)
    - [Bookmarks and analytics](#bookmarks-and-analytics)
    - [Discussion MVP](#discussion-mvp)
    - [User admin](#user-admin)
    - [User profile](#user-profile)
  - [Function details](#function-details)
    - [Questions functions](#questions-functions)
      - [Function: public.add_question](#function-publicadd_question)
      - [Function: public.get_questions](#function-publicget_questions)
      - [Function: public.get_question_detail](#function-publicget_question_detail)
    - [Tags functions](#tags-functions)
      - [Function: public.get_tags](#function-publicget_tags)
      - [Function: public.get_tag_detail](#function-publicget_tag_detail)
      - [Function: public.create_tag](#function-publiccreate_tag)
      - [Function: public.update_tag](#function-publicupdate_tag)
      - [Function: public.delete_tag](#function-publicdelete_tag)
    - [Question-tag functions](#question-tag-functions)
      - [Function: public.set_question_tags](#function-publicset_question_tags)
      - [Function: public.add_question_tags](#function-publicadd_question_tags)
      - [Function: public.remove_question_tags](#function-publicremove_question_tags)
      - [Function: public.add_tag_questions](#function-publicadd_tag_questions)
    - [Exams functions](#exams-functions)
      - [Function: public.get_exam_detail](#function-publicget_exam_detail)
      - [Function: public.get_user_exams](#function-publicget_user_exams)
      - [Function: public.get_practice_exams](#function-publicget_practice_exams)
      - [Function: public.save_exam_result](#function-publicsave_exam_result)
      - [Function: public.get_exam_results](#function-publicget_exam_results)
      - [Function: public.get_wrong_questions](#function-publicget_wrong_questions)
    - [Flashcards functions](#flashcards-functions)
      - [Function: public.get_flashcards](#function-publicget_flashcards)
      - [Function: public.get_due_flashcards](#function-publicget_due_flashcards)
      - [Function: public.review_flashcard](#function-publicreview_flashcard)
      - [Function: public.get_flashcard_stats](#function-publicget_flashcard_stats)
    - [Bookmarks and analytics functions](#bookmarks-and-analytics-functions)
      - [Function: public.get_bookmarks](#function-publicget_bookmarks)
      - [Function: public.get_user_analytics](#function-publicget_user_analytics)
    - [Discussion MVP functions](#discussion-mvp-functions)
      - [Function: public.get_discussions_mvp](#function-publicget_discussions_mvp)
      - [Function: public.get_discussion_detail_mvp](#function-publicget_discussion_detail_mvp)
      - [Function: public.unlock_answer_mvp](#function-publicunlock_answer_mvp)
      - [Function: public.cast_vote_mvp](#function-publiccast_vote_mvp)
      - [Function: public.claim_daily_credits_mvp](#function-publicclaim_daily_credits_mvp)
      - [Function: public.get_user_credits_mvp](#function-publicget_user_credits_mvp)
    - [User admin functions](#user-admin-functions)
      - [Function: public.get_users_admin](#function-publicget_users_admin)
      - [Function: public.set_user_admin](#function-publicset_user_admin)
    - [User profile functions](#user-profile-functions)
      - [Function: public.update_user_display_name](#function-publicupdate_user_display_name)
      - [Function: public.get_user_profile](#function-publicget_user_profile)

## RPC function index

Permission legend: `anon`, `authenticated`, `service_role`. If a function is not granted in migrations, it is marked as `not granted in migrations`. Functions marked `admin-only` enforce an admin check inside the function.

### Questions

- `public.get_questions(p_subject text default null, p_difficulty text default null, p_type text default null, p_year integer default null, p_keyword text default null, p_page integer default 1, p_page_size integer default 20) returns json` — `anon`, `authenticated`
- `public.get_question_detail(p_id bigint) returns json` — `anon`, `authenticated`
- `public.add_question(content text, explanation text default null, question_type text default null, difficulty text default null, subject text default null, category text default null, year smallint default null, source text default null, options jsonb default '[]'::jsonb, tag_ids bigint[] default null, creator uuid default null, status text default null) returns bigint` — `authenticated`

### Tags

- `public.get_tags(p_search text default null, p_limit integer default 50, p_offset integer default 0) returns json` — `authenticated`, `service_role`
- `public.get_tag_detail(p_id bigint) returns json` — `authenticated`, `service_role`
- `public.create_tag(p_name text) returns json` — `authenticated`, `service_role`
- `public.update_tag(p_id bigint, p_name text) returns json` — `authenticated`, `service_role`
- `public.delete_tag(p_id bigint) returns json` — `authenticated`, `service_role`

### Question tags

- `public.set_question_tags(p_question_id bigint, p_tag_ids bigint[]) returns json` — `service_role`
- `public.add_question_tags(p_question_id bigint, p_tag_ids bigint[]) returns json` — `service_role`
- `public.remove_question_tags(p_question_id bigint, p_tag_ids bigint[]) returns json` — `service_role`
- `public.add_tag_questions(p_tag_id bigint, p_question_ids bigint[]) returns json` — `service_role`

### Exams

- `public.get_exam_detail(p_id bigint) returns json` — `authenticated`
- `public.get_user_exams() returns json` — `authenticated`
- `public.get_practice_exams() returns json` — `anon`, `authenticated`
- `public.save_exam_result(p_exam_id bigint default null, p_exam_name text default '', p_score numeric default 0, p_correct_count integer default 0, p_total_count integer default 0, p_duration_seconds integer default null, p_answers_json jsonb default null, p_wrong_question_ids bigint[] default null) returns json` — `authenticated`
- `public.get_exam_results() returns json` — `authenticated`
- `public.get_wrong_questions() returns json` — `authenticated`

### Flashcards

- `public.get_flashcards() returns json` — `authenticated`
- `public.get_due_flashcards(p_limit integer default 20) returns json` — `authenticated`
- `public.review_flashcard(p_flashcard_id bigint, p_rating integer) returns json` — `authenticated`
- `public.get_flashcard_stats() returns json` — `authenticated`

### Bookmarks and analytics

- `public.get_bookmarks() returns json` — `authenticated`
- `public.get_user_analytics() returns json` — `authenticated`

### Discussion MVP

- `public.get_discussions_mvp(p_limit integer default 20, p_offset integer default 0) returns table (id uuid, title text, body text, user_id uuid, user_email text, display_name text, view_count integer, answer_count integer, created_at timestamptz)` — `not granted in migrations`
- `public.get_discussion_detail_mvp(p_discussion_id uuid, p_user_id uuid default null) returns json` — `not granted in migrations`
- `public.unlock_answer_mvp(p_user_id uuid, p_answer_id uuid) returns json` — `not granted in migrations`
- `public.cast_vote_mvp(p_user_id uuid, p_answer_id uuid, p_vote_value integer) returns json` — `not granted in migrations`
- `public.claim_daily_credits_mvp(p_user_id uuid) returns json` — `not granted in migrations`
- `public.get_user_credits_mvp(p_user_id uuid) returns json` — `not granted in migrations`

### User admin

- `public.get_users_admin() returns table (id uuid, email text, created_at timestamptz, is_admin boolean)` — `authenticated` (admin-only)
- `public.set_user_admin(p_user_id uuid, p_is_admin boolean) returns void` — `authenticated` (admin-only)

### User profile

- `public.update_user_display_name(p_user_id uuid, p_display_name text) returns json` — `not granted in migrations`
- `public.get_user_profile(p_user_id uuid) returns json` — `not granted in migrations`

### User admin functions

#### Function: public.get_users_admin — auth: authenticated (admin-only)

Returns a list of users from `auth.users` with basic fields for admin UI.

### Returns

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | User ID. |
| email | text | Email address. |
| created_at | timestamptz | Created time. |
| is_admin | boolean | Derived from `raw_user_meta_data.is_admin`. |

### Notes

- Requires the caller to have `raw_user_meta_data.is_admin = true`.

#### Function: public.set_user_admin — auth: authenticated (admin-only)

Updates `auth.users.raw_user_meta_data.is_admin` for the target user.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_user_id | uuid | yes | Target user ID. |
| p_is_admin | boolean | yes | `true` to grant admin, `false` to revoke. |

### Notes

- The target user must re-login to receive updated JWT claims.
## Function details

### Questions functions

#### Function: public.add_question — auth: authenticated

Creates a question in `public.question`, then inserts related options in
`public.question_option` and tag links in `public.question_tag`.

### Auth

`EXECUTE` is granted to the `authenticated` role. The function runs as
`SECURITY DEFINER` and sets `creator` to `auth.uid()` when available.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| content | text | yes | Trimmed; empty content raises error. |
| explanation | text | no | Empty string becomes NULL. |
| question_type | text | no | Accepts `essay` or `multipleChoice`. If not provided or invalid, the function picks `multipleChoice` when options exist, otherwise `essay`. |
| difficulty | text | no | Accepts `easy`, `normal`, `hard`, `insane`. If `medium`, it is mapped to `normal`. Anything else falls back to `normal`. |
| subject | text | no | Empty string becomes NULL. |
| category | text | no | Empty string becomes NULL. |
| year | smallint | no | Stored on the question row. |
| source | text | no | Empty string becomes NULL. |
| options | jsonb | no | JSON array of option objects. Non-array or empty array means no options. |
| tag_ids | bigint[] | no | Tag IDs to insert into `public.question_tag`. |
| creator | uuid | no | Used only when `auth.uid()` is NULL (e.g., service role). |
| status | text | no | Accepted for compatibility but ignored (no column in Supabase schema). |

### options format

Each option item accepts:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| content | text | yes | Empty content is skipped. |
| is_correct | boolean | no | Defaults to `false`. |
| order | smallint | no | Defaults to the array order (1..n). |

If you provide duplicate `order` values, the insert will fail due to the
`question_option` unique constraint on `(question_id, order)`.

### Returns

`bigint` - the newly created `question.id`.

### Example (SQL)

```sql
select public.add_question(
  content => 'Sample question?',
  question_type => 'multipleChoice',
  difficulty => 'normal',
  options => '[{"content":"A","is_correct":true},{"content":"B","is_correct":false}]'::jsonb,
  tag_ids => '{1,2}'::bigint[]
);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('add_question', {
  content: 'Sample question?',
  question_type: 'multipleChoice',
  difficulty: 'normal',
  options: [
    { content: 'A', is_correct: true },
    { content: 'B', is_correct: false }
  ],
  tag_ids: [1, 2]
})
```

### Notes

- `public.question.type` is stored as `public.question_type` enum.
- `public.question.difficulty` is stored as `public.question_difficulty` enum.
- The function trims text fields and converts empty strings to NULL where
  applicable.

#### Function: public.get_questions — auth: anon, authenticated

Returns a paginated list of questions with options and tags.

### Auth

`EXECUTE` is granted to `authenticated` and `anon`. The function runs as
`SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_subject | text | no | Exact match on `question.subject`. |
| p_difficulty | text | no | Matches `question.difficulty::text`. |
| p_type | text | no | Matches `question.type::text`. |
| p_year | integer | no | Matches `question.year`. |
| p_keyword | text | no | `ILIKE` match against `question.content`. |
| p_page | integer | no | 1-based page number. Default `1`. |
| p_page_size | integer | no | Page size. Default `20`. |

### Returns

`json` object with:

- `results`: array of question objects
- `count`: total matching questions
- `page`: current page
- `page_size`: page size

Each `results` item includes `id`, `content`, `explanation`, `type`,
`difficulty`, `subject`, `category`, `year`, `source`, `created_at`,
`options` (array of `{id, content, is_correct, order}`), and `tags`
(array of `{id, name}`).

### Example (SQL)

```sql
select public.get_questions(
  p_subject => 'math',
  p_keyword => 'derivative',
  p_page => 1,
  p_page_size => 20
);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('get_questions', {
  p_subject: 'math',
  p_keyword: 'derivative',
  p_page: 1,
  p_page_size: 20
})
```

### Notes

- Filters are applied only when the parameter is not NULL.
- Results are ordered by `question.created_at` descending.

#### Function: public.get_question_detail — auth: anon, authenticated

Returns a single question with options and tags.

### Auth

`EXECUTE` is granted to `authenticated` and `anon`. The function runs as
`SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_id | bigint | yes | Question ID. |

### Returns

`json` object with the same fields as a `get_questions` result item, or
`null` when the question does not exist.

### Example (SQL)

```sql
select public.get_question_detail(p_id => 123);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('get_question_detail', {
  p_id: 123
})
```

### Notes

- Returns `null` if no question matches `p_id`.

### Tags functions

#### Function: public.get_tags — auth: authenticated, service_role

Returns a paginated list of tags, with optional search filter.

### Auth

`EXECUTE` is granted to `authenticated` and `service_role`. The function runs as
`SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_search | text | no | `ILIKE` match against `tag.name`. |
| p_limit | integer | no | Default `50`, clamped to `1..100`. |
| p_offset | integer | no | Default `0`, negative values become `0`. |

### Returns

`json` object with:

- `results`: array of `{id, name, created_at}`
- `count`: total matching tags
- `limit`: applied limit
- `offset`: applied offset

### Example (SQL)

```sql
select public.get_tags(p_search => 'math', p_limit => 20, p_offset => 0);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('get_tags', {
  p_search: 'math',
  p_limit: 20,
  p_offset: 0
})
```

#### Function: public.get_tag_detail — auth: authenticated, service_role

Returns a single tag by id.

### Auth

`EXECUTE` is granted to `authenticated` and `service_role`. The function runs as
`SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_id | bigint | yes | Tag ID. |

### Returns

`json` object `{id, name, created_at}` or `null` when not found.

### Example (SQL)

```sql
select public.get_tag_detail(p_id => 10);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('get_tag_detail', {
  p_id: 10
})
```

#### Function: public.create_tag — auth: authenticated, service_role

Creates a tag (upsert by name).

### Auth

`EXECUTE` is granted to `authenticated` and `service_role`. The function runs as
`SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_name | text | yes | Trimmed; empty value raises error. |

### Returns

`json` object `{id, name, created_at, inserted}` where `inserted`
indicates whether a new row was created.

### Example (SQL)

```sql
select public.create_tag(p_name => 'math');
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('create_tag', {
  p_name: 'math'
})
```

### Notes

- If a tag with the same name exists, the existing row is returned.

#### Function: public.update_tag — auth: authenticated, service_role

Updates a tag's name.

### Auth

`EXECUTE` is granted to `authenticated` and `service_role`. The function runs as
`SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_id | bigint | yes | Tag ID. |
| p_name | text | yes | Trimmed; empty value raises error. |

### Returns

`json` object `{id, name, created_at}` or `null` when not found.

### Example (SQL)

```sql
select public.update_tag(p_id => 10, p_name => 'calculus');
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('update_tag', {
  p_id: 10,
  p_name: 'calculus'
})
```

### Notes

- `p_name` is required.

#### Function: public.delete_tag — auth: authenticated, service_role

Deletes a tag.

### Auth

`EXECUTE` is granted to `authenticated` and `service_role`. The function runs as
`SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_id | bigint | yes | Tag ID. |

### Returns

`json` object `{success, id}` on success, or `{success: false, error: 'Tag not found'}`.

### Example (SQL)

```sql
select public.delete_tag(p_id => 10);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('delete_tag', {
  p_id: 10
})
```

### Notes

- Deleting a tag will cascade to `question_tag` and `exam_tag`.

### Question-tag functions

#### Function: public.set_question_tags — auth: service_role

Replaces all tags for a question.

### Auth

`EXECUTE` is granted to `service_role` only (admin/server-side). The function runs as
`SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_question_id | bigint | yes | Question ID. |
| p_tag_ids | bigint[] | no | New tag IDs; empty or NULL removes all tags. |

### Returns

`json` object `{question_id, removed, added}`.

### Example (SQL)

```sql
select public.set_question_tags(
  p_question_id => 123,
  p_tag_ids => '{1,2,3}'::bigint[]
);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('set_question_tags', {
  p_question_id: 123,
  p_tag_ids: [1, 2, 3]
})
```

### Notes

- Uses `question_tag` and ignores duplicates via `ON CONFLICT DO NOTHING`.

#### Function: public.add_question_tags — auth: service_role

Adds tags to a question without removing existing ones.

### Auth

`EXECUTE` is granted to `service_role` only (admin/server-side). The function runs as
`SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_question_id | bigint | yes | Question ID. |
| p_tag_ids | bigint[] | yes | Tag IDs to add. |

### Returns

`json` object `{question_id, added}`.

### Example (SQL)

```sql
select public.add_question_tags(
  p_question_id => 123,
  p_tag_ids => '{4,5}'::bigint[]
);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('add_question_tags', {
  p_question_id: 123,
  p_tag_ids: [4, 5]
})
```

### Notes

- Duplicate pairs are ignored via `ON CONFLICT DO NOTHING`.

#### Function: public.remove_question_tags — auth: service_role

Removes specific tags from a question.

### Auth

`EXECUTE` is granted to `service_role` only (admin/server-side). The function runs as
`SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_question_id | bigint | yes | Question ID. |
| p_tag_ids | bigint[] | yes | Tag IDs to remove. |

### Returns

`json` object `{question_id, removed}`.

### Example (SQL)

```sql
select public.remove_question_tags(
  p_question_id => 123,
  p_tag_ids => '{4,5}'::bigint[]
);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('remove_question_tags', {
  p_question_id: 123,
  p_tag_ids: [4, 5]
})
```

#### Function: public.add_tag_questions — auth: service_role

Adds many questions to a tag.

### Auth

`EXECUTE` is granted to `service_role` only (admin/server-side). The function runs as
`SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_tag_id | bigint | yes | Tag ID. |
| p_question_ids | bigint[] | yes | Question IDs to add. |

### Returns

`json` object `{tag_id, added}`.

### Example (SQL)

```sql
select public.add_tag_questions(
  p_tag_id => 9,
  p_question_ids => '{101,102}'::bigint[]
);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('add_tag_questions', {
  p_tag_id: 9,
  p_question_ids: [101, 102]
})
```

### Exams functions

#### Function: public.get_exam_detail — auth: authenticated

Returns an exam with all questions and options.

### Auth

`EXECUTE` is granted to `authenticated`. The function runs as
`SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_id | bigint | yes | Exam ID. |

### Returns

`json` object with `id`, `name`, `description`, `time_limit`, `publish`,
`created_at`, and `questions` (array of exam questions). Each question
includes `exam_question_id`, `order`, `points`, `id`, `content`,
`explanation`, `type`, `difficulty`, and `options`
(array of `{id, content, is_correct, order}`).

### Example (SQL)

```sql
select public.get_exam_detail(p_id => 10);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('get_exam_detail', {
  p_id: 10
})
```

### Notes

- The function does not check `publish` or `creator`; access control relies
  on grants/RLS and the caller.

#### Function: public.get_user_exams — auth: authenticated

Returns exams created by the current user.

### Auth

`EXECUTE` is granted to `authenticated`. The function runs as
`SECURITY DEFINER`.

### Parameters

None.

### Returns

`json` array of exams with `id`, `name`, `description`, `time_limit`,
`publish`, `created_at`, and `question_count`.

### Example (SQL)

```sql
select public.get_user_exams();
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('get_user_exams')
```

### Notes

- Uses `auth.uid()`; if not authenticated, returns an empty array.

#### Function: public.get_practice_exams — auth: anon, authenticated

Returns published exams plus the current user's own exams.

### Auth

`EXECUTE` is granted to `authenticated` and `anon`. The function runs as
`SECURITY DEFINER`.

### Parameters

None.

### Returns

`json` array of exams with `id`, `name`, `description`, `time_limit`,
`publish`, `created_at`, and `question_count`.

### Example (SQL)

```sql
select public.get_practice_exams();
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('get_practice_exams')
```

### Notes

- For anonymous callers, only `publish = true` exams are returned.

#### Function: public.save_exam_result — auth: authenticated

Persists an exam result and updates wrong-question tracking.

### Auth

`EXECUTE` is granted to `authenticated`. The function runs as
`SECURITY DEFINER` and raises an exception if not authenticated.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_exam_id | bigint | no | Nullable for ad-hoc exams. |
| p_exam_name | text | no | Defaults to empty string. |
| p_score | numeric | no | Defaults to `0`. |
| p_correct_count | integer | no | Defaults to `0`. |
| p_total_count | integer | no | Defaults to `0`. |
| p_duration_seconds | integer | no | Nullable. |
| p_answers_json | jsonb | no | Raw answers payload. |
| p_wrong_question_ids | bigint[] | no | Question IDs to track as wrong. |

### Returns

`json` object with `id` (exam_result id) and `success: true`.

### Example (SQL)

```sql
select public.save_exam_result(
  p_exam_id => 10,
  p_exam_name => 'Mock Exam A',
  p_score => 82,
  p_correct_count => 41,
  p_total_count => 50,
  p_wrong_question_ids => '{101,102}'::bigint[]
);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('save_exam_result', {
  p_exam_id: 10,
  p_exam_name: 'Mock Exam A',
  p_score: 82,
  p_correct_count: 41,
  p_total_count: 50,
  p_wrong_question_ids: [101, 102]
})
```

### Notes

- Inserts into `exam_result` and upserts `wrong_question` entries.
- If unauthenticated, raises `Authentication required`.

#### Function: public.get_exam_results — auth: authenticated

Returns exam results for the current user.

### Auth

`EXECUTE` is granted to `authenticated`. The function runs as
`SECURITY DEFINER`.

### Parameters

None.

### Returns

`json` array of results with `id`, `exam_id`, `exam_name`, `score`,
`correct_count`, `total_count`, `duration_seconds`, `completed_at`.

### Example (SQL)

```sql
select public.get_exam_results();
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('get_exam_results')
```

### Notes

- Ordered by `completed_at` descending.

#### Function: public.get_wrong_questions — auth: authenticated

Returns wrong questions with question details and options.

### Auth

`EXECUTE` is granted to `authenticated`. The function runs as
`SECURITY DEFINER`.

### Parameters

None.

### Returns

`json` array of objects with `id`, `wrong_count`, `last_wrong_at`,
`reviewed`, `question_id`, `content`, `type`, `difficulty`, `subject`,
`category`, and `options` (array of `{id, content, is_correct, order}`).

### Example (SQL)

```sql
select public.get_wrong_questions();
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('get_wrong_questions')
```

### Notes

- Ordered by `wrong_count` descending.

### Flashcards functions

#### Function: public.get_flashcards — auth: authenticated

Returns all flashcards for the current user, including question details.

### Auth

`EXECUTE` is granted to `authenticated`. The function runs as
`SECURITY DEFINER`.

### Parameters

None.

### Returns

`json` array of flashcards with `id`, `status`, `ease_factor`,
`interval_days`, `repetition`, `next_review_date`, `last_reviewed_at`,
`review_count`, `created_at`, and `question` (object with `id`, `content`,
`explanation`, and `options`).

### Example (SQL)

```sql
select public.get_flashcards();
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('get_flashcards')
```

### Notes

- Ordered by `flashcard.created_at` descending.

#### Function: public.get_due_flashcards — auth: authenticated

Returns due flashcards for the current user.

### Auth

`EXECUTE` is granted to `authenticated`. The function runs as
`SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_limit | integer | no | Maximum number of rows. Default `20`. |

### Returns

`json` array of flashcards (same structure as `get_flashcards`).

### Example (SQL)

```sql
select public.get_due_flashcards(p_limit => 20);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('get_due_flashcards', {
  p_limit: 20
})
```

### Notes

- Returns only cards where `next_review_date <= current_date`.
- Ordered by `next_review_date` ascending.

#### Function: public.review_flashcard — auth: authenticated

Updates a flashcard's schedule using the SM2 algorithm.

### Auth

`EXECUTE` is granted to `authenticated`. The function runs as
`SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_flashcard_id | bigint | yes | Flashcard ID belonging to the current user. |
| p_rating | integer | yes | 0=Again, 1=Hard, 2=Good, 3=Easy. |

### Returns

`json` object with `id`, `ease_factor`, `interval_days`, `repetition`,
`status`, `next_review_date`.

### Example (SQL)

```sql
select public.review_flashcard(p_flashcard_id => 5, p_rating => 2);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('review_flashcard', {
  p_flashcard_id: 5,
  p_rating: 2
})
```

### Notes

- Raises `Flashcard not found` if the card does not belong to the caller.

#### Function: public.get_flashcard_stats — auth: authenticated

Returns flashcard totals for the current user.

### Auth

`EXECUTE` is granted to `authenticated`. The function runs as
`SECURITY DEFINER`.

### Parameters

None.

### Returns

`json` object with `total`, `due`, `mastered`, `learning`.

### Example (SQL)

```sql
select public.get_flashcard_stats();
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('get_flashcard_stats')
```

### Notes

- `learning` counts all cards where `status != 'mastered'`.

### Bookmarks and analytics functions

#### Function: public.get_bookmarks — auth: authenticated

Returns bookmarked questions for the current user.

### Auth

`EXECUTE` is granted to `authenticated`. The function runs as
`SECURITY DEFINER`.

### Parameters

None.

### Returns

`json` array of objects with `id` (question_id), `bookmarked_at`, `content`,
`type`, `difficulty`, `subject`, `category`, and `options`
(array of `{id, content, is_correct, order}`).

### Example (SQL)

```sql
select public.get_bookmarks();
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('get_bookmarks')
```

### Notes

- Ordered by `bookmark.created_at` descending.

#### Function: public.get_user_analytics — auth: authenticated

Returns aggregated analytics for the current user.

### Auth

`EXECUTE` is granted to `authenticated`. The function runs as
`SECURITY DEFINER`.

### Parameters

None.

### Returns

`json` object with `total_exams`, `total_questions_answered`,
`total_correct`, `average_score`, `wrong_questions_count`,
`flashcard_count`, `bookmark_count`, and `recent_results` (array of up to
5 entries with `id`, `exam_name`, `score`, `completed_at`).

### Example (SQL)

```sql
select public.get_user_analytics();
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('get_user_analytics')
```

### Notes

- `average_score` is rounded to 1 decimal place.

### Discussion MVP functions

#### Function: public.get_discussions_mvp — auth: not granted in migrations

Returns a paginated list of discussions with author display names.

### Auth

`EXECUTE` grants are not defined in migrations; ensure the role has execute
permission in Supabase. The function runs as `SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_limit | integer | no | Max rows. Default `20`. |
| p_offset | integer | no | Offset. Default `0`. |

### Returns

Table rows with `id`, `title`, `body`, `user_id`, `user_email`,
`display_name`, `view_count`, `answer_count`, `created_at`.

### Example (SQL)

```sql
select * from public.get_discussions_mvp(p_limit => 20, p_offset => 0);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('get_discussions_mvp', {
  p_limit: 20,
  p_offset: 0
})
```

### Notes

- `display_name` falls back to Google name, then email prefix.

#### Function: public.get_discussion_detail_mvp — auth: not granted in migrations

Returns a discussion plus answers, handling locked answer bodies.

### Auth

`EXECUTE` grants are not defined in migrations; ensure the role has execute
permission in Supabase. The function runs as `SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_discussion_id | uuid | yes | Discussion ID. |
| p_user_id | uuid | no | Current user ID; controls locked answer visibility. |

### Returns

`json` object with:

- `discussion`: `{id, title, body, user_id, user_email, display_name, view_count, answer_count, created_at}`
- `answers`: array of `{id, body, is_locked, user_id, user_email, display_name, vote_count, unlock_count, created_at, user_vote}`

### Example (SQL)

```sql
select public.get_discussion_detail_mvp(
  p_discussion_id => '00000000-0000-0000-0000-000000000000',
  p_user_id => '11111111-1111-1111-1111-111111111111'
);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('get_discussion_detail_mvp', {
  p_discussion_id: discussionId,
  p_user_id: userId
})
```

### Notes

- Increments `view_count` on every call.
- If `p_user_id` is NULL, answer bodies are returned as NULL with
  `is_locked = true`.

#### Function: public.unlock_answer_mvp — auth: not granted in migrations

Unlocks an answer body using credits.

### Auth

`EXECUTE` grants are not defined in migrations; ensure the role has execute
permission in Supabase. The function runs as `SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_user_id | uuid | yes | Unlocking user. |
| p_answer_id | uuid | yes | Answer to unlock. |

### Returns

`json` object with `success`, `answer_body`, `credits_spent`,
`remaining_credits`, and optionally `message` or `error`.

### Example (SQL)

```sql
select public.unlock_answer_mvp(
  p_user_id => '11111111-1111-1111-1111-111111111111',
  p_answer_id => '22222222-2222-2222-2222-222222222222'
);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('unlock_answer_mvp', {
  p_user_id: userId,
  p_answer_id: answerId
})
```

### Notes

- Free for the answer author or discussion owner.
- Costs 20 credits otherwise; creates a `user_credits_mvp` row if needed.
- Error message strings are currently garbled due to encoding in the SQL
  migration; consider normalizing them if you want user-facing errors.

#### Function: public.cast_vote_mvp — auth: not granted in migrations

Casts an upvote or downvote on an answer.

### Auth

`EXECUTE` grants are not defined in migrations; ensure the role has execute
permission in Supabase. The function runs as `SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_user_id | uuid | yes | Voter user ID. |
| p_answer_id | uuid | yes | Answer to vote on. |
| p_vote_value | integer | yes | `1` for upvote, `-1` for downvote. |

### Returns

`json` object with `success`, `new_vote_count`, `reputation_delta`, and
optional `error`.

### Example (SQL)

```sql
select public.cast_vote_mvp(
  p_user_id => '11111111-1111-1111-1111-111111111111',
  p_answer_id => '22222222-2222-2222-2222-222222222222',
  p_vote_value => 1
);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('cast_vote_mvp', {
  p_user_id: userId,
  p_answer_id: answerId,
  p_vote_value: 1
})
```

### Notes

- Invalid `p_vote_value` returns `{ success: false, error: 'Invalid vote value' }`.
- Adjusts the answer author's credits and reputation.

#### Function: public.claim_daily_credits_mvp — auth: not granted in migrations

Claims daily credits for a user.

### Auth

`EXECUTE` grants are not defined in migrations; ensure the role has execute
permission in Supabase. The function runs as `SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_user_id | uuid | yes | User claiming credits. |

### Returns

`json` object with `success`, `credits_earned`, `new_balance`,
`next_claim_at`, or `error` when claimed too early.

### Example (SQL)

```sql
select public.claim_daily_credits_mvp(
  p_user_id => '11111111-1111-1111-1111-111111111111'
);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('claim_daily_credits_mvp', {
  p_user_id: userId
})
```

### Notes

- Awards 20 credits if the last claim was more than 24 hours ago.
- Error message strings are currently garbled due to encoding in the SQL
  migration; consider normalizing them if you want user-facing errors.

#### Function: public.get_user_credits_mvp — auth: not granted in migrations

Returns the current credits and reputation for a user.

### Auth

`EXECUTE` grants are not defined in migrations; ensure the role has execute
permission in Supabase. The function runs as `SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_user_id | uuid | yes | User to read. |

### Returns

`json` object with `credits`, `total_earned`, `total_spent`, `reputation`,
`last_daily_claim`, `can_claim_daily`.

### Example (SQL)

```sql
select public.get_user_credits_mvp(
  p_user_id => '11111111-1111-1111-1111-111111111111'
);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('get_user_credits_mvp', {
  p_user_id: userId
})
```

### Notes

- Creates a credits row with 100 initial credits if one does not exist.

### User profile functions

#### Function: public.update_user_display_name — auth: not granted in migrations

Updates a user's display name.

### Auth

`EXECUTE` grants are not defined in migrations; ensure the role has execute
permission in Supabase. The function runs as `SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_user_id | uuid | yes | User to update. |
| p_display_name | text | yes | Must be 2-50 characters after trim. |

### Returns

`json` object with `success`, `display_name`, `message`, or `error`.

### Example (SQL)

```sql
select public.update_user_display_name(
  p_user_id => '11111111-1111-1111-1111-111111111111',
  p_display_name => 'Kai'
);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('update_user_display_name', {
  p_user_id: userId,
  p_display_name: 'Kai'
})
```

### Notes

- The function does not verify `p_user_id = auth.uid()`; ensure the caller
  passes their own user id or add a check in the SQL.
- Error message strings are currently garbled due to encoding in the SQL
  migration; consider normalizing them if you want user-facing errors.

#### Function: public.get_user_profile — auth: not granted in migrations

Returns a user's profile and credits data.

### Auth

`EXECUTE` grants are not defined in migrations; ensure the role has execute
permission in Supabase. The function runs as `SECURITY DEFINER`.

### Parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| p_user_id | uuid | yes | User to read. |

### Returns

`json` object with `user_id`, `display_name`, `google_name`, `email`,
`credits`, `total_earned`, `total_spent`, `reputation`,
`effective_display_name`.

### Example (SQL)

```sql
select public.get_user_profile(
  p_user_id => '11111111-1111-1111-1111-111111111111'
);
```

### Example (Supabase JS)

```ts
const { data, error } = await supabase.rpc('get_user_profile', {
  p_user_id: userId
})
```

### Notes

- Creates a credits row with 100 initial credits if one does not exist.










