const code = require(`${__rootname}/util/code`);

function populateHeaders (request, cb) {
    request.headerLinks = request.headerLinks || [];
    request.headerLinksAdmin = request.headerLinksAdmin || [];

    request.headerLinks.push({
        text: 'Movie List',
        link: '/movies/list'
    });

    request.headerLinks.push({
        text: 'Themes',
        link: '/themes'
    });

    if (request.permissions.beta_view_songs) {
        request.headerLinks.push({
            text: 'Music',
            link: '/music'
        });
    }

    // request.headerLinks.push({
    //     text: 'Submit Movie',
    //     link: '/contact'
    // });

    request.db.do(`
        SELECT movies.id
        FROM movies
            INNER JOIN videos on videos.movie_id = movies.id
        ORDER BY RAND()
        LIMIT 0, 1;`, (err, rows) => {
        if (err) {
            throw err;
        }
        request.headerLinks.push({
            text: 'Random Movie',
            link: '/movies/' + rows[0].id
        });

        if (request.permissions.movie_edit) {
            request.headerLinksAdmin.push({
                text: 'Edit Movie',
                link: '/admin/edit'
            });
        }

        if (request.permissions.manage_permissions) {
            request.headerLinksAdmin.push({
                text: 'Manage Permissions',
                link: '/admin/permissions'
            });
        }

        if (request.permissions.manage_users) {
            request.headerLinksAdmin.push({
                text: 'Manage Users',
                link: '/admin/users'
            });
        }

        if (request.permissions.song_edit) {
            request.headerLinksAdmin.push({
                text: 'Add Song',
                link: '/admin/song/new'
            });
        }

        request.headerLinks.push({
            text: 'Logout',
            link: '/logout'
        });

        cb();
    });
}

function requirePermission(permission, proceed) {
    return (request, exit) => {
        request.user.checkPerm(permission, (err, ok) => {
            if (err) {
                throw err;
            }
            if (ok) {
                proceed(request, exit);
                return;
            } else {
                code.errorPage(request, code.FORBIDDEN, exit);
            }
        });
    }
};

module.exports = {
    populateHeaders: populateHeaders,
    requirePermission: requirePermission
};
