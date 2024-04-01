import { writeFileSync, readFileSync } from "node:fs";

const now = Date.now();
const nowstr = new Date(now).toISOString();
const nowtiny = nowstr
  .replace(/\.\d{3}Z/, "")
  .replace(/[^0-9T]+/g, "")
  .replace("T", "-");
const [
  ,
  ,
  version,
  input,
  outputjson,
  outputjsonmin,
  outputmanifest,
  outputversion,
] = process.argv;

console.log("Version:", version);
console.log("Input:", input);
const data = JSON.parse(readFileSync(input, "utf8"));

data.buildVersion = version;
data.buildTime = nowstr;
data.releaseId = `${version}-${nowtiny}-${data.buildId}`;

const json = JSON.stringify(data, null, 2);
const manifest = JSON.stringify(
  {
    buildVersion: data.buildVersion,
    buildTime: data.buildTime,
    releaseId: data.releaseId,
  },
  null,
  2,
);
const jsonmin = JSON.stringify(data);

console.log("Writing  ", outputjson);
writeFileSync(outputjson, json, "utf8");

console.log("Writing  ", outputjsonmin);
writeFileSync(outputjsonmin, jsonmin, "utf8");

console.log("Writing  ", outputversion);
writeFileSync(outputversion, `${data.releaseId}\n`, "utf8");

console.log("Writing  ", outputmanifest);
writeFileSync(outputmanifest, manifest, "utf8");
