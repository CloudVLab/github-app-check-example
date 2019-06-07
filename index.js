const { Storage } = require('@google-cloud/storage');
const createApp = require('github-app');
const tmp = require('tmp');

const APP_NAME = process.env.APP_NAME || 'Sample Validator';

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.checkHandler = async (req, res) => {
  // Validate input
  const repoOwner = req.body.repository.owner.login;
  const repoName = req.body.repository.name;
  const installationId = req.body.installation.id;
  const headSha = req.body.check_suite.head_sha;


  const pemFilePath = await downloadCloudStorageFile(
    process.env.GCS_SECRETS_BUCKET,
    process.env.GITHUB_APP_PEM_FILE
  )

  const app = createApp({
    id: process.env.GITHUB_APP_ID,
    // The private key for your app, which can be downloaded from the
    // app's settings: https://github.com/settings/apps
    cert: require('fs').readFileSync(pemFilePath)
  });

  app.asInstallation(installationId).then(async github => {
    // Create an initial GitHub check that is 'in progress'
    const { data: check } = await github.checks.create({
      'owner': repoOwner,
      'repo': repoName,
      'name': APP_NAME,
	    'head_sha': headSha,
      'status': 'in_progress'
    });


    // Perform Check Business logic
    const conclusion = 'success'
    const completedAt = new Date(Date.now()).toISOString();


    await github.checks.update({
      'owner': repoOwner,
      'repo': repoName,
      'check_run_id': check.id,
      'status':'completed',
      'conclusion': conclusion,
      'completed_at': completedAt,
      "output": {
        "title": `All ${APP_NAME} tests have passed.`,
        "summary": `All ${APP_NAME} tests have passed.`
      }
    });
  });

  let message = req.query.message || req.body.message || 'OK';
  res.status(200).send({ message: message });
};


/**
 * Download a file from Cloud Storage and put it in the /tmp/ directory.
 *
 * @param {String} bucket Name of GCS bucket.
 * @param {String} filename Target file to download.
 * @returns {String} Path to downloaded file in local file system.
 */
async function downloadCloudStorageFile(bucket, filename) {
  const storage = new Storage();
  const tempLocalPath = tmp.tmpNameSync();

  await storage.bucket(bucket).file(filename).
                download({destination: tempLocalPath});

  return tempLocalPath;
};
