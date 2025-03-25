
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_user_id uuid;
BEGIN
  -- Buscar o ID do usuário pelo email
  SELECT id INTO found_user_id
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;
  
  RETURN found_user_id;
END;
$$;
