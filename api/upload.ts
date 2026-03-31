import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return res.status(500).json({ error: 'Storage not configured' });
  }

  const supabaseUrl = 'https://vzaabtzcilyoknksvhrc.supabase.co';
  const bucket = 'anexos';

  try {
    // Parse multipart form data manually
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const body = Buffer.concat(chunks);

    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) {
      return res.status(400).json({ error: 'No boundary in content-type' });
    }

    const boundary = boundaryMatch[1];
    const parts = parseMultipart(body, boundary);

    const filePart = parts.find(p => p.name === 'file');
    const pastaPart = parts.find(p => p.name === 'pasta');

    if (!filePart || !filePart.data || !filePart.filename) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const pasta = pastaPart?.data?.toString('utf-8') || 'geral';
    const safeName = filePart.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${pasta}/${Date.now()}_${safeName}`;

    // Upload to Supabase Storage
    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': filePart.contentType || 'application/octet-stream',
        },
        body: new Uint8Array(filePart.data!),
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error('Supabase upload error:', uploadRes.status, errText);
      return res.status(500).json({ error: 'Upload failed' });
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;

    return res.status(200).json({
      url: publicUrl,
      nome: filePart.filename,
    });
  } catch (error) {
    console.error('Upload handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

interface MultipartPart {
  name?: string;
  filename?: string;
  contentType?: string;
  data?: Buffer;
}

function parseMultipart(body: Buffer, boundary: string): MultipartPart[] {
  const parts: MultipartPart[] = [];
  const boundaryBuf = Buffer.from(`--${boundary}`);
  const endBuf = Buffer.from(`--${boundary}--`);

  let start = indexOf(body, boundaryBuf, 0);
  if (start === -1) return parts;

  while (true) {
    start = start + boundaryBuf.length;
    // Skip CRLF after boundary
    if (body[start] === 0x0d && body[start + 1] === 0x0a) start += 2;

    const end = indexOf(body, boundaryBuf, start);
    if (end === -1) break;

    // Check if this is the closing boundary
    const slice = body.subarray(start, end);
    const headerEnd = indexOf(slice, Buffer.from('\r\n\r\n'), 0);
    if (headerEnd === -1) { start = end; continue; }

    const headerStr = slice.subarray(0, headerEnd).toString('utf-8');
    // Data starts after \r\n\r\n and ends before \r\n before next boundary
    let data = slice.subarray(headerEnd + 4);
    // Remove trailing \r\n
    if (data.length >= 2 && data[data.length - 2] === 0x0d && data[data.length - 1] === 0x0a) {
      data = data.subarray(0, data.length - 2);
    }

    const part: MultipartPart = { data };

    const nameMatch = headerStr.match(/name="([^"]+)"/);
    if (nameMatch) part.name = nameMatch[1];

    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    if (filenameMatch) part.filename = filenameMatch[1];

    const ctMatch = headerStr.match(/Content-Type:\s*(.+)/i);
    if (ctMatch) part.contentType = ctMatch[1].trim();

    parts.push(part);

    // Check if next boundary is the end
    if (indexOf(body, endBuf, end) === end) break;
    start = end;
  }

  return parts;
}

function indexOf(buf: Buffer, search: Buffer, from: number): number {
  for (let i = from; i <= buf.length - search.length; i++) {
    let found = true;
    for (let j = 0; j < search.length; j++) {
      if (buf[i + j] !== search[j]) { found = false; break; }
    }
    if (found) return i;
  }
  return -1;
}
