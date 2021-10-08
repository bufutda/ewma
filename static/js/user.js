$(document).ready(function () {
    $('.delete-button').click(function () {
        if (confirm('are you sure you wanna remove that, son?')) {
            $.ajax({
                url: '/admin/permissions/delete',
                method: 'POST',
                data: JSON.stringify({
                    permission: $(this).attr('data-permission'),
                    user: $(this).attr('data-user')
                }),
                contentType: 'application/json',
                error: function () {
                    alert('error');
                },
                success: function () {
                    window.location.reload();
                }
            });
        }
    });

    $('.delete-user').click(function() {
        if (confirm('Are you sure you want to permenantly delete this user?')) {
            $.ajax({
                url: '/admin/users/delete',
                method: 'POST',
                data: JSON.stringify({
                    user: $(this).attr('data-user-id')
                }),
                contentType: 'application/json',
                error: function () {
                    alert('An error ocurred');
                },
                success: function () {
                    window.location = '/admin/users';
                }
            });
        }
    });
});
