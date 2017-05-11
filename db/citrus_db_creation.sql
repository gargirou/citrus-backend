DROP DATABASE IF EXISTS citrus;
CREATE DATABASE citrus;

\c citrus;

CREATE TABLE recipes (
  rID     SERIAL PRIMARY KEY,
  url     VARCHAR,
  title   VARCHAR,
  image   VARCHAR,
  serving VARCHAR
);

CREATE TABLE ingredients (
  iID  SERIAL PRIMARY KEY,
  name VARCHAR
);

CREATE TABLE recipe_ingredients (
  rID      SERIAL REFERENCES recipes(rID),
  iID      SERIAL REFERENCES ingredients(iID),
  quantity VARCHAR
);
