import sharp from 'sharp';
import fs from 'fs';

async function generate() {
    const possibleInputs = ['public/yugen_logo.png', 'public/yugen_logo.jpg'];
    let input = null;

    for (const file of possibleInputs) {
        if (fs.existsSync(file)) {
            input = file;
            break;
        }
    }

    if (!input) {
        console.error('ERROR: Please ensure the logo is saved as "frontend/public/yugen_logo.png".');
        process.exit(1);
    }

    console.log(`Generating PWA icons from ${input} with zoom...`);

    // 1. Get metadata to calculate a center crop (zoom in)
    const metadata = await sharp(input).metadata();

    // Zoom in by 20%
    const zoomFactor = 1.2;
    const cropWidth = Math.floor(metadata.width / zoomFactor);
    const cropHeight = Math.floor(metadata.height / zoomFactor);
    const left = Math.floor((metadata.width - cropWidth) / 2);
    const top = Math.floor((metadata.height - cropHeight) / 2);

    // 2. We extract the zoomed center region first
    const zoomedImage = sharp(input).extract({ left, top, width: cropWidth, height: cropHeight });

    // 3. Generate Standard Icons from the zoomed image
    await zoomedImage.clone()
        .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
        .flatten({ background: { r: 0, g: 0, b: 0 } })
        .toFile('public/pwa-192x192.png');

    await zoomedImage.clone()
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
        .flatten({ background: { r: 0, g: 0, b: 0 } })
        .toFile('public/pwa-512x512.png');

    // 4. Maskable Icon (Android Adaptive)
    // Maskable icons still need safe-zone padding. We'll use the zoomed image 
    // but give it less padding (56px) so it's also larger in the adaptive icon container
    await zoomedImage.clone()
        .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
        .extend({
            top: 56, bottom: 56, left: 56, right: 56,
            background: { r: 0, g: 0, b: 0, alpha: 1 }
        })
        .flatten({ background: { r: 0, g: 0, b: 0 } })
        .toFile('public/pwa-maskable-512x512.png');

    console.log('Zoomed icons generated successfully! You can delete the generate-icons.mjs script now.');
}

generate().catch(console.error);
