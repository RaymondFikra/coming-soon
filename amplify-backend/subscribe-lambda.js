/**
 * Example AWS Lambda function (Node.js) to accept email signups
 * and store them in DynamoDB. This is a starter template you can
 * deploy via AWS Amplify Functions (or as a standalone Lambda).
 *
 * NOTE: You must create a DynamoDB table (e.g., 'FikraSubscribers') with
 * a partition key 'email' (String). Adjust the TABLE_NAME below as needed.
 */

const AWS = require('aws-sdk');
const TABLE_NAME = process.env.SUBSCRIBERS_TABLE || 'FikraSubscribers';
const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const email = (body && body.email || '').toLowerCase().trim();
    const source = body.source || 'site';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid email' })
      };
    }

    // Put item (idempotent by using email as primary key)
    const item = {
      email: email,
      source: source,
      createdAt: new Date().toISOString()
    };

    await ddb.put({ TableName: TABLE_NAME, Item: item }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Subscribed' })
    };
  } catch (err) {
    console.error('Subscribe lambda error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};
