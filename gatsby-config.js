const lessToJson = require("less-to-json")
require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
})

module.exports = {
  plugins: [
    `gatsby-plugin-styled-components`,
    {
      resolve: "gatsby-plugin-antd",
      options: {
        style: true,
      },
    },
    {
      resolve: "gatsby-plugin-less",
      options: {
        javascriptEnabled: true,
        modifyVars: lessToJson("src/theme/theme.less"),
      },
    },
    {
      resolve: `gatsby-plugin-google-fonts`,
      options: {
        fonts: [`Cormorant Garamond`],
        display: "swap",
      },
    },
    {
      resolve: "gatsby-plugin-firebase",
      options: {
        credentials: {
          apiKey:
            process.env.NODE_ENV === "production"
              ? process.env.GATSBY_PROD_FIREBASE_API_KEY
              : process.env.GATSBY_FIREBASE_API_KEY,
          authDomain:
            process.env.NODE_ENV === "production"
              ? process.env.GATSBY_PROD_FIREBASE_AUTH_DOMAIN
              : process.env.GATSBY_FIREBASE_AUTH_DOMAIN,
          databaseURL:
            process.env.NODE_ENV === "production"
              ? process.env.GATSBY_PROD_FIREBASE_DATABASE_URL
              : process.env.GATSBY_FIREBASE_DATABASE_URL,
          projectId:
            process.env.NODE_ENV === "production"
              ? process.env.GATSBY_PROD_FIREBASE_PROJECT_ID
              : process.env.GATSBY_FIREBASE_PROJECT_ID,
          storageBucket:
            process.env.NODE_ENV === "production"
              ? process.env.GATSBY_PROD_FIREBASE_STORAGE_BUCKET
              : process.env.GATSBY_FIREBASE_STORAGE_BUCKET,
          messagingSenderId:
            process.env.NODE_ENV === "production"
              ? process.env.GATSBY_PROD_FIREBASE_MESSAGING_SENDER_ID
              : process.env.GATSBY_FIREBASE_MESSAGING_SENDER_ID,
          appId:
            process.env.NODE_ENV === "production"
              ? process.env.GATSBY_PROD_FIREBASE_APP_ID
              : process.env.GATSBY_FIREBASE_APP_ID,
          measurementId:
            process.env.NODE_ENV === "production"
              ? process.env.GATSBY_PROD_FIREBASE_MEASUREMENT_ID
              : process.env.GATSBY_FIREBASE_MEASUREMENT_ID,
        },
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/src/images`,
        name: "images",
      },
    },
  ],
}
