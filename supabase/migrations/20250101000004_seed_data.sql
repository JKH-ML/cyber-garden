-- Insert default categories
INSERT INTO public.categories (name, slug, is_default)
VALUES
  ('일상', 'daily', true),
  ('개발', 'dev', true),
  ('운동', 'fitness', true),
  ('음악', 'music', true)
ON CONFLICT (slug) DO NOTHING;
