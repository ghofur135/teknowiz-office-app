import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePathSegment = params.path.join('/');
    const physicalPath = path.join(process.cwd(), 'public', 'uploads', filePathSegment);

    if (!fs.existsSync(physicalPath)) {
      return new NextResponse('File Not Found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(physicalPath);
    let contentType = 'application/octet-stream';
    if (filePathSegment.endsWith('.pdf')) contentType = 'application/pdf';
    else if (filePathSegment.endsWith('.png')) contentType = 'image/png';
    else if (filePathSegment.endsWith('.jpg') || filePathSegment.endsWith('.jpeg')) contentType = 'image/jpeg';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
