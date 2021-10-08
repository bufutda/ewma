function toggleDarkMode(state) {
    if (typeof state === 'undefined') {
        // no theme slider on this page - use the cookie if we have it
        let theme = getThemeCookie();
        if (theme) {
            $('body').removeClass('dark-theme').removeClass('light-theme').addClass(`${theme}-theme`);
        }
    } else if (state) {
        $('body').addClass('dark-theme').removeClass('light-theme');
    } else {
        $('body').removeClass('dark-theme').addClass('light-theme');
    }
}

function getThemeCookie() {
    let cookie = document.cookie.split('; ').find(x => x.startsWith('theme='));
    if (!cookie) {
        return null;
    }
    return cookie.split('=')[1];
}

$(document).ready(function() {
    $('.darkmode-toggle [name="darkmode-toggle"]').click(function() {
        let $this = $(this);

        toggleDarkMode($this.prop('checked'));

        let newValue = $this.prop('checked') ? 'dark' : 'light';
        let existingCookie = getThemeCookie();
        if (existingCookie === null || existingCookie !== newValue) {
            document.cookie = `theme=${newValue}; path=/; max-age=315360000`;
        }

        $.ajax({
            url: `/darkmode/${$this.prop('checked') ? 'on' : 'off'}`,
            method: 'POST'
        });
    });
});

toggleDarkMode($('.darkmode-toggle [name="darkmode-toggle"]').prop('checked'));
