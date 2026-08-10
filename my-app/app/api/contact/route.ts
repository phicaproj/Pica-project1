import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { name, email, reason, body } = await req.json();

    if (!name || !email || !reason || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const brevoApiKey = process.env.BREVO_API_KEY;
    
    if (!brevoApiKey) {
      console.warn("BREVO_API_KEY is not set. Simulating success.");
      return NextResponse.json({ success: true, message: 'Email simulation successful' });
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify({
        sender: { email: email, name: name },
        to: [{ email: 'support@beauvisiongroup.com', name: 'Support' }],
        subject: `Contact Request: ${reason}`,
        htmlContent: `
          <h3>New Contact Request</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Message:</strong></p>
          <p>${body}</p>
        `
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API error:', errorData);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in contact API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
