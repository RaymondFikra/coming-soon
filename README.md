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

## Accessibility & UX improvements added
- Accessible labels and aria-live form messages for screen readers
- Configurable endpoint for backend POST
- Client-side validation and polite feedback messaging

## Next steps (suggested)
- Wire up a real backend endpoint and set `data-endpoint` on the forms or set `window.FIKRA_SIGNUP_ENDPOINT` in your deploy pipeline (Amplify environment variables).
- Add analytics/consent handling (GDPR) before storing emails or tracking conversions.
- Add server-side verification/double opt-in using Amazon SES or a mailing provider.
