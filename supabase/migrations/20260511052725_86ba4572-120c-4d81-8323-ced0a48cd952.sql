-- Bootstrap trigger: when an organization is created, automatically add the
-- owner as a member and assign org_admin role. This fixes the chicken-and-egg
-- issue where RLS blocks the creator from inserting into organization_members
-- and user_roles right after creating the org.

CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id)
  VALUES (NEW.id, NEW.owner_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (NEW.owner_id, NEW.id, 'org_admin')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_organization();

-- Backfill: ensure every existing org has its owner as member + admin
INSERT INTO public.organization_members (organization_id, user_id)
SELECT o.id, o.owner_id FROM public.organizations o
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, organization_id, role)
SELECT o.owner_id, o.id, 'org_admin' FROM public.organizations o
ON CONFLICT DO NOTHING;