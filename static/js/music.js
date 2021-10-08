$(document).ready(() => {
    $('#music').on('click', '.expandable', function() {
        $(this).removeClass('expandable').addClass('collapseable');
        $(this).find('.collapsed').removeClass('collapsed').addClass('expanded');
    });

    $('#music').on('click', '.collapseable', function() {
        $(this).addClass('expandable').removeClass('collapseable');
        $(this).find('.expanded').removeClass('expanded').addClass('collapsed');
    });
});
