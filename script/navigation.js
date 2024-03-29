var eaNav = (function () {
    var defaultContent = 'content/armies.html';
    var pattern = new RegExp("content\/(.*?)\.html");

    // triggered by internal links
    var internalLink = function (event) {
        event.preventDefault();
        navigateTo($(this).attr("href"))
    };

    // triggered by history.back
    var historyBack = function (event) {
        console.debug("[nav] pop state", event.originalEvent.state);
        var state = event.originalEvent.state;

        if (state !== null)
        {
            loadContent(state.url);
        }
        else
        {
            loadContent(defaultContent);
        }
    };

    var navigateTo = function (url) {
        if (!history.state || url !== history.state.url)
        {
            console.debug("[nav] push state", url);
            history.pushState({
                url: url
            }, null, toUrlParams(url));
        }

        loadContent(url);
    };

    var toUrlParams = function(url) {
        if (pattern.test(url)) {
            var content = pattern.exec(url)[1];
            var result = "?content=" + content + "&"

            var urlSearchParams = new URLSearchParams(new URL('http://localhost/' + url).search);
            urlSearchParams.forEach(function (value, key) {
                if (key !== "content") {
                    result += key + '=' + value + '&'
                }
            })

            return result.slice(0, -1)
        } else {
            return null
        }
    }

    // Load content from the url params, if any
    var urlFromParams = function() {
        var urlSearchParams = new URLSearchParams(new URL(window.location.href).search);
        var content = urlSearchParams.get("content");
        if (!content) {
            content = "intro" // Default content
        }
        var contentUrl = "content/" + content + ".html"
        $('.nav-link').filter($('a[href="' + contentUrl.substring(0, content.indexOf("/")) + '"]')).addClass("active")

        // Preserve url params
        var urlWithParams = contentUrl + '?'
        urlSearchParams.forEach(function(value, key) {
            if (key !== "content") {
                urlWithParams += key + '=' + value + '&'
            }
        })
        urlWithParams = urlWithParams.slice(0, -1)

        return {
            contentUrl: contentUrl,
            contentUrlWithParams: urlWithParams
        }
    }

    var reloadPage = function () {
        // Default landing page if history is empty
        if (!history.state || !history.state.url)
        {
            navigateTo(defaultContent);
        }
        else
        {
            navigateTo(history.state.url);
        }
    };

    var loadContent = function (page) {
        $("#content").load(page);
        window.scrollTo(0, 0);
    };

    return {
        to: navigateTo,
        reload: reloadPage,
        linkHandler: internalLink,
        historyBackHandler: historyBack,
        urlFromParams: urlFromParams
    }
})();