import { readFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { inspect } from "node:util";
import { createClient } from "@kmariappan/strapi-client-js";

const [, , dir] = process.argv;

const auth = {
  apiToken: process.env.STRAPI_TOKEN,
  url: process.env.STRAPI_URL ?? "http://localhost:1337/api",
};
console.log({ auth });
const strapiClient = createClient(auth);
const seeddir = resolve(dir);

const zsEntities = JSON.parse(
  await readFile(resolve(seeddir, "zs-entities.json")),
);
const tags = JSON.parse(await readFile(resolve(seeddir, "tags.json")));
const tagged = JSON.parse(await readFile(resolve(seeddir, "tagged.json")));
const references = JSON.parse(
  await readFile(resolve(seeddir, "references.json")),
);

console.log("ENT", zsEntities.length);
console.log("TAG", Object.keys(tags).length);
console.log("TAG-R", Object.keys(tagged).length);
console.log("REF", Object.keys(references).length);

const entitySlugs = zsEntities.map(({ slug }) => ({ slug }));

await seed(zsEntities, "slug", "zs-entities");
await seed(entitySlugs, "slug", "library-pages");
await seed(tags, "name", "tags");

async function seed(data, key, tbl) {
  const existing = await getExisting(key, tbl);
  for (const datum of data) {
    if (existing[datum[key]]) {
      console.log("update", tbl, key, datum[key]);
      const updated = await update(existing[datum[key]].id, datum, tbl);
    } else {
      console.log("create", tbl, key, datum[key]);
      const created = await create(datum, tbl);
    }
  }
}

async function getExisting(key, tbl) {
  let all = [];
  let page = 1;
  console.log("fetching", key, tbl);
  while (true) {
    const { data, error, meta } = await strapiClient
      .from(tbl)
      .select([key])
      .paginate(page, 100)
      .get();
    if (meta.pagination.pageCount === 0) return {};
    if (error) {
      console.log("ERROR FETCHING", key, tbl);
      console.log(inspect(error, { depth: null, colors: true }));
      process.exit(1);
    }
    all.push(...data);
    if (meta.pagination.pageCount === meta.pagination.page) break;
    page++;
  }
  const asObj = all.reduce((m, x) => {
    m[x[key]] = x;
    return m;
  }, {});
  return asObj;
}
async function create(inputData, tbl) {
  const { data, error, meta } = await strapiClient.from(tbl).create(inputData);
  if (error) {
    console.log(inspect(inputData, { depth: null, colors: true }));
    console.log(inspect(error, { depth: null, colors: true }));
    process.exit(1);
  }
  return data;
}

async function update(id, inputData, tbl) {
  const { data, error, meta } = await strapiClient
    .from(tbl)
    .update(id, inputData);
  if (error) {
    console.log(inspect(error, { depth: null, colors: true }));
  }
  return data;
}
