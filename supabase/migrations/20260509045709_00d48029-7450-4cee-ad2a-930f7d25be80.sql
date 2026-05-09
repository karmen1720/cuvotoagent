
-- Usage events: powers rate limiting, plan enforcement, and billing
CREATE TABLE public.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  tender_id uuid,
  tokens_used integer DEFAULT 0,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_events_org_type_time
  ON public.usage_events (organization_id, event_type, created_at DESC);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view usage events"
  ON public.usage_events FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

-- Inserts only via service role (edge functions). No client policy by design.

-- Plan limits helper: monthly AI call quota by plan
CREATE OR REPLACE FUNCTION public.plan_monthly_ai_limit(_plan plan_tier)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _plan
    WHEN 'trial' THEN 5
    WHEN 'starter' THEN 30
    WHEN 'professional' THEN 200
    WHEN 'enterprise' THEN 100000
    ELSE 5
  END;
$$;

-- Returns remaining AI calls this billing month for an org
CREATE OR REPLACE FUNCTION public.org_ai_quota_remaining(_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan plan_tier;
  _trial_ends timestamptz;
  _limit integer;
  _used integer;
BEGIN
  SELECT plan, trial_ends_at INTO _plan, _trial_ends
  FROM public.organizations WHERE id = _org_id;

  IF _plan IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'org_not_found');
  END IF;

  IF _plan = 'trial' AND _trial_ends IS NOT NULL AND _trial_ends < now() THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'trial_expired',
      'plan', _plan, 'limit', 0, 'used', 0, 'remaining', 0);
  END IF;

  _limit := public.plan_monthly_ai_limit(_plan);

  SELECT COUNT(*)::int INTO _used
  FROM public.usage_events
  WHERE organization_id = _org_id
    AND event_type IN ('analyze_tender', 'generate_proposal')
    AND created_at >= date_trunc('month', now());

  RETURN jsonb_build_object(
    'allowed', _used < _limit,
    'reason', CASE WHEN _used < _limit THEN 'ok' ELSE 'quota_exceeded' END,
    'plan', _plan,
    'limit', _limit,
    'used', _used,
    'remaining', GREATEST(_limit - _used, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.org_ai_quota_remaining(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.plan_monthly_ai_limit(plan_tier) TO authenticated;
