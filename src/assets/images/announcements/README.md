# Announcement Image Requirements

Use these requirements for every new announcement image in this directory.

## Required format

- Dimensions: **1200 x 630 pixels**
- Aspect ratio: **1.91:1**
- Format: **JPEG (`.jpg`)**
- Color: RGB or sRGB
- File size: preferably below **1 MB**
- Keep important text, logos, and faces away from the outer edges because social platforms may crop previews slightly.

The 1200 x 630 format is the recommended Open Graph size and gives WhatsApp, Facebook, X, and LinkedIn a reliable wide preview. It also displays cleanly in the announcement article on desktop and mobile.

## Add the image

1. Place the image in this directory.
2. Use a root-relative path in `data/announcements.json`:

```json
{
  "image": "/images/announcements/example.jpg",
  "imageAlt": "A useful description of the image.",
  "imageWidth": 1200,
  "imageHeight": 630
}
```

3. Run `npm run sync:announcements`.
4. Run `npm run build` before deploying.

The generator checks that the image exists and automatically corrects `imageWidth` and `imageHeight` if they do not match the actual file. It does not replace a badly proportioned image, so create the image at the required dimensions before adding it.

## Design safe area

Keep the main title, logo, and other important content inside the central **1080 x 510 pixel** area. Avoid placing essential details in the outer 60 pixels on any side.

The same image is used for the article and social metadata. The article layout preserves the full image, while social platforms may apply their own preview crop.
