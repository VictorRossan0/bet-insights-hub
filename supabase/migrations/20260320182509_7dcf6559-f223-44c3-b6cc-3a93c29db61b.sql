
CREATE TABLE public.sugestoes_apostas (
  id serial NOT NULL,
  rodada_referencia integer NOT NULL,
  jogo_id integer NULL,
  mercado character varying(100) NULL,
  tipo_aposta character varying(100) NULL,
  descricao text NULL,
  confianca numeric(5, 2) NULL,
  odd_sugerida numeric(5, 2) NULL,
  resultado character varying(20) NULL DEFAULT 'pendente',
  enviado_telegram boolean NULL DEFAULT false,
  criado_em timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT sugestoes_apostas_pkey PRIMARY KEY (id)
);

ALTER TABLE public.sugestoes_apostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.sugestoes_apostas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert" ON public.sugestoes_apostas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.sugestoes_apostas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
