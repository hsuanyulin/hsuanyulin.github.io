# Personal Atlas

A map-first personal website for work, travel, Nala, and personal projects.

## Structure

- `index.html` is the map and story index.
- `story.html?story=...` renders a full, scrollable story page.
- `data.js` contains lightweight map metadata only.
- `stories/work/`, `stories/travel/`, `stories/nala/`, and `stories/projects/` contain one Markdown file per story.
- `images/` is organized to mirror the story categories.

## Adding a story

1. Create a Markdown file under the appropriate `stories/` directory.
2. Add its metadata to `data.js`.
3. Put photos in `images/` and reference them from the Markdown.
4. The map card, modal, and full story page will use the same story file.

The site is static and works well with GitHub Pages.


## Story images

Each story owns its own image folder:

```text
images/
  travel/
    inca-trail/
      cover.jpg
      photo-01.jpg
      photo-02.jpg
```

`cover.jpg` is the canonical hero image used by the map/card and story page. Inside Markdown, use normal images for editorial photos, `:::fullwidth` for edge-to-edge photos, and `:::gallery` for two-column photo galleries. Image clicks open a lightbox.
