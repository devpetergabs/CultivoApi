-- V12: Add sexo and flowering date columns to plantas table
ALTER TABLE plantas ADD COLUMN sexo_planta VARCHAR(50);
ALTER TABLE plantas ADD COLUMN data_sexagem DATE;
ALTER TABLE plantas ADD COLUMN data_floracao DATE;
