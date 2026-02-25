-- Fix get_exam_detail to include updated_at field
CREATE OR REPLACE FUNCTION get_exam_detail(p_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', e.id,
    'name', e.name,
    'description', e.description,
    'time_limit', e.time_limit,
    'publish', e.publish,
    'created_at', e.created_at,
    'updated_at', e.updated_at,
    'questions', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'exam_question_id', eq.id,
          'order', eq."order",
          'points', eq.points,
          'id', q.id,
          'content', q.content,
          'explanation', q.explanation,
          'type', q.type,
          'difficulty', q.difficulty,
          'options', (
            SELECT COALESCE(json_agg(
              json_build_object(
                'id', o.id,
                'content', o.content,
                'is_correct', o.is_correct,
                'order', o."order"
              ) ORDER BY o."order"
            ), '[]'::json)
            FROM question_option o
            WHERE o.question_id = q.id
          )
        ) ORDER BY eq."order"
      ), '[]'::json)
      FROM exam_question eq
      JOIN question q ON q.id = eq.question_id
      WHERE eq.exam_id = e.id
    )
  ) INTO result
  FROM exam e
  WHERE e.id = p_id;

  RETURN result;
END;
$$;
