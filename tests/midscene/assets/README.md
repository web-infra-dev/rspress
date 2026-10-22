# Offline fixture assets

`rspress-logo.svg` is the original image fetched from
https://assets.rspack.rs/rspress/rspress-logo.svg on 2026-10-15.
The browser fixture serves this copy only for that exact URL, so the social-link
and inline-image flows do not depend on external network availability. The
legacy href/src checks still verify the original URL. These cases verify local
rendering, not CDN availability.
