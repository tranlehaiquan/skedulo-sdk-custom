const { spawn } = require("child_process");

(() => {
  const ls = spawn("ls");
  console.log(ls.pid)
  ls.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  ls.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  ls.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });
})();
