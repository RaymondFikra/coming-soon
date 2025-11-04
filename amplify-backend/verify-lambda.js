/**
 * Verify Lambda: accepts token and email and marks subscriber as 'confirmed'
 * Expects environment variable SUBSCRIBERS_TABLE
 */

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.SUBSCRIBERS_TABLE || 'FikraSubscribers';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.handler = async (event) => {
  try {
    const data = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
    const email = (data.email || event.queryStringParameters && event.queryStringParameters.email || '').toLowerCase();
    const token = data.token || (event.queryStringParameters && event.queryStringParameters.token) || '';

    if (!email || !isValidEmail(email) || !token) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Invalid request' }) };
    }

    // Get existing item
    const res = await ddb.get({ TableName: TABLE_NAME, Key: { email } }).promise();
    const item = res.Item;
    if (!item) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Not found' }) };
    }

    if (item.status === 'confirmed') {
      return { statusCode: 200, body: JSON.stringify({ message: 'Already confirmed' }) };
    }

    if (item.token !== token) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Invalid token' }) };
    }

    // Update to confirmed and remove token
    await ddb.update({
      TableName: TABLE_NAME,
      Key: { email },
      UpdateExpression: 'REMOVE token SET #s = :s, confirmedAt = :t',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'confirmed', ':t': new Date().toISOString() }
    }).promise();

    return { statusCode: 200, body: JSON.stringify({ message: 'Confirmed' }) };
  } catch (err) {
    console.error('Verify lambda error:', err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal server error' }) };
  }
};
