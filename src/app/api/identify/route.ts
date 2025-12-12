import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';

export async function POST(request: NextRequest) {
  try {
    const reqFormData = await request.formData();
    const audioFile = reqFormData.get('audio');
    const apiToken = reqFormData.get('api_token');

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { status: 'error', error: { error_message: 'No legitimate audio file provided' } },
        { status: 400 }
      );
    }

    // Convert Blob to Buffer
    const buffer = Buffer.from(await audioFile.arrayBuffer());

    // Create a new form instance using the 'form-data' library (stable for node requests)
    const form = new FormData();
    // AudD expects 'file' or 'audio'. 'file' is their standard in examples.
    form.append('file', buffer, {
      filename: 'recording.webm',
      contentType: 'audio/webm', // explicit content type helps
    });
    form.append('return', 'apple_music,spotify');
    
    // Use environment variable or fallback
    const token = process.env.AUDD_TOKEN || apiToken || 'test';
    form.append('api_token', token as string);

    console.log('Sending request to AudD via Axios...', { size: buffer.length });

    // Axios automatically sets the correct headers including boundary when using form-data
    const response = await axios.post('https://api.audd.io/', form, {
      headers: {
        ...form.getHeaders(),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    console.log('AudD Response Status:', response.status);
    console.log('AudD Response Data:', JSON.stringify(response.data).substring(0, 200));

    // Handle AudD specific error field
    if (response.data.status === 'error') {
       console.error('AudD returned error:', response.data.error);
    }

    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error('Proxy Error:', error.message);
    if (error.response) {
       console.error('Upstream Response:', error.response.data);
    }

    return NextResponse.json(
      { status: 'error', error: { error_message: 'Internal Server Error during recognition', details: error.message } },
      { status: 500 }
    );
  }
}
