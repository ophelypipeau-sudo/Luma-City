-- Preserve rooms, purchases and ownership; extend only the accepted material identifiers.
ALTER TABLE home_rooms DROP CONSTRAINT home_rooms_wall_check;
ALTER TABLE home_rooms ADD CONSTRAINT home_rooms_wall_check CHECK (wall IN ('ivory','rose','lilac','sage','midnight','peach','wallpaper-blush','wallpaper-sage','floral-rose','floral-cream','brick-terracotta','brick-white','brick-charcoal','arches-blush','arches-ocean'));
ALTER TABLE home_rooms DROP CONSTRAINT home_rooms_floor_check;
ALTER TABLE home_rooms ADD CONSTRAINT home_rooms_floor_check CHECK (floor IN ('oak','honey','smoked','walnut','white-oak','rosewood','herringbone-gold','herringbone-dark','tile-ivory','tile-checker','tile-rose','stone-sand','stone-slate'));
