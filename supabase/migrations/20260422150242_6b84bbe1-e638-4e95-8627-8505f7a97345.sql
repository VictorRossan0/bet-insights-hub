DROP POLICY IF EXISTS "Allow public insert" ON public.sugestoes_apostas;
DROP POLICY IF EXISTS "Allow public update" ON public.sugestoes_apostas;

CREATE POLICY "Admins can insert sugestoes"
  ON public.sugestoes_apostas
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sugestoes"
  ON public.sugestoes_apostas
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));