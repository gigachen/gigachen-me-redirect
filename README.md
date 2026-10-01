# Legacy TapTap domain redirect

This GitHub Pages site serves `gigachen.me` and forwards browser visitors to `https://tap-tap.live`, preserving the path, query string, and fragment. Publish the root of `main` and enable Enforce HTTPS.

The Namecheap apex A records stay pointed at GitHub Pages. `404.html` handles previously issued paths, including `/r/portfolio/`.

This is a browser-side JavaScript redirect, not an HTTP 301. Visitors without JavaScript get a link to the new homepage. Search engines should use the canonical URLs on the new TapTap website.
