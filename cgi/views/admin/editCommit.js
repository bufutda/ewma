/**
 * Theme expirey
 * @author Mitchell Sawatzky
 */

const template = require(`${__rootname}/util/template`);
const page = require(`${__rootname}/util/page`);
const code = require(`${__rootname}/util/code`);
const redirection = require(`${__rootname}/util/redirection`);

module.exports.matchPaths = [/^\/admin\/edit\/[0-9]+\/commit$/];
module.exports.name = 'commit';
module.exports.type = ['GET', 'POST'];

function getVal (movie, key, id) {
    if (key === 'award') {
        for (let award of movie.awards) {
            if (award.id === id) {
                return award;
            }
        }
    } else {
        return movie[key];
    }
}

function generateActionsFromPayload (movie, payload) {
    let actionMap = {
        1: 'DELETE',
        2: 'UPDATE',
        3: 'CREATE'
    }

    let actions = [];

    // pre hooks first
    payload._ = payload._ || [];
    for (let entry of payload._) {
        switch (actionMap[entry[0]]) {
            case 'DELETE':
                // this only happens with awards
                actions.push({
                    hr: `Delete ${entry[1]} no ${entry[2]} (${getVal(movie, 'award', entry[2]).name})`,
                    db: {
                        q: `DELETE FROM award WHERE id = ?`,
                        r: [entry[2]]
                    }
                });
                break;
            case 'CREATE':
                switch (entry[1]) {
                    case 'award':
                        actions.push({
                            hr: `Create award {name: ${entry[2]}, note: ${entry[3]}}`,
                            db: {
                                q: `INSERT INTO award (movie_id, name, note) VALUES (?, ?, ?)`,
                                r: [movie.id, entry[2], entry[3]]
                            }
                        });
                        break;
                    case 'theme':
                        break;
                    default:
                        throw new Error('cannot create unknown resource');
                }
                break;
            default:
                throw new Error('unkown action');
        }
    }

    payload.award = payload.award || [];
    for (let entry of payload.award) {
        switch (actionMap[entry[0]]) {
            case 'UPDATE':
                let post = {};
                post[entry[2]] = entry[3];
                actions.push({
                    hr: `Update award no ${entry[1]}::${entry[2]} (${getVal(movie, 'award', entry[1])[entry[2]]} => ${entry[3]})`,
                    db: {
                        q: `UPDATE award SET ? WHERE id = ?`,
                        r: [post, entry[1]]
                    }
                });
                break;
            default:
                throw new Error('unknown action');
        }
    }

    for (let prop in payload) {
        if (prop !== '_' && prop !== 'award') {
            let entry = payload[prop];
            switch (actionMap[entry[0]]) {
                case 'UPDATE':
                    let post = {};
                    post[prop] = entry[1];
                    actions.push({
                        hr: `Update ${prop} (${getVal(movie, prop)} => ${entry[1]})`,
                        db: {
                            q: `UPDATE movies SET ? WHERE id = ?`,
                            r: [post, movie.id]
                        }
                    });
                    break;
                default:
                    throw new Error('unknown action');
            }
        }
    }

    return actions;
}

function unpackPayload (payload) {
    payload = JSON.parse(payload);

    for (let prop in payload) {
        if (typeof payload[prop][0] === "object") { // array
            for (let e of payload[prop]) {
                for (let i = 0; i < e.length; i++) {
                    if (typeof e[i] === 'string') {
                        e[i] = decodeURIComponent(e[i]);
                    }
                }
            }
        } else {
            for (let i = 0; i < payload[prop].length; i++) {
                if (typeof payload[prop][i] === 'string') {
                    payload[prop][i] = decodeURIComponent(payload[prop][i]);
                }
            }
        }
    }

    return payload;
}

function viewCommit (request, cb) {
    page.populateHeaders(request, (err) => {
        if (err) {
            throw err;
        }

        request.stylesheets.push('edit');
        let id = parseInt(request.pathname.split('/')[3], 10);

        request.db.do('SELECT title, rating, year, dept, src, mime, theme FROM movies where id = ?', [id], (err, movie) => {
            if (err) {
                throw err;
            }
            movie = movie[0];
            if (!movie) {
                code.errorPage(request, code.NOT_FOUND, cb);
                return;
            }
            movie.id = id;

            request.db.do('SELECT name, id, note FROM award WHERE movie_id = ?', [id], (err, awards) => {
                if (err) {
                    throw err;
                }

                movie.awards = awards;

                let _payload = request.post.payload || request.query.payload;
                payload = unpackPayload(_payload);
                let actions = generateActionsFromPayload(movie, payload);

                for (action of actions) {
                    action.db.query = request.db.format(action.db.q, action.db.r)
                }

                template.get('admin/commit.ejs', {
                    request: request,
                    movie: movie,
                    actions: actions,
                    data: _payload,
                }, (err, content) => {
                    if (err) {
                        throw err;
                    }
                    request.body = content;
                    cb();
                });
            });
        });
    });
}

function commit (request, cb) {
    let id = parseInt(request.pathname.split('/')[3], 10);

    request.db.do('SELECT title, rating, year, dept, src, mime, theme FROM movies where id = ?', [id], (err, movie) => {
        if (err) {
            throw err;
        }
        movie = movie[0];
        if (!movie) {
            code.errorPage(request, code.NOT_FOUND, cb);
            return;
        }
        movie.id = id;

        request.db.do('SELECT name, id, note FROM award WHERE movie_id = ?', [id], (err, awards) => {
            if (err) {
                throw err;
            }

            movie.awards = awards;

            let _payload = request.post.payload || request.query.payload;
            payload = unpackPayload(_payload);
            let actions = generateActionsFromPayload(movie, payload);

            for (action of actions) {
                action.db.query = request.db.format(action.db.q, action.db.r)
            }

            request.db._connection.beginTransaction((err) => {
                if (err) {
                    throw err;
                }
                // we have to do these synchronously to prevent race conditions
                function cont (i) {
                    if (actions[i]) {
                        request.db.do(actions[i].db.query, (err) => {
                            if (err) {
                                throw err;
                            }
                            cont(++i);
                        });
                    } else {
                        request.db._connection.commit((err) => {
                            if (err) {
                                throw err;
                            }
                            redirection.found(request, '/', cb);
                        });
                    }
                }
                cont(0);
            });
        });
    });
}

module.exports.handle = page.requireAdmin((request, cb) => {
    switch (request.method) {
        case 'GET':
            viewCommit(request, cb);
            return;
        case 'POST':
            commit(request, cb);
            return;
        default:
            throw new Error('unreachable code');
    }
});