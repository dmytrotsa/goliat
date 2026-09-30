# Goliat Advice

Static HTML, CSS and vanilla JavaScript implementation of Figma frame `5:2` (Desktop - 1).

Open `index.html` directly, or run `python3 -m http.server 8080` and visit http://localhost:8080.
No build step or framework is needed. All Figma images are saved in `assets/`; fonts are loaded from Google Fonts.

Desktop follows the supplied 1440 × 1773 frame. Tablet and mobile layouts are responsive adaptations. The original repeated card copy and service wording are preserved.

The page now includes company information and three team cards, a CTA, fleet, careers, reviews, contact and footer. All navigation links point to their sections. Careers details expand natively, and quote/career links select the matching contact topic.

Team names/photos, contact details and reviews are clearly marked placeholders. Company copy is a draft for approval. Career areas are not confirmed job openings. Replace these before publication.

The contact form validates fields and prepares a message for copying; it does not send data or use a backend. The hero has three slides with a 6.5-second autoplay interval, a vertical current-slide / progress-line / total-slides indicator, with no arrows or pause button. Autoplay pauses on keyboard focus, hidden tabs and while the hero is offscreen. Reduced-motion preferences disable autoplay by default.
