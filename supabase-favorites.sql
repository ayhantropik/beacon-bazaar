-- Favorites tablosu
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("userId", "productId")
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites("userId");
CREATE INDEX IF NOT EXISTS idx_favorites_product ON favorites("productId");

-- RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage own favorites" ON favorites
    FOR ALL USING (auth.uid() = "userId"::text::uuid);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
