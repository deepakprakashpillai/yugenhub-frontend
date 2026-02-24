import sharp from 'sharp';
import fs from 'fs';

async function generate() {
    const possibleInputs = ['public/logo.png', 'public/logo.jpg', 'public/logo.jpeg'];
    let input = null;

    for (const file of possibleInputs) {
        if (fs.existsSync(file)) {
            input = file;
            break;
        }
    }

    if (!input) {
        console.error('ERROR: Please save the logo you uploaded as "frontend/public/logo.png" or "logo.jpg".');
        process.exit(1);
    }

    console.log(`Generating PWA icons from ${input}...`);

    // Standard Icons
    await sharp(input).resize(192, 192).toFile('public/pwa-192x192.png');
    await sharp(input).resize(512, 512).toFile('public/pwa-512x512.png');

    // Maskable Icon (used by Android for adaptive icons)
    // We add padding around the logo so it doesn't get cut off
    await sharp(input)
        .resize(360, 360, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .extend({
            top: 76, bottom: 76, left: 76, right: 76,
            background: { r: 0, g: 0, b: 0, alpha: 1 } // Black background for the maskable icon
        })
        .toFile('public/pwa-maskable-512x512.png');

    console.log('Icons generated successfully! You can delete the generate-icons.mjs script now.');
}

generate().catch(console.error);
