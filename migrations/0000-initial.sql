-------------------------------------------------------------------------------
-- Up
-------------------------------------------------------------------------------

CREATE TABLE Axioms (
    id INTEGERT PRIMARY KEY,
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    score INTEGER NOT NULL
);

CREATE INDEX AxiomRanking ON Axioms (score);

-------------------------------------------------------------------------------
-- Down
-------------------------------------------------------------------------------

DROP INDEX AxiomRanking;
DROP TABLE Axioms;
