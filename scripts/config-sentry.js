/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const inquirer = require('inquirer');

async function init() {
  const params = await askParams();

  await replaceContent('');

  await execCommand('yarn sentry-wizard -i reactNative -p ios android');
}

async function execCommand(command) {
  return new Promise((resolve, reject) => {
    childProcess.exec(command, (err, std) => (err ? reject(err) : resolve(std)));
  });
}

async function replaceContent(path, { appId, appName, slug }) {
  let content = fs.readFileSync(path, 'utf8');

  content = content
    .replace(/br\.com\.waproject\.base/gim, appId)
    .replace(/waproject/gm, slug)
    .replace(/Wa\sProject/gim, appName);

  fs.writeFileSync(path, content);
}

async function askParams(answers = {}) {
  const params = await inquirer.prompt([
    {
      name: 'dsn',
      default: answers.dsn,
      message: 'Sentry DSN:'
    },
    {
      name: 'confirmed',
      type: 'confirm',
      message: 'Confirma as configurações?'
    }
  ]);

  if (!params.confirmed) {
    console.log('---- Responda novamente:');
    return askParams(params);
  }

  return params;
}

module.exports = init;

if (require.main === module) {
  init()
    .then(() => {
      process.exit(0);
    })
    .catch(err => {
      console.log(err);
      process.exit(-1);
    });
}
