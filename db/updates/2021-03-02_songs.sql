USE `ewma`;

DROP TABLE IF EXISTS `songs`;
CREATE TABLE `songs` (
    `id` CHAR(36) CHARACTER SET latin1 DEFAULT UUID() PRIMARY KEY,
    `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `movie` INT(11),
    `release` INT(11),
    `songpath` VARCHAR(255) NOT NULL,
    `mime` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'mpeg',
    `posterpath` VARCHAR(255),
    `metadata` BLOB,
    CONSTRAINT fk_song_movie_id FOREIGN KEY (movie) REFERENCES movies (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
