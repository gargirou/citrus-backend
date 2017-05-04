DROP DATABASE IF EXISTS users;
CREATE DATABASE users;

\c users;

CREATE TABLE myusers (
  ID SERIAL PRIMARY KEY,
  name VARCHAR,
  age INTEGER
);

INSERT INTO myusers (name, age)
  VALUES ('Tyler', 31);
