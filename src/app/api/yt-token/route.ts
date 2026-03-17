import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const clientId = process.env.YT_CLIENT_ID;
    const clientSecret = process.env.YT_CLIENT_SECRET;
    const refreshToken = process.env.YT_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json(
        { error: 'YouTube environment variables are not configured' },
        { status: 500 }
      );
    }

    const config = {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    };

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(config),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error_description || 'Failed to fetch access token');
    }

    const data = await response.json();
    return NextResponse.json({ access_token: data.access_token });
  } catch (error: any) {
    console.error('YouTube token error:', error);
    return NextResponse.json({ error: error.message || 'Token retrieval failed' }, { status: 500 });
  }
}
