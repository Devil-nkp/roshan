# PARVESH ROSHAN — YOUTUBE ERROR 153 FIX

The screenshot showed YouTube **Error 153**.

YouTube defines error 153 as: the embedded player request did not include the
required HTTP Referer (or equivalent API client identification).

This build fixes that in three places:

1. `index.html`
   - `<meta name="referrer" content="strict-origin-when-cross-origin">`

2. `app.js`
   - creates the iframe itself
   - sets `iframe.referrerPolicy = "strict-origin-when-cross-origin"` BEFORE `src`
   - sends `origin`
   - sends `widget_referrer`

3. `server.py`
   - serves the page with:
     `Referrer-Policy: strict-origin-when-cross-origin`

## DO THIS

Open a terminal inside this project folder and run:

```bash
python server.py
```

Then open EXACTLY:

```text
http://localhost:8080
```

Do not open `index.html` with `file://`.

## First playback

Wait until the music card says:

`READY`

Then press:

`ENTER HIS WORLD`

That user click starts the first song.

After the first song starts, scrolling changes songs automatically.

## If error 153 STILL appears

Your browser extension/privacy setting/network is stripping Referer headers.

Test once in:
- Chrome Incognito with extensions disabled, or
- a normal Chrome profile with strict privacy extensions temporarily disabled.

If it works there, the site code is correct and the browser extension was removing
the Referer.

## Other YouTube errors

- 101 / 150 = the video owner does not permit embedding.
- 153 = missing Referer/client identification.

The site cannot override a video owner's embedding restriction.
