/**
 * Subscribe Lambda with double opt-in using DynamoDB + SES.
 * Flow:
 *  - POST { email, source } to /subscribe -> creates item with status 'pending' and token, sends SES verification email
 *  - GET/POST to /verify (handled by verify-lambda) confirms token and sets status 'confirmed'
 *
 * Environment variables expected:
 *  - SUBSCRIBERS_TABLE: DynamoDB table name
 *  - FROM_EMAIL: verified SES sender (e.g. no-reply@yourdomain.com)
 *  - FRONTEND_BASE: base URL to build verification link (e.g. https://yourdomain.com)
 *  - VERIFY_TOKEN_TTL: (optional) seconds before token expires (default 86400 = 24h)
 */

const AWS = require('aws-sdk');
const crypto = require('crypto');
const ddb = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES({ apiVersion: '2010-12-01' });

const TABLE_NAME = process.env.SUBSCRIBERS_TABLE || 'FikraSubscribers';
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@yourdomain.com';
const FRONTEND_BASE = (process.env.FRONTEND_BASE || '').replace(/\/$/, '');
const VERIFY_TOKEN_TTL = parseInt(process.env.VERIFY_TOKEN_TTL || '86400', 10);

function generateToken() {
  return crypto.randomBytes(20).toString('hex');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.handler = async (event) => {
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
    const email = (body.email || '').toLowerCase().trim();
    const source = body.source || 'site';

    if (!email || !isValidEmail(email)) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Invalid email' }) };
    }

    const token = generateToken();
    const now = Math.floor(Date.now() / 1000);
    const ttl = now + VERIFY_TOKEN_TTL;

    const item = {
      email: email,
      status: 'pending',
      token: token,
      source: source,
      createdAt: new Date().toISOString(),
      ttl: ttl // DynamoDB TTL attribute (epoch seconds)
    };

    // Store (upsert) pending item
    await ddb.put({ TableName: TABLE_NAME, Item: item }).promise();

    // Build verification link
    const verifyPath = (FRONTEND_BASE || 'https://yourdomain.com') + '/verify.html';
    const verifyUrl = `${verifyPath}?email=${encodeURIComponent(email)}&token=${token}`;

    // Send verification email via SES
    const params = {
      Destination: { ToAddresses: [email] },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `<p>Thanks for signing up for early access to Fikra.</p>
                   <p>Please confirm your email by clicking the link below:</p>
                   <p><a href="${verifyUrl}">Confirm your email</a></p>
                   <p>If you did not request this, you can ignore this message.</p>`
          },
          Text: {
            Charset: 'UTF-8',
            Data: `Thanks for signing up for early access to Fikra. Confirm: ${verifyUrl}`
          }
        },
        Subject: { Charset: 'UTF-8', Data: 'Confirm your email for Fikra early access' }
      },
      Source: FROM_EMAIL
    };

    await ses.sendEmail(params).promise();

    return { statusCode: 200, body: JSON.stringify({ message: 'Verification email sent' }) };
  } catch (err) {
    console.error('Subscribe lambda error:', err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal server error' }) };
  }
};
