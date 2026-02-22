-- V18__add-rpg-fields-to-plantas.sql
ALTER TABLE plantas
    ADD COLUMN level INT NOT NULL DEFAULT 1,
    ADD COLUMN xp INT NOT NULL DEFAULT 0,
    ADD COLUMN pontos_disponiveis INT NOT NULL DEFAULT 0;
