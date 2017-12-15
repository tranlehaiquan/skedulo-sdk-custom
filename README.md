# Custom Pages SDK

## Installation
```bash
# Install all the dependencies
yarn bootstrap

# This will compile and copy over files to the required folders for the Electron SDK to run.
yarn compile

# Launch SDK
yarn start-ui
```
### SSL setup
If you have never set up the project before you will need to setup a trusted SSL certificate on your machine. Once you run the SDK it will check if you have the required SSL certificate and key required for the project. If you don't it will guide you through the process of creating them and adding them as a trusted certificate to your system. Check if the certificate is valid by going to this URL: [https://localhost:1928/pig](https://localhost:1928/pig). You should see a green lock icon next to the address in Chrome with an adorable response of 'oink' in the webpage.

<em>Skedulo itself should also be using a secure certificate though this is usually handled through the bootstrapping process. If running through Windows linux subsystem and Chrome is not seeing the certificates as valid, you may need to copy over your certs to the linux subsystem home directory from your mounted Windows drive. See get-localhost-ssl.js in the Skedulo project.</em>

## Development
```bash
# When actively developing in the SDK ( both code and styles )
# You can simply hit Cmd + R or Ctrl + R to refresh the app for code changes inside `/ui` and styles.
# When code is changed inside the `/server` folder, the app is automatically restarted
yarn dev
# and in another terminal
yarn dev-ui
```
