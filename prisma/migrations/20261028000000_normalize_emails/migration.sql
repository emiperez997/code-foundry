-- Normaliza emails existentes a minúsculas (login, registro e invitaciones ya
-- comparan en minúsculas). Falla de forma segura si habría duplicados.
DO $$
DECLARE
  dup_count integer;
BEGIN
  SELECT count(*) INTO dup_count FROM (
    SELECT lower("email") FROM "users" GROUP BY lower("email") HAVING count(*) > 1
  ) d;

  IF dup_count > 0 THEN
    RAISE EXCEPTION 'No se puede normalizar users.email: % email(s) colisionarían al pasar a minúsculas. Resolver los duplicados manualmente y reintentar.', dup_count;
  END IF;
END $$;

UPDATE "users" SET "email" = lower("email") WHERE "email" <> lower("email");

-- teacher_invitations.email no es único; solo se normaliza.
UPDATE "teacher_invitations" SET "email" = lower("email") WHERE "email" <> lower("email");
