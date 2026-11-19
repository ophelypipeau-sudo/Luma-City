-- NULL inherits the existing room capacity; administrators may configure each room.
ALTER TABLE home_rooms ADD COLUMN capacity INTEGER CHECK (capacity IS NULL OR capacity > 0);
