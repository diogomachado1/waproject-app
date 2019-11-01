/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const inquirer = require('inquirer');

async function init() {
  console.log('**********************************************************');
  console.log('\x1b[1m%s\x1b[0m', '> Veja as informações necessárias no ./docs/INFORMAÇÕES.md');
  console.log('**********************************************************\n');

  await configFirebase();
}

async function configFirebase() {
  console.log('\n**********************************************************');
  console.log('Acesse o painel do Firebase: https://firebase.google.com/');
  console.log('Siga os passos para criar um aplicativo e configuração de aplicativos');
  console.log('Baixe os arquivos google-services.json e GoogleService-Info.plist');
  console.log('**********************************************************\n');

  const params = await askParamsFirebase();

  const androidPath = `${__dirname}/../android/app/google-services.json`;
  fs.existsSync(androidPath) && fs.unlinkSync(androidPath);
  fs.renameSync(params.androidConfig, androidPath);

  const iosPath = `${__dirname}/../ios/reactApp/GoogleService-Info.plist`;
  fs.existsSync(iosPath) && fs.unlinkSync(iosPath);
  fs.renameSync(params.iosConfig, iosPath);
}

async function askParamsFirebase(answers = {}) {
  const params = await inquirer.prompt([
    {
      name: 'androidConfig',
      default: answers.androidConfig,
      message: 'Caminho do google-services.json (Android)',
      validate: v => (fs.existsSync(v) ? true : 'Arquivo não existe')
    },
    {
      name: 'iosConfig',
      default: answers.iosConfig,
      message: 'Caminho do GoogleService-Info.plist (iOS)',
      validate: v => (fs.existsSync(v) ? true : 'Arquivo não existe')
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
