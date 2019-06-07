# github-app-check-example

A template for a simple GitHub app that responds to webhooks and is implemented
using Cloud Function.



## Deploying

```bash
gcloud functions deploy github-check-hello-world \
  --entry-point checkHandler \
  --runtime nodejs8 \
  --trigger-http \
  --env-vars-file .env
```
