const fs = require("fs");
const path = require("path");

const source = path.resolve(__dirname, "../../server/src/seed/seedData.json");
const target = path.resolve(__dirname, "../src/seedData.json");

// Skip silently when client is deployed standalone without the server directory.
if (fs.existsSync(source)) {
  const nextContent = fs.readFileSync(source, "utf8");
  const currentContent = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
  if (currentContent !== nextContent) {
    fs.writeFileSync(target, nextContent, "utf8");
  }
}
