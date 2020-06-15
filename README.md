## SD Jamaat Website

### Current tooling:

- GatsbyJS & React
- Ant Design UI and Bootstrap
- Firebase Cloudstore as DB
- Firebase Cloud Functions

### Local Development

Step 1: Clone the repository with Git

```shell
git clone https://github.com/sdjamaat/website.git sdjwebsite
cd sdjwebsite
```

Step 2: Download npm modules ([NodeJS](https://nodejs.org/en/) and [Yarn](https://classic.yarnpkg.com/en/docs/install/)installation required).

```shell
yarn install
```

> Warning: DO NOT use npm to do this - it will screw up the entire project. If you do accidently install using npm instead of yarn, delete your `node_modules` folder and also delete your `package-lock.json` file. Then follow the step listed above again.

Step 3: Run locally on live server

```shell
npm run dev
# then navigate to localhost:8000
```

#### Install new npm modules

Always use yarn to install new npm modules - otherwise, follow the warning message below if you accidently install with npm.

```shell
yarn add [some npm module]
```

### Working with Firebase Functions

In this repository, there is a folder called `functions` which contains code related to Firebase cloud functions.

Step 1: Install the `firebase-tools` npm package globally

```shell
npm install -g firebase-tools
```

Step 2: Go into the `functions` directory. You will need to install dependencies here as well, however with `npm` this time instead of `yarn`

```shell
cd functions
npm install
```

#### To deploy new functions:

Step 1: You need to first be log into the webmaster@sandiegojamaat.net Google account. You only need to do this once (unless you're switching between other Firebase accounts)

```shell
# this will open up a browser window where you'll need to login
firebase login
```

Step 2: Use this shell command to deploy the functions:

```shell
firebase deploy --only functions
```
