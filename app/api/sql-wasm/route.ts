import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
    const wasmBuffer = fs.readFileSync(wasmPath);
    
    return new NextResponse(wasmBuffer, {
      headers: {
        'Content-Type': 'application/wasm',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving WASM file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
