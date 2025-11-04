# coming-soon
Coming Soon Page v1

## Frontend
- The site is static and served from `index.html` with styles in `styles.css` and client logic in `script.js`.
- `amplify.yml` is configured to publish from `amplify_output` (the build process copies files there).

## Email collection
This repo includes a client-side email signup flow. By default the form will store addresses in `localStorage` (fallback). For production you should provide a POST endpoint and set it on each form using the `data-endpoint` attribute or expose `window.FIKRA_SIGNUP_ENDPOINT`.

Recommended options:

- Use AWS Amplify Functions (Lambda) + DynamoDB. A sample Lambda handler is included at `amplify-backend/subscribe-lambda.js`. Steps:
	1. Create a DynamoDB table (example name `FikraSubscribers`) with `email` as the partition key.
	2. Deploy the Lambda (via Amplify Console or the Amplify CLI) and configure the environment variable `SUBSCRIBERS_TABLE` with your table name.
	3. Add an API Gateway or Amplify REST API pointing to the Lambda and use the generated endpoint as the `data-endpoint` on the forms.

- Alternatively, use a third-party form endpoint (Formspree, ConvertKit, etc.) and set that URL as the form `data-endpoint`.

### Full example: Amplify CLI steps (recommended)

These are the broad steps to deploy the subscribe + verify lambdas and a REST API using the Amplify CLI. Run these from your project root where `amplify` is initialized.

1. Initialize Amplify (if you haven't):

```powershell
amplify init
```

2. Add a DynamoDB table (via CloudFormation or the CLI). Example using `amplify add storage`:

```powershell
amplify add storage
# Choose NoSQL Database
# Provide table name: FikraSubscribers
# Partition key: email (String)
# Add TTL attribute: ttl (Number) [optional]
```

3. Add the subscribe function:

```powershell
amplify add function
# Provide name: subscribe
# Runtime: NodeJS
# Choose to edit the local lambda function now -> paste contents from amplify-backend/subscribe-lambda.js
```

4. Add the verify function:

```powershell
amplify add function
# Provide name: verify
# Runtime: NodeJS
# Edit the function with amplify-backend/verify-lambda.js contents
```

5. Attach policies so the functions can access the DynamoDB table and SES.

You can use the Amplify guided prompts to add storage permissions, or attach a custom policy. Example minimal IAM policy for DynamoDB+SES:

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Effect": "Allow",
			"Action": [
				"dynamodb:GetItem",
				"dynamodb:PutItem",
				"dynamodb:UpdateItem"
			],
			"Resource": [
				"arn:aws:dynamodb:*:*:table/FikraSubscribers"
			]
		},
		{
			"Effect": "Allow",
			"Action": [
				"ses:SendEmail",
				"ses:SendRawEmail"
			],
			"Resource": "*"
		}
	]
}
```

6. Add a REST API and connect routes to the functions (subscribe, verify):

```powershell
amplify add api
# Choose REST
# Provide path /subscribe -> connect to subscribe function
# Provide path /verify -> connect to verify function
```

7. Configure environment variables for the functions (SUBSCRIBERS_TABLE, FROM_EMAIL, FRONTEND_BASE, VERIFY_TOKEN_TTL) using Amplify Console or `amplify function update`.

8. Push changes:

```powershell
amplify push
```

Notes:
- You must verify your sending email/domain in SES (SES sandbox has restrictions). Verify `FROM_EMAIL` before sending.
- Set `FRONTEND_BASE` to your site URL so verification links are correct (e.g. https://yourdomain.com).

### Post-deploy: wiring the frontend

After `amplify push` the REST API will have an endpoint. Set this endpoint in the site forms:

- Option A: Edit each form's `data-endpoint` attribute in `index.html` to the full subscribe URL (e.g., `https://<api-id>.execute-api.<region>.amazonaws.com/prod/subscribe`).
- Option B (recommended): In Amplify Console -> App settings -> Environment variables, add `FIKRA_SIGNUP_ENDPOINT` and `FIKRA_VERIFY_ENDPOINT` and set them to the REST endpoints. The frontend reads `window.FIKRA_SIGNUP_ENDPOINT`/`FIKRA_VERIFY_ENDPOINT` if you set them at deploy-time.

### SES and double opt-in

- SES requires that you verify the source email address or domain before you can send. If your account is in the SES sandbox, you must also verify recipient addresses or request production access.
- The sample lambda sends a verification email with a link to `verify.html` which calls the verify lambda to mark the address as confirmed.

### Admin / Viewing subscribers

- For a basic admin view, create a simple secured page which calls a backend function that scans DynamoDB (requires additional IAM caution).
- Alternatively, use DynamoDB console to inspect items (not recommended for production dashboards).

If you'd like, I can prepare Amplify CLI command snippets tailored to your AWS account and then walk you step-by-step through `amplify push` (you will need AWS credentials available locally).

## Accessibility & UX improvements added
- Accessible labels and aria-live form messages for screen readers
- Configurable endpoint for backend POST
- Client-side validation and polite feedback messaging

## Next steps (suggested)
- Wire up a real backend endpoint and set `data-endpoint` on the forms or set `window.FIKRA_SIGNUP_ENDPOINT` in your deploy pipeline (Amplify environment variables).
- Add analytics/consent handling (GDPR) before storing emails or tracking conversions.
- Add server-side verification/double opt-in using Amazon SES or a mailing provider.
