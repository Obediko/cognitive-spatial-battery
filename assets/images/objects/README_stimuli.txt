OBJECT STIMULI FOLDER
======================

This folder (assets/images/objects/) is for object image files used in the
Object-Location Memory Task.

DEFAULT BEHAVIOUR
-----------------
By default, the task uses coloured placeholder shapes (emoji + label) instead
of real images. These are rendered in JavaScript and require no files in this folder.

REPLACING PLACEHOLDER STIMULI WITH REAL IMAGES
-----------------------------------------------
1. Obtain approved, neutral everyday object images.
   - Preferred format: PNG with transparent background
   - Minimum resolution: 200 x 200 pixels
   - Must be: neutral, non-emotional, no faces, no brand logos
   - Must be approved under your study's ethics agreement
   - Must not be copyrighted material (use open-licensed stimuli or bespoke photographs)

2. Name each file clearly:
   clock.png, lamp.png, book.png, key.png, cup.png, chair.png, etc.

3. Place files in this folder: assets/images/objects/

4. In js/tasks/object_location_memory.js, add imagePath to the OLM_OBJECTS entry:
   
   { id: 'clock', label: 'Clock', emoji: '\u23F0', color: '#5c6bc0',
     imagePath: 'assets/images/objects/clock.png' }
   
   If imagePath is present, the real image is shown instead of the placeholder shape.
   If imagePath is absent or the file is missing, the placeholder shape is used as fallback.

STIMULUS BANKS
--------------
Suggested open-licensed sources:
- BOSS (Bank of Standardized Stimuli): https://sites.google.com/site/bosstimuli/
- THINGS dataset: https://osf.io/jum2f/
- OpenGameArt.org (CC0 licensed objects)
- Your own photographs (check ethics approval)

IMPORTANT
---------
- Do NOT commit licensed or copyrighted images to a public GitHub repository.
- Keep a local copy of image files outside the repo if they cannot be publicly shared.
- Document stimulus provenance in your study protocol.
