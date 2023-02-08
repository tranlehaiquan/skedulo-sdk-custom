const fs = require("fs-extra");

// shx cp -R .cache/osx/ngrok app/assets/ngrok-osx
fs.copySync(".cache/osx/ngrok", "app/assets/ngrok-osx");

// shx cp -R .cache/win/ngrok.exe app/assets/ngrok-win.exe
fs.copySync(".cache/win/ngrok.exe", "app/assets/ngrok-win.exe");

// shx cp -R .cache/linux/ngrok app/assets/ngrok-linux
fs.copySync(".cache/linux/ngrok", "app/assets/ngrok-linux");

// shx chmod +x app/assets/ngrok-*
fs.chmodSync("app/assets/ngrok-osx", 0o755);
