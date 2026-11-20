ALTER TABLE home_rooms DROP CONSTRAINT home_rooms_wall_check;
ALTER TABLE home_rooms ADD CONSTRAINT home_rooms_wall_check CHECK (wall IN ('ivory','rose','lilac','sage','midnight','peach','wallpaper-blush','wallpaper-sage','floral-rose','floral-cream','brick-terracotta','brick-white','brick-charcoal','arches-blush','arches-ocean','roses-blush','roses-blue','daisies-cream','daisies-lilac','botanical-sage','botanical-night','stars-blush','stars-midnight','diamonds-gold','diamonds-mint','dots-pearl','dots-rose'));
ALTER TABLE home_rooms ADD COLUMN windows JSONB NOT NULL DEFAULT '[]'::jsonb
  CHECK (jsonb_typeof(windows)='array' AND jsonb_array_length(windows)<=6);
