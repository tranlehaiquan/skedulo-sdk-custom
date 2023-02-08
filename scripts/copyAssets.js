const fs = require("fs-extra");
// translate cmd below to code

// shx mkdir -p app/assets
// create app/assets
if (!fs.existsSync("app/assets")) {
  fs.mkdirSync("app/assets");
}

// cp src/*.{html,md} app/
fs.copySync("src", "app", {
  filter: (src) => {
    return src.match(/.*\.(html|md)$/);
  },
});

// cp -R src/assets app/
fs.copySync("src/assets", "app/assets", {
  overwrite: true,
});

// yarn run copy-ngrok
