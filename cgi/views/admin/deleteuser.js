/**
 * Delete a user
 * @author Mitchell Sawatzky
 */

 const code = require(`${__rootname}/util/code`);
 const page = require(`${__rootname}/util/page`);
 const redirection = require(`${__rootname}/util/redirection`);
 
 module.exports.matchPaths = ['/admin/users/delete'];
 module.exports.name = 'delete_user';
 module.exports.type = 'POST';
 
 module.exports.handle = page.requirePermission('delete_user', (request, cb) => {
     if (!request.post.user) {
         code.errorPage(request, code.BAD_REQUEST, cb);
         return;
     }
 
    request.db.do('DELETE FROM users WHERE id = ? LIMIT 1', [
        request.post.user
    ], (err) => {
        if (err) {
            throw err;
        }
        request.headers['content-type'] = 'application/json';
        request.body = JSON.stringify({
            status: 200,
            message: 'success'
        });
        cb();
    });
 });
