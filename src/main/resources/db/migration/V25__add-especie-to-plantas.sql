-- V25__add-especie-to-plantas.sql
-- Adiciona "especie" para suportar múltiplas espécies (ex.: CANNABIS, ROSEIRA)

ALTER TABLE plantas
  ADD COLUMN especie VARCHAR(30) NOT NULL DEFAULT 'CANNABIS';