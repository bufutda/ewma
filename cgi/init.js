/**
 * Entry point for all requests to the server
 * @file init.js
 * @namespace init
 * @author Mitchell Sawatzky
 */

process.env.REQUEST_START = Date.now();
global.__rootname = __dirname;

const env = require(`${__rootname}/util/env.js`);
const exitProcedures = require(`${__rootname}/exitProcedures.js`);
const template = require(`${__rootname}/util/template.js`);
const router = require(`${__rootname}/util/router.js`);
const dataConsumer = require(`${__rootname}/util/dataConsumer.js`);
const query2json = require(`${__rootname}/util/q2j.js`);
const code = require(`${__rootname}/util/code.js`);
const dbWrapper = require(`${__rootname}/util/db.js`);
const auth = require(`${__rootname}/util/auth.js`);
const userModel = require(`${__rootname}/models/user.js`);
const cookie = require('cookie');

let request = env.process();
router.init();

request.headers['status'] = code.codeString(code.OK);
request.headers['content-type'] = 'text/html';

dbWrapper.acquire(function (db) {
    request.db = db;
    // check if the user has a session
    auth.checkSession(request, request.cookie.session, (err, user) => {
        if (err) {
            throw err;
        }

        request.user = user || new userModel.User(request.db);
        request.user.getPerms((err) => {
            if (err) {
                throw err;
            }

            request.permissions = {};
            for (let permission of request.user.permissions) {
                request.permissions[permission] = true;
            }

            // expired session or first time
            if ((!request.cookie.session || !user)
                && (
                    request.pathname !== '/tosagree'
                    && request.pathname !== '/newaccount'
                    && request.pathname !== '/useapasswordmanager'
                    && request.pathname !== '/restricted-login'
                )
                && request.method === 'GET'
            ) {
                // tsk tsk. Better make sure they're not an ass first
                request._originalPathname = request.pathname;
                request.pathname = '/tos';
            }

            dataConsumer.consume((err, data) => {
                request.post = data;

                switch (request.postDataType) {
                    case 'application/json':
                        request.post = JSON.parse(request.post)
                        break;
                    case 'application/x-www-form-urlencoded':
                        request.post = query2json.q2j(request.post);
                        break;
                    case undefined:
                        try {
                            request.post = JSON.parse(request.post);
                            request.postDataType = 'application/json';
                        } catch (e) {
                            try {
                                request.post = query2json.q2j(request.post);
                                request.postDataType = 'application/x-www-form-urlencoded';
                            } catch (e) {
                                // leave it to later to try to interpret
                            }
                        }
                        break;
                    default:
                        // leave be
                }

                router.handoff(request, () => {
                    // output here
                    for (header in request.headers) {
                        process.stdout.write(`${header}: ${request.headers[header]}\n`);
                    }
                    process.stdout.write('\n');
                    if (request.headers['content-type'] === 'text/html') {
                        request.user.checkPerm('view_summary', (err, ok) => {
                            if (err) {
                                throw err;
                            }

                            template.get('summary.ejs', {
                                request: request,
                                fullSummary: ok
                            }, (err, content) => {
                                if (err) {
                                    throw err;
                                }
                                process.stdout.write(content);
                                process.stdout.write(request.body);
                                exitProcedures.shutdown(0);
                            });
                        });
                    } else {
                        process.stdout.write(request.body);
                        exitProcedures.shutdown(0);
                    }
                });
            });
        });
    });
});
