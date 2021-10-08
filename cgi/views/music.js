/**
 * Movie songs
 * @author Mitchell Sawatzky
 */

const template = require(`${__rootname}/util/template`);
const page = require(`${__rootname}/util/page`);

module.exports.matchPaths = ['/music'];
module.exports.name = 'music';
module.exports.type = 'GET';

module.exports.handle = (request, cb) => {
    request.stylesheets.push('music');
    request.scripts.push('music');
    page.populateHeaders(request, () => {
        request.db.do(`
            SELECT
                s.id as song_id,
                s.name,
                s.release,
                s.songpath,
                s.mime,
                s.posterpath,
                s.metadata,
                m.title,
                m.year,
                m.id as movie_id
            FROM songs s
                LEFT JOIN movies m ON s.movie = m.id
            ORDER BY COALESCE(s.release, UNIX_TIMESTAMP(CONCAT(COALESCE(m.year, '1970'), '-01-14 00:00:00'))) DESC,
                COALESCE(s.name, m.title),
                m.title,
                s.id
        `, (err, rows) => {
            if (err) {
                throw err;
            }

            template.get('music.ejs', {
                request: request,
                songs: rows
            }, (err, content) => {
                if (err) {
                    throw err;
                }
                request.body = content;
                cb();
            });
        });
    });
};
