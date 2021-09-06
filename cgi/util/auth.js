/**
 * Authentication logic
 * @author Mitchell Sawatzky
 */

const cookie = require(`${__rootname}/util/cookie`);
const uuid = require('uuid/v4');
const conf = require(`${__rootname}/conf.json`);
const bcrypt = require('bcrypt');
const user = require(`${__rootname}/models/user`);

function validateUser (request, username, password, cb) {
    if (!username || !password) {
        cb(null, false);
        return;
    }

    request.db.do('SELECT password, id, approved FROM users WHERE username = ?;', [username], (err, row) => {
        if (err) {
            cb(err);
            return;
        }
        if (row.length) {
            // user exists
            bcrypt.compare(password, row[0].password, (err, res) => {
                if (err) {
                    cb(err);
                    return;
                }
                if (res) {
                    // user creds correct
                    if (conf['restricted-login-mode']) {
                        request.db.do('SELECT user FROM permissions WHERE user = ? AND perm = "event_login"', [row[0].id], (err, count) => {
                            if (err) {
                                cb(err);
                                return;
                            }
                            if (count.length) {
                                // user has permission
                                cb(null, row[0].id, row[0].approved);
                                return;
                            } else {
                                cb(null, false, 0);
                            }
                        });
                    } else {
                        cb(null, row[0].id, row[0].approved);
                        return;
                    }
                } else {
                    // password's wrong
                    cb(null, false, 0);
                }
            });
        } else {
            cb(null, false, 0);
        }
    });
}

function checkSession (request, session, cb) {
    request.db.do(`
        SELECT users.id AS id
        FROM session INNER JOIN users ON session.user = users.id
        WHERE session.token = ?
            AND session.issued > ?
        LIMIT 1`, [session, Math.floor(Date.now() / 1000) - conf['session-length']], (err, rows) => {
        if (err) {
            console.error(err);
            cb(err);
            return;
        }
        if (rows.length) {
            let u = new user.User(request.db);
            u.initFromId(rows[0].id, (err) => {
                if (err) {
                    cb(err);
                    return;
                }

                if (u.valid) {
                    // this authenticates the user
                    u.authenticated = true;

                    if (conf['restricted-login-mode']) {
                        u.checkPerm('event_login', (err, has) => {
                            if (err) {
                                cb(err);
                                return;
                            }
                            if (has) {
                                cb(null, u);
                            } else {
                                cb(null, null);
                            }
                        });
                    } else {
                        cb(null, u);
                    }
                } else {
                    cb(null, null);
                }
            });
        } else {
            cb(null, null);
        }
    });
}

function grantSession (request, cb, id) {
    function prog () {
        let token = uuid();
        request.db.do(`
            INSERT INTO session (token, issued, user)
            VALUES (?, ?, ?);`, [token, Math.floor(Date.now() / 1000), id || request.user.attributes.id], (err) => {
            if (err) {
                cb(err);
                return;
            }
            request.headers['set-cookie'] = cookie.serialize('session', token, {
                httpOnly: true,
                maxAge: 60 * 60 * 24
            });
            cb(null);
        });
    }

    // if the request has a session already, remove it
    if (request.cookie.session) {
        request.db.do('DELETE FROM session WHERE token = ?', [request.cookie.session], (err) => {
            if (err) {
                throw err;
            }
            prog();
        });
    } else {
        prog();
    }
}

function removeSession (request, cb, id) {
    request.db.do('DELETE FROM session WHERE token = ?', [id || request.cookie.session], cb);
}

module.exports = {
    checkSession: checkSession,
    grantSession: grantSession,
    removeSession: removeSession,
    validateUser: validateUser
};
