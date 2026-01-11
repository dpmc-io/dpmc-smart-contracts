const fs = require("fs");

function perNetFile(network) {
  return `deployments/${network}.json`;
}

function readLatest(network) {
  const file = perNetFile(network);
  if (fs.existsSync(file)) {
    try {
      const arr = JSON.parse(fs.readFileSync(file, "utf8"));
      if (Array.isArray(arr) && arr.length > 0) return arr[arr.length - 1];
    } catch {}
  }
  if (fs.existsSync("deployments/last-deploy.json")) {
    try {
      return JSON.parse(fs.readFileSync("deployments/last-deploy.json", "utf8"));
    } catch {}
  }
  return null;
}

function append(network, record) {
  const file = perNetFile(network);
  let arr = [];
  if (fs.existsSync(file)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
      if (Array.isArray(parsed)) arr = parsed;
    } catch {}
  }
  arr.push(record);
  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync(file, JSON.stringify(arr, null, 2));
}

module.exports = { readLatest, append };
