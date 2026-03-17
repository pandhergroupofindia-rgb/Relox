import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

// Hardcoded Cloudinary configuration
cloudinary.config({
  cloud_name: "duaitkk9w",
  api_key: "619633159437743",
  api_secret: "ooKCEhQaaycRKeDzP60GfDIyf7A"
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to ArrayBuffer then to Base64 URI
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Uri = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64Uri, {
      folder: "relox_assets"
    });

    return NextResponse.json({ secure_url: result.secure_url });
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
