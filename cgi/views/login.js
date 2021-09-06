/**
 * Admin login
 * @author Mitchell Sawatzky
 */

const template = require(`${__rootname}/util/template`);
const code = require(`${__rootname}/util/code`);
const auth = require(`${__rootname}/util/auth`);
const redirection = require(`${__rootname}/util/redirection`);
const conf = require(`${__rootname}/conf.json`);

module.exports.matchPaths = ['/login'];
module.exports.name = 'login';
module.exports.type = ['GET', 'POST'];

function loginPage (request, cb) {
    request.scripts.push('login');
    // reuse the tos template because reasons
    template.get('tos.ejs', {
        request: request,
        dest: request._originalPathname || '',
        login: true,
        restrictedMode: false, // this is always the result of a POST so we should never block the re-login attempt
        appIsRestricted: conf['restricted-login-mode']
    }, (err, content) => {
        if (err) {
            throw err;
        }
        request.body = content;
        cb();
    });
}

function handleLoginAttempt(request, cb) {
    auth.validateUser(request, request.post.username, request.post.password, (err, id, approved) => {
        if (err) {
            throw err;
        }
        if (id) {
            if (approved) {
                auth.grantSession(request, (err) => {
                    if (err) {
                        throw err;
                    }
                    redirection.found(request, request.post.dest || '/', cb);
                    return;
                }, id);
            } else {
                request.errorMessage = "This account must be approved before it can be used.";
                request.headers['status'] = code.codeString(code.UNAUTHORIZED);
                loginPage(request, cb);
            }
        } else {
            request.errorMessage = "You'd like that, wouldn't you?";
            request.headers['status'] = code.codeString(code.UNAUTHORIZED);
            loginPage(request, cb);
        }
    });
}

module.exports.handle = (request, cb) => {
    switch (request.method) {
        case 'GET':
            loginPage(request, cb);
            break;
        case 'POST':
            handleLoginAttempt(request, cb);
            break;
        default:
            code.errorPage(request, code.METHOD_NOT_ALLOWED, cb);
            return;
    }
};
