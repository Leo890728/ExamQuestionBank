-- batch_update_exam_questions RPC
-- Accepts a JSON array of { exam_question_id, order, points } and updates all rows
-- within a single transaction, avoiding unique constraint violations on (exam_id, order).

-- Step 1: Make the order constraint DEFERRABLE so it's checked at COMMIT, not per-statement
ALTER TABLE public.exam_question
  DROP CONSTRAINT IF EXISTS exam_question_order_unique;

ALTER TABLE public.exam_question
  ADD CONSTRAINT exam_question_order_unique
  UNIQUE (exam_id, "order")
  DEFERRABLE INITIALLY DEFERRED;

-- Step 2: Create the RPC function
CREATE OR REPLACE FUNCTION public.batch_update_exam_questions(
  p_exam_id BIGINT,
  p_updates JSONB  -- array of { "exam_question_id": int, "order": int, "points": numeric }
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  eq_id BIGINT;
  new_order SMALLINT;
  new_points DECIMAL(5,2);
BEGIN
  -- Verify the exam belongs to the current user
  IF NOT EXISTS (
    SELECT 1 FROM public.exam
    WHERE id = p_exam_id AND creator = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Exam not found or access denied';
  END IF;

  -- Update each exam_question row
  FOR item IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    eq_id     := (item ->> 'exam_question_id')::BIGINT;
    new_order := (item ->> 'order')::SMALLINT;
    new_points := COALESCE((item ->> 'points')::DECIMAL(5,2), NULL);

    UPDATE public.exam_question
    SET
      "order" = COALESCE(new_order, "order"),
      points  = COALESCE(new_points, points)
    WHERE id = eq_id
      AND exam_id = p_exam_id;
  END LOOP;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.batch_update_exam_questions(BIGINT, JSONB) TO authenticated;
