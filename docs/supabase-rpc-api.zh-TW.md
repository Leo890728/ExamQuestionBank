# Supabase RPC API（繁體中文）

語言：繁體中文（台灣） | [English](supabase-rpc-api.md)

本文件說明 Supabase 中對外提供的 Postgres RPC 函式。
除非特別註明，函式位於 `public` schema，並以
`supabase.rpc('function_name', { ... })` 呼叫。

觸發器用的輔助函式（例如 `handle_updated_at`）不列在此。

## 目錄

- [Supabase RPC API（繁體中文）](#supabase-rpc-api繁體中文)
  - [RPC 函式索引](#rpc-函式索引)
    - [題目](#題目)
    - [標籤](#標籤)
    - [題目標籤](#題目標籤)
    - [測驗](#測驗)
    - [單字卡](#單字卡)
    - [書籤與分析](#書籤與分析)
    - [討論區 MVP](#討論區-mvp)
    - [使用者檔案](#使用者檔案)
  - [函式詳細說明](#函式詳細說明)
    - [題目（函式）](#題目函式)
      - [函式：public.add_question](#函式publicadd_question)
      - [函式：public.get_questions](#函式publicget_questions)
      - [函式：public.get_question_detail](#函式publicget_question_detail)
    - [標籤（函式）](#標籤函式)
      - [函式：public.get_tags](#函式publicget_tags)
      - [函式：public.get_tag_detail](#函式publicget_tag_detail)
      - [函式：public.create_tag](#函式publiccreate_tag)
      - [函式：public.update_tag](#函式publicupdate_tag)
      - [函式：public.delete_tag](#函式publicdelete_tag)
    - [題目標籤（函式）](#題目標籤函式)
      - [函式：public.set_question_tags](#函式publicset_question_tags)
      - [函式：public.add_question_tags](#函式publicadd_question_tags)
      - [函式：public.remove_question_tags](#函式publicremove_question_tags)
      - [函式：public.add_tag_questions](#函式publicadd_tag_questions)
    - [測驗（函式）](#測驗函式)
      - [函式：public.get_exam_detail](#函式publicget_exam_detail)
      - [函式：public.get_user_exams](#函式publicget_user_exams)
      - [函式：public.get_practice_exams](#函式publicget_practice_exams)
      - [函式：public.save_exam_result](#函式publicsave_exam_result)
      - [函式：public.get_exam_results](#函式publicget_exam_results)
      - [函式：public.get_wrong_questions](#函式publicget_wrong_questions)
    - [單字卡（函式）](#單字卡函式)
      - [函式：public.get_flashcards](#函式publicget_flashcards)
      - [函式：public.get_due_flashcards](#函式publicget_due_flashcards)
      - [函式：public.review_flashcard](#函式publicreview_flashcard)
      - [函式：public.get_flashcard_stats](#函式publicget_flashcard_stats)
    - [書籤與分析（函式）](#書籤與分析函式)
      - [函式：public.get_bookmarks](#函式publicget_bookmarks)
      - [函式：public.get_user_analytics](#函式publicget_user_analytics)
    - [討論區 MVP（函式）](#討論區-mvp函式)
      - [函式：public.get_discussions_mvp](#函式publicget_discussions_mvp)
      - [函式：public.get_discussion_detail_mvp](#函式publicget_discussion_detail_mvp)
      - [函式：public.unlock_answer_mvp](#函式publicunlock_answer_mvp)
      - [函式：public.cast_vote_mvp](#函式publiccast_vote_mvp)
      - [函式：public.claim_daily_credits_mvp](#函式publicclaim_daily_credits_mvp)
      - [函式：public.get_user_credits_mvp](#函式publicget_user_credits_mvp)
    - [使用者檔案（函式）](#使用者檔案函式)
      - [函式：public.update_user_display_name](#函式publicupdate_user_display_name)
      - [函式：public.get_user_profile](#函式publicget_user_profile)

## RPC 函式索引

權限圖例：`anon`、`authenticated`、`service_role`。若 migration 未授權，會標示為 `migration 未授權`。

### 題目

- `public.get_questions(p_subject text default null, p_difficulty text default null, p_type text default null, p_year integer default null, p_keyword text default null, p_page integer default 1, p_page_size integer default 20) returns json` — `anon`, `authenticated`
- `public.get_question_detail(p_id bigint) returns json` — `anon`, `authenticated`
- `public.add_question(content text, explanation text default null, question_type text default null, difficulty text default null, subject text default null, category text default null, year smallint default null, source text default null, options jsonb default '[]'::jsonb, tag_ids bigint[] default null, creator uuid default null, status text default null) returns bigint` — `authenticated`

### 標籤

- `public.get_tags(p_search text default null, p_limit integer default 50, p_offset integer default 0) returns json` — `authenticated`, `service_role`
- `public.get_tag_detail(p_id bigint) returns json` — `authenticated`, `service_role`
- `public.create_tag(p_name text) returns json` — `authenticated`, `service_role`
- `public.update_tag(p_id bigint, p_name text) returns json` — `authenticated`, `service_role`
- `public.delete_tag(p_id bigint) returns json` — `authenticated`, `service_role`

### 題目標籤

- `public.set_question_tags(p_question_id bigint, p_tag_ids bigint[]) returns json` — `service_role`
- `public.add_question_tags(p_question_id bigint, p_tag_ids bigint[]) returns json` — `service_role`
- `public.remove_question_tags(p_question_id bigint, p_tag_ids bigint[]) returns json` — `service_role`
- `public.add_tag_questions(p_tag_id bigint, p_question_ids bigint[]) returns json` — `service_role`

### 測驗

- `public.get_exam_detail(p_id bigint) returns json` — `authenticated`
- `public.get_user_exams() returns json` — `authenticated`
- `public.get_practice_exams() returns json` — `anon`, `authenticated`
- `public.save_exam_result(p_exam_id bigint default null, p_exam_name text default '', p_score numeric default 0, p_correct_count integer default 0, p_total_count integer default 0, p_duration_seconds integer default null, p_answers_json jsonb default null, p_wrong_question_ids bigint[] default null) returns json` — `authenticated`
- `public.get_exam_results() returns json` — `authenticated`
- `public.get_wrong_questions() returns json` — `authenticated`

### 單字卡

- `public.get_flashcards() returns json` — `authenticated`
- `public.get_due_flashcards(p_limit integer default 20) returns json` — `authenticated`
- `public.review_flashcard(p_flashcard_id bigint, p_rating integer) returns json` — `authenticated`
- `public.get_flashcard_stats() returns json` — `authenticated`

### 書籤與分析

- `public.get_bookmarks() returns json` — `authenticated`
- `public.get_user_analytics() returns json` — `authenticated`

### 討論區 MVP

- `public.get_discussions_mvp(p_limit integer default 20, p_offset integer default 0) returns table (id uuid, title text, body text, user_id uuid, user_email text, display_name text, view_count integer, answer_count integer, created_at timestamptz)` — `migration 未授權`
- `public.get_discussion_detail_mvp(p_discussion_id uuid, p_user_id uuid default null) returns json` — `migration 未授權`
- `public.unlock_answer_mvp(p_user_id uuid, p_answer_id uuid) returns json` — `migration 未授權`
- `public.cast_vote_mvp(p_user_id uuid, p_answer_id uuid, p_vote_value integer) returns json` — `migration 未授權`
- `public.claim_daily_credits_mvp(p_user_id uuid) returns json` — `migration 未授權`
- `public.get_user_credits_mvp(p_user_id uuid) returns json` — `migration 未授權`

### 使用者檔案

- `public.update_user_display_name(p_user_id uuid, p_display_name text) returns json` — `migration 未授權`
- `public.get_user_profile(p_user_id uuid) returns json` — `migration 未授權`
## 函式詳細說明

### 題目（函式）

#### 函式：public.add_question — 權限：authenticated

建立一題 `public.question`，並新增相關的選項到
`public.question_option`，以及標籤關聯到 `public.question_tag`。

##### 權限

`EXECUTE` 授權給 `authenticated` 角色。函式以
`SECURITY DEFINER` 執行，並在可用時將 `creator` 設為 `auth.uid()`。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| content | text | 是 | 會 `trim`；空字串會拋出錯誤。 |
| explanation | text | 否 | 空字串會轉為 NULL。 |
| question_type | text | 否 | 接受 `essay` 或 `multipleChoice`。未提供或無效時，有選項就用 `multipleChoice`，否則用 `essay`。 |
| difficulty | text | 否 | 接受 `easy`、`normal`、`hard`、`insane`。`medium` 會映射為 `normal`，其他值回落到 `normal`。 |
| subject | text | 否 | 空字串會轉為 NULL。 |
| category | text | 否 | 空字串會轉為 NULL。 |
| year | smallint | 否 | 寫入題目年份。 |
| source | text | 否 | 空字串會轉為 NULL。 |
| options | jsonb | 否 | 選項物件陣列。非陣列或空陣列代表無選項。 |
| tag_ids | bigint[] | 否 | 要插入 `public.question_tag` 的標籤 ID。 |
| creator | uuid | 否 | 只在 `auth.uid()` 為 NULL 時使用（例如 service role）。 |
| status | text | 否 | 為相容性保留但會被忽略（Supabase schema 無此欄位）。 |

##### options 格式

每個選項物件接受：

| 欄位 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| content | text | 是 | 空內容會被略過。 |
| is_correct | boolean | 否 | 預設 `false`。 |
| order | smallint | 否 | 預設為陣列順序（1..n）。 |

若提供重複的 `order`，會因 `question_option` 的
`(question_id, order)` 唯一限制而失敗。

##### 回傳

`bigint` - 新建立的 `question.id`。

##### 範例（SQL）

```sql
select public.add_question(
  content => 'Sample question?',
  question_type => 'multipleChoice',
  difficulty => 'normal',
  options => '[{"content":"A","is_correct":true},{"content":"B","is_correct":false}]'::jsonb,
  tag_ids => '{1,2}'::bigint[]
);
```

##### 範例（Supabase JS）

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

##### 備註

- `public.question.type` 使用 `public.question_type` enum。
- `public.question.difficulty` 使用 `public.question_difficulty` enum。
- 函式會 `trim` 文字欄位，並將空字串轉為 NULL（適用者）。

#### 函式：public.get_questions — 權限：anon、authenticated

回傳含選項與標籤的題目清單（支援分頁）。

##### 權限

`EXECUTE` 授權給 `authenticated` 與 `anon`。函式以
`SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_subject | text | 否 | 精準比對 `question.subject`。 |
| p_difficulty | text | 否 | 比對 `question.difficulty::text`。 |
| p_type | text | 否 | 比對 `question.type::text`。 |
| p_year | integer | 否 | 比對 `question.year`。 |
| p_keyword | text | 否 | 以 `ILIKE` 搜尋 `question.content`。 |
| p_page | integer | 否 | 1 起算頁碼，預設 `1`。 |
| p_page_size | integer | 否 | 每頁筆數，預設 `20`。 |

##### 回傳

`json` 物件，包含：

- `results`: 題目陣列
- `count`: 符合條件的總數
- `page`: 當前頁
- `page_size`: 每頁筆數

`results` 每筆包含 `id`, `content`, `explanation`, `type`,
`difficulty`, `subject`, `category`, `year`, `source`, `created_at`,
`options`（`{id, content, is_correct, order}` 陣列）與 `tags`
（`{id, name}` 陣列）。

##### 範例（SQL）

```sql
select public.get_questions(
  p_subject => 'math',
  p_keyword => 'derivative',
  p_page => 1,
  p_page_size => 20
);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('get_questions', {
  p_subject: 'math',
  p_keyword: 'derivative',
  p_page: 1,
  p_page_size: 20
})
```

##### 備註

- 僅在參數非 NULL 時套用對應篩選。
- 依 `question.created_at` 由新到舊排序。

#### 函式：public.get_question_detail — 權限：anon、authenticated

回傳單一題目的完整內容（含選項與標籤）。

##### 權限

`EXECUTE` 授權給 `authenticated` 與 `anon`。函式以
`SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_id | bigint | 是 | 題目 ID。 |

##### 回傳

`json` 物件，欄位與 `get_questions` 中的單筆結果相同；若不存在則回傳
`null`。

##### 範例（SQL）

```sql
select public.get_question_detail(p_id => 123);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('get_question_detail', {
  p_id: 123
})
```

##### 備註

- 若無符合 `p_id` 的題目，回傳 `null`。

### 標籤（函式）

#### 函式：public.get_tags — 權限：authenticated、service_role

回傳標籤清單（支援搜尋）。

##### 權限

`EXECUTE` 授權給 `authenticated` 與 `service_role`。函式以
`SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_search | text | 否 | 以 `ILIKE` 搜尋 `tag.name`。 |
| p_limit | integer | 否 | 預設 `50`，範圍限制 `1..100`。 |
| p_offset | integer | 否 | 預設 `0`，負值會視為 `0`。 |

##### 回傳

`json` 物件，包含：

- `results`: `{id, name, created_at}` 陣列
- `count`: 符合條件的總數
- `limit`: 實際使用的 limit
- `offset`: 實際使用的 offset

##### 範例（SQL）

```sql
select public.get_tags(p_search => 'math', p_limit => 20, p_offset => 0);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('get_tags', {
  p_search: 'math',
  p_limit: 20,
  p_offset: 0
})
```

#### 函式：public.get_tag_detail — 權限：authenticated、service_role

以 ID 取得單一標籤。

##### 權限

`EXECUTE` 授權給 `authenticated` 與 `service_role`。函式以
`SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_id | bigint | 是 | 標籤 ID。 |

##### 回傳

`json` 物件 `{id, name, created_at}`，若不存在則回傳 `null`。

##### 範例（SQL）

```sql
select public.get_tag_detail(p_id => 10);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('get_tag_detail', {
  p_id: 10
})
```

#### 函式：public.create_tag — 權限：authenticated、service_role

建立標籤（依名稱進行 upsert）。

##### 權限

`EXECUTE` 授權給 `authenticated` 與 `service_role`。函式以
`SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_name | text | 是 | 會 `trim`；空值會拋錯。 |

##### 回傳

`json` 物件 `{id, name, created_at, inserted}`，其中
`inserted` 表示是否為新建資料列。

##### 範例（SQL）

```sql
select public.create_tag(p_name => 'math');
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('create_tag', {
  p_name: 'math'
})
```

##### 備註

- 若名稱已存在，會回傳既有資料列。

#### 函式：public.update_tag — 權限：authenticated、service_role

更新標籤名稱。

##### 權限

`EXECUTE` 授權給 `authenticated` 與 `service_role`。函式以
`SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_id | bigint | 是 | 標籤 ID。 |
| p_name | text | 是 | 會 `trim`；空值會拋錯。 |

##### 回傳

`json` 物件 `{id, name, created_at}`，若不存在則回傳 `null`。

##### 範例（SQL）

```sql
select public.update_tag(p_id => 10, p_name => 'calculus');
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('update_tag', {
  p_id: 10,
  p_name: 'calculus'
})
```

##### 備註

- `p_name` 為必填。

#### 函式：public.delete_tag — 權限：authenticated、service_role

刪除標籤。

##### 權限

`EXECUTE` 授權給 `authenticated` 與 `service_role`。函式以
`SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_id | bigint | 是 | 標籤 ID。 |

##### 回傳

成功時回傳 `{success, id}`，找不到時回傳
`{success: false, error: 'Tag not found'}`。

##### 範例（SQL）

```sql
select public.delete_tag(p_id => 10);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('delete_tag', {
  p_id: 10
})
```

##### 備註

- 刪除標籤會連動刪除 `question_tag` 與 `exam_tag`。
### 題目標籤（函式）

#### 函式：public.set_question_tags — 權限：service_role

取代題目的全部標籤。

##### 權限

僅 `service_role`（管理端/伺服器端）可執行。函式以
`SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_question_id | bigint | 是 | 題目 ID。 |
| p_tag_ids | bigint[] | 否 | 新標籤 ID；空或 NULL 代表清空。 |

##### 回傳

`json` 物件 `{question_id, removed, added}`。

##### 範例（SQL）

```sql
select public.set_question_tags(
  p_question_id => 123,
  p_tag_ids => '{1,2,3}'::bigint[]
);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('set_question_tags', {
  p_question_id: 123,
  p_tag_ids: [1, 2, 3]
})
```

##### 備註

- 透過 `question_tag` 建立關聯，重複資料會被忽略。

#### 函式：public.add_question_tags — 權限：service_role

新增題目的標籤，不會移除既有標籤。

##### 權限

僅 `service_role`（管理端/伺服器端）可執行。函式以
`SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_question_id | bigint | 是 | 題目 ID。 |
| p_tag_ids | bigint[] | 是 | 要新增的標籤 ID。 |

##### 回傳

`json` 物件 `{question_id, added}`。

##### 範例（SQL）

```sql
select public.add_question_tags(
  p_question_id => 123,
  p_tag_ids => '{4,5}'::bigint[]
);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('add_question_tags', {
  p_question_id: 123,
  p_tag_ids: [4, 5]
})
```

##### 備註

- 重複關聯會被忽略。

#### 函式：public.remove_question_tags — 權限：service_role

移除題目的指定標籤。

##### 權限

僅 `service_role`（管理端/伺服器端）可執行。函式以
`SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_question_id | bigint | 是 | 題目 ID。 |
| p_tag_ids | bigint[] | 是 | 要移除的標籤 ID。 |

##### 回傳

`json` 物件 `{question_id, removed}`。

##### 範例（SQL）

```sql
select public.remove_question_tags(
  p_question_id => 123,
  p_tag_ids => '{4,5}'::bigint[]
);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('remove_question_tags', {
  p_question_id: 123,
  p_tag_ids: [4, 5]
})
```

#### 函式：public.add_tag_questions — 權限：service_role

為標籤新增多個題目。

##### 權限

僅 `service_role`（管理端/伺服器端）可執行。函式以
`SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_tag_id | bigint | 是 | 標籤 ID。 |
| p_question_ids | bigint[] | 是 | 題目 ID 陣列。 |

##### 回傳

`json` 物件 `{tag_id, added}`。

##### 範例（SQL）

```sql
select public.add_tag_questions(
  p_tag_id => 9,
  p_question_ids => '{101,102}'::bigint[]
);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('add_tag_questions', {
  p_tag_id: 9,
  p_question_ids: [101, 102]
})
```
### 測驗（函式）

#### 函式：public.get_exam_detail — 權限：authenticated

回傳測驗資料（含所有題目與選項）。

##### 權限

`EXECUTE` 授權給 `authenticated`。函式以
`SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_id | bigint | 是 | 測驗 ID。 |

##### 回傳

`json` 物件，包含 `id`, `name`, `description`, `time_limit`,
`publish`, `created_at`，以及 `questions`（題目陣列）。每題包含
`exam_question_id`, `order`, `points`, `id`, `content`,
`explanation`, `type`, `difficulty`, `options`
（`{id, content, is_correct, order}` 陣列）。

##### 範例（SQL）

```sql
select public.get_exam_detail(p_id => 10);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('get_exam_detail', {
  p_id: 10
})
```

##### 備註

- 未檢查 `publish` 或 `creator`；存取控制仰賴授權/RLS 與呼叫端。

#### 函式：public.get_user_exams — 權限：authenticated

回傳當前使用者建立的測驗清單。

##### 權限

`EXECUTE` 授權給 `authenticated`。函式以
`SECURITY DEFINER` 執行。

##### 參數

無。

##### 回傳

`json` 陣列，包含 `id`, `name`, `description`, `time_limit`,
`publish`, `created_at`, `question_count`。

##### 範例（SQL）

```sql
select public.get_user_exams();
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('get_user_exams')
```

##### 備註

- 透過 `auth.uid()` 取得使用者；未登入則回傳空陣列。

#### 函式：public.get_practice_exams — 權限：anon、authenticated

回傳已發布的測驗，以及當前使用者自己的測驗。

##### 權限

`EXECUTE` 授權給 `authenticated` 與 `anon`。函式以
`SECURITY DEFINER` 執行。

##### 參數

無。

##### 回傳

`json` 陣列，包含 `id`, `name`, `description`, `time_limit`,
`publish`, `created_at`, `question_count`。

##### 範例（SQL）

```sql
select public.get_practice_exams();
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('get_practice_exams')
```

##### 備註

- 匿名呼叫者只會取得 `publish = true` 的測驗。

#### 函式：public.save_exam_result — 權限：authenticated

保存測驗結果並更新錯題追蹤。

##### 權限

`EXECUTE` 授權給 `authenticated`。函式以
`SECURITY DEFINER` 執行，未登入會拋出例外。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_exam_id | bigint | 否 | 可為 NULL（例如自訂測驗）。 |
| p_exam_name | text | 否 | 預設空字串。 |
| p_score | numeric | 否 | 預設 `0`。 |
| p_correct_count | integer | 否 | 預設 `0`。 |
| p_total_count | integer | 否 | 預設 `0`。 |
| p_duration_seconds | integer | 否 | 可為 NULL。 |
| p_answers_json | jsonb | 否 | 原始答題資料。 |
| p_wrong_question_ids | bigint[] | 否 | 要記錄為錯題的題目 ID。 |

##### 回傳

`json` 物件，包含 `id`（exam_result id）與 `success: true`。

##### 範例（SQL）

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

##### 範例（Supabase JS）

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

##### 備註

- 會寫入 `exam_result`，並 upsert `wrong_question` 記錄。
- 未登入時會拋出 `Authentication required`。

#### 函式：public.get_exam_results — 權限：authenticated

回傳當前使用者的測驗結果清單。

##### 權限

`EXECUTE` 授權給 `authenticated`。函式以
`SECURITY DEFINER` 執行。

##### 參數

無。

##### 回傳

`json` 陣列，包含 `id`, `exam_id`, `exam_name`, `score`,
`correct_count`, `total_count`, `duration_seconds`, `completed_at`。

##### 範例（SQL）

```sql
select public.get_exam_results();
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('get_exam_results')
```

##### 備註

- 依 `completed_at` 由新到舊排序。

#### 函式：public.get_wrong_questions — 權限：authenticated

回傳錯題清單（含題目內容與選項）。

##### 權限

`EXECUTE` 授權給 `authenticated`。函式以
`SECURITY DEFINER` 執行。

##### 參數

無。

##### 回傳

`json` 陣列，包含 `id`, `wrong_count`, `last_wrong_at`,
`reviewed`, `question_id`, `content`, `type`, `difficulty`, `subject`,
`category`, `options`（`{id, content, is_correct, order}` 陣列）。

##### 範例（SQL）

```sql
select public.get_wrong_questions();
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('get_wrong_questions')
```

##### 備註

- 依 `wrong_count` 由高到低排序。

### 單字卡（函式）

#### 函式：public.get_flashcards — 權限：authenticated

回傳當前使用者所有單字卡（含題目細節）。

##### 權限

`EXECUTE` 授權給 `authenticated`。函式以
`SECURITY DEFINER` 執行。

##### 參數

無。

##### 回傳

`json` 陣列，包含 `id`, `status`, `ease_factor`, `interval_days`,
`repetition`, `next_review_date`, `last_reviewed_at`, `review_count`,
`created_at`，以及 `question`（含 `id`, `content`, `explanation`,
`options`）。

##### 範例（SQL）

```sql
select public.get_flashcards();
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('get_flashcards')
```

##### 備註

- 依 `flashcard.created_at` 由新到舊排序。

#### 函式：public.get_due_flashcards — 權限：authenticated

回傳到期需複習的單字卡。

##### 權限

`EXECUTE` 授權給 `authenticated`。函式以
`SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_limit | integer | 否 | 最高回傳筆數，預設 `20`。 |

##### 回傳

`json` 陣列（結構同 `get_flashcards`）。

##### 範例（SQL）

```sql
select public.get_due_flashcards(p_limit => 20);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('get_due_flashcards', {
  p_limit: 20
})
```

##### 備註

- 僅回傳 `next_review_date <= current_date` 的卡片。
- 依 `next_review_date` 由近到遠排序。

#### 函式：public.review_flashcard — 權限：authenticated

使用 SM2 演算法更新單字卡排程。

##### 權限

`EXECUTE` 授權給 `authenticated`。函式以
`SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_flashcard_id | bigint | 是 | 必須屬於當前使用者的卡片 ID。 |
| p_rating | integer | 是 | 0=重來、1=困難、2=普通、3=容易。 |

##### 回傳

`json` 物件，包含 `id`, `ease_factor`, `interval_days`,
`repetition`, `status`, `next_review_date`。

##### 範例（SQL）

```sql
select public.review_flashcard(p_flashcard_id => 5, p_rating => 2);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('review_flashcard', {
  p_flashcard_id: 5,
  p_rating: 2
})
```

##### 備註

- 若卡片不屬於呼叫者，會拋出 `Flashcard not found`。

#### 函式：public.get_flashcard_stats — 權限：authenticated

回傳當前使用者的單字卡統計。

##### 權限

`EXECUTE` 授權給 `authenticated`。函式以
`SECURITY DEFINER` 執行。

##### 參數

無。

##### 回傳

`json` 物件，包含 `total`, `due`, `mastered`, `learning`。

##### 範例（SQL）

```sql
select public.get_flashcard_stats();
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('get_flashcard_stats')
```

##### 備註

- `learning` 計算所有 `status != 'mastered'` 的卡片。

### 書籤與分析（函式）

#### 函式：public.get_bookmarks — 權限：authenticated

回傳當前使用者的書籤題目。

##### 權限

`EXECUTE` 授權給 `authenticated`。函式以
`SECURITY DEFINER` 執行。

##### 參數

無。

##### 回傳

`json` 陣列，包含 `id`（question_id）、`bookmarked_at`,
`content`, `type`, `difficulty`, `subject`, `category`, `options`
（`{id, content, is_correct, order}` 陣列）。

##### 範例（SQL）

```sql
select public.get_bookmarks();
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('get_bookmarks')
```

##### 備註

- 依 `bookmark.created_at` 由新到舊排序。

#### 函式：public.get_user_analytics — 權限：authenticated

回傳當前使用者的統計分析。

##### 權限

`EXECUTE` 授權給 `authenticated`。函式以
`SECURITY DEFINER` 執行。

##### 參數

無。

##### 回傳

`json` 物件，包含 `total_exams`, `total_questions_answered`,
`total_correct`, `average_score`, `wrong_questions_count`,
`flashcard_count`, `bookmark_count`, 以及 `recent_results`
（最多 5 筆：`id`, `exam_name`, `score`, `completed_at`）。

##### 範例（SQL）

```sql
select public.get_user_analytics();
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('get_user_analytics')
```

##### 備註

- `average_score` 會四捨五入到小數點 1 位。

### 討論區 MVP（函式）

#### 函式：public.get_discussions_mvp — 權限：migration 未授權

回傳討論串清單（含作者顯示名稱）。

##### 權限

遷移中未定義 `EXECUTE` 授權；請在 Supabase 中確認角色權限。
函式以 `SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_limit | integer | 否 | 最大筆數，預設 `20`。 |
| p_offset | integer | 否 | 偏移量，預設 `0`。 |

##### 回傳

表格結果：`id`, `title`, `body`, `user_id`, `user_email`,
`display_name`, `view_count`, `answer_count`, `created_at`。

##### 範例（SQL）

```sql
select * from public.get_discussions_mvp(p_limit => 20, p_offset => 0);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('get_discussions_mvp', {
  p_limit: 20,
  p_offset: 0
})
```

##### 備註

- `display_name` 會依序 fallback 至 Google 名稱、email 前綴。

#### 函式：public.get_discussion_detail_mvp — 權限：migration 未授權

回傳討論串與回覆，並處理鎖定內容。

##### 權限

遷移中未定義 `EXECUTE` 授權；請在 Supabase 中確認角色權限。
函式以 `SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_discussion_id | uuid | 是 | 討論串 ID。 |
| p_user_id | uuid | 否 | 當前使用者 ID，用於判斷可見內容。 |

##### 回傳

`json` 物件，包含：

- `discussion`: `{id, title, body, user_id, user_email, display_name, view_count, answer_count, created_at}`
- `answers`: `{id, body, is_locked, user_id, user_email, display_name, vote_count, unlock_count, created_at, user_vote}` 陣列

##### 範例（SQL）

```sql
select public.get_discussion_detail_mvp(
  p_discussion_id => '00000000-0000-0000-0000-000000000000',
  p_user_id => '11111111-1111-1111-1111-111111111111'
);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('get_discussion_detail_mvp', {
  p_discussion_id: discussionId,
  p_user_id: userId
})
```

##### 備註

- 每次呼叫都會增加 `view_count`。
- 若 `p_user_id` 為 NULL，回覆內容為 NULL 且 `is_locked = true`。

#### 函式：public.unlock_answer_mvp — 權限：migration 未授權

使用點數解鎖回覆內容。

##### 權限

遷移中未定義 `EXECUTE` 授權；請在 Supabase 中確認角色權限。
函式以 `SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_user_id | uuid | 是 | 解鎖者使用者 ID。 |
| p_answer_id | uuid | 是 | 要解鎖的回覆 ID。 |

##### 回傳

`json` 物件，包含 `success`, `answer_body`, `credits_spent`,
`remaining_credits`，並可能包含 `message` 或 `error`。

##### 範例（SQL）

```sql
select public.unlock_answer_mvp(
  p_user_id => '11111111-1111-1111-1111-111111111111',
  p_answer_id => '22222222-2222-2222-2222-222222222222'
);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('unlock_answer_mvp', {
  p_user_id: userId,
  p_answer_id: answerId
})
```

##### 備註

- 回覆作者或討論串作者可免費存取。
- 否則需 20 點；若尚無 `user_credits_mvp`，會自動建立。
- 錯誤訊息字串在 SQL migration 中有編碼問題，若要用於前端可考慮統一處理。

#### 函式：public.cast_vote_mvp — 權限：migration 未授權

對回覆進行投票（正/負）。

##### 權限

遷移中未定義 `EXECUTE` 授權；請在 Supabase 中確認角色權限。
函式以 `SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_user_id | uuid | 是 | 投票者使用者 ID。 |
| p_answer_id | uuid | 是 | 回覆 ID。 |
| p_vote_value | integer | 是 | `1` 代表讚，`-1` 代表噓。 |

##### 回傳

`json` 物件，包含 `success`, `new_vote_count`, `reputation_delta`，
與可能的 `error`。

##### 範例（SQL）

```sql
select public.cast_vote_mvp(
  p_user_id => '11111111-1111-1111-1111-111111111111',
  p_answer_id => '22222222-2222-2222-2222-222222222222',
  p_vote_value => 1
);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('cast_vote_mvp', {
  p_user_id: userId,
  p_answer_id: answerId,
  p_vote_value: 1
})
```

##### 備註

- `p_vote_value` 非 `-1/1` 時回傳 `{ success: false, error: 'Invalid vote value' }`。
- 會調整回覆作者的點數與聲望。

#### 函式：public.claim_daily_credits_mvp — 權限：migration 未授權

領取每日點數。

##### 權限

遷移中未定義 `EXECUTE` 授權；請在 Supabase 中確認角色權限。
函式以 `SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_user_id | uuid | 是 | 領取者使用者 ID。 |

##### 回傳

`json` 物件，包含 `success`, `credits_earned`, `new_balance`,
`next_claim_at`，或在過早領取時回傳 `error`。

##### 範例（SQL）

```sql
select public.claim_daily_credits_mvp(
  p_user_id => '11111111-1111-1111-1111-111111111111'
);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('claim_daily_credits_mvp', {
  p_user_id: userId
})
```

##### 備註

- 每 24 小時可領取 20 點。
- 錯誤訊息字串在 SQL migration 中有編碼問題，若要用於前端可考慮統一處理。

#### 函式：public.get_user_credits_mvp — 權限：migration 未授權

回傳使用者的點數與聲望資訊。

##### 權限

遷移中未定義 `EXECUTE` 授權；請在 Supabase 中確認角色權限。
函式以 `SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_user_id | uuid | 是 | 要讀取的使用者 ID。 |

##### 回傳

`json` 物件，包含 `credits`, `total_earned`, `total_spent`,
`reputation`, `last_daily_claim`, `can_claim_daily`。

##### 範例（SQL）

```sql
select public.get_user_credits_mvp(
  p_user_id => '11111111-1111-1111-1111-111111111111'
);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('get_user_credits_mvp', {
  p_user_id: userId
})
```

##### 備註

- 若無資料列，會先建立一筆（初始 100 點）。

### 使用者檔案（函式）

#### 函式：public.update_user_display_name — 權限：migration 未授權

更新使用者顯示名稱。

##### 權限

遷移中未定義 `EXECUTE` 授權；請在 Supabase 中確認角色權限。
函式以 `SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_user_id | uuid | 是 | 要更新的使用者 ID。 |
| p_display_name | text | 是 | `trim` 後必須 2-50 字元。 |

##### 回傳

`json` 物件，包含 `success`, `display_name`, `message` 或 `error`。

##### 範例（SQL）

```sql
select public.update_user_display_name(
  p_user_id => '11111111-1111-1111-1111-111111111111',
  p_display_name => 'Kai'
);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('update_user_display_name', {
  p_user_id: userId,
  p_display_name: 'Kai'
})
```

##### 備註

- 函式未驗證 `p_user_id = auth.uid()`；請由呼叫端保證或在 SQL 中補上檢查。
- 錯誤訊息字串在 SQL migration 中有編碼問題，若要用於前端可考慮統一處理。

#### 函式：public.get_user_profile — 權限：migration 未授權

回傳使用者檔案與點數資訊。

##### 權限

遷移中未定義 `EXECUTE` 授權；請在 Supabase 中確認角色權限。
函式以 `SECURITY DEFINER` 執行。

##### 參數

| 名稱 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| p_user_id | uuid | 是 | 要讀取的使用者 ID。 |

##### 回傳

`json` 物件，包含 `user_id`, `display_name`, `google_name`, `email`,
`credits`, `total_earned`, `total_spent`, `reputation`,
`effective_display_name`。

##### 範例（SQL）

```sql
select public.get_user_profile(
  p_user_id => '11111111-1111-1111-1111-111111111111'
);
```

##### 範例（Supabase JS）

```ts
const { data, error } = await supabase.rpc('get_user_profile', {
  p_user_id: userId
})
```

##### 備註

- 若無資料列，會先建立一筆（初始 100 點）。











