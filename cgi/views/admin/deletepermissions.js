/**
 * Remove permissions from the DB
 * @author Mitchell Sawatzky
 */

 const code = require(`${__rootname}/util/code`);
 const page = require(`${__rootname}/util/page`);
 const redirection = require(`${__rootname}/util/redirection`);
 
 module.exports.matchPaths = ['/admin/permissions/delete'];
 module.exports.name = 'delete_perm';
 module.exports.type = 'POST';
 
 module.exports.handle = page.requirePermission('manage_permissions', (request, cb) => {
     if (!request.post.permission) {
         code.errorPage(request, code.BAD_REQUEST, cb);
         return;
     }
 
     if (!request.post.user) {
         request.db.do('DELETE FROM permissions WHERE perm = ?', [
             request.post.permission
         ], (err) => {
             if (err) {
                 throw err;
             }
 
             request.db.do('DELETE FROM permission_schema WHERE perm = ?', [
                 request.post.permission
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
     } else {
         request.db.do('DELETE FROM permissions WHERE perm = ? AND user = ?', [
             request.post.permission,
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
     }
 });
