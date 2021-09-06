/**
 * Default view for first-time visitors to the site
 * @author Mitchell Sawatzky
 */

const template = require(`${__rootname}/util/template`);
const conf = require(`${__rootname}/conf.json`);

module.exports.matchPaths = ['/tos', '/restricted-login'];
module.exports.name = 'tos';
module.exports.type = 'GET';

module.exports.handle = (request, cb) => {
    if (/login/.test(request.pathname)) {
        request.scripts.push('login');
    }
    template.get('tos.ejs', {
        request: request,
        dest: request._originalPathname || '',
        restrictedMode: !/restricted-login/.test(request.pathname) && conf['restricted-login-mode'],
        appIsRestricted: conf['restricted-login-mode']
    }, (err, content) => {
        if (err) {
            throw err;
        }
        request.body = content;
        cb();
    });
};
