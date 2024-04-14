import { readdir, writeFile, readFile, mkdir } from "node:fs/promises";
import { formatWithOptions, inspect } from "node:util";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@kmariappan/strapi-client-js";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const insp = (x) => inspect(x, { depth: null, colors: true });
const dist = resolve(__dirname, "../dist/json");
const seed = resolve(__dirname, "../dist/seed");

await main().catch((e) => {
  console.error("Error in main", e, e.stack);
  process.exit(1);
});

async function main() {
  await init();
  const strapi = initStrapi();
  const entities = await loadEntities();
  const tags = await loadTags();
  const all = { entities, tags };
  addDbFields(all);
  // console.log(tags);
  await seedData(strapi, all.tags);
  await seedData(strapi, all.entities);
  // console.log(insp(Object.keys(entities)));
  // console.log(Object.entries(entities)[37]);
  await addRelationships(all);
  // await writeFile(
  //   resolve(seed, "seed-output.json"),
  //   JSON.stringify(all, null, 2),
  // );
}

async function init() {
  await mkdir(seed, { recursive: true });
}

async function loadTags() {
  const tags = JSON.parse(await readFile(resolve(dist, "tags.json")));
  const ret = {};
  for (const [k, data] of Object.entries(tags.tags)) {
    ret[k] = { data };
  }
  return ret;
}

async function loadEntities() {
  const files = (await readdir(dist, { recursive: true })).filter(
    (x) => x.endsWith(".json") && x.includes("/"),
  );

  const entities = (
    await Promise.all(
      files.map(async (file) =>
        JSON.parse(await readFile(resolve(dist, file))),
      ),
    )
  ).reduce((obj, entity) => {
    obj[entity.slug] = { data: entity };
    return obj;
  }, {});

  return entities;
}

function initStrapi() {
  const auth = {
    apiToken: process.env.STRAPI_TOKEN,
    url: process.env.STRAPI_URL ?? "http://localhost:1337/api",
  };
  // console.log({ auth });
  const strapiClient = createClient(auth);
  return strapiClient;
}

function addDbFields({ tags, entities }) {
  for (const [slug, rec] of Object.entries(entities)) {
    const e = rec.data;
    rec.prepared = {
      ggId: e.id,
      slug: e.slug,
      name: e.name,
      description: e.description,
      srs: e.src,
      type: e.type,
      subtype: e.subtype,
      fulltype: `${e.type}/${e.subtype}`,
      inGame: e.inGame,
      fromFuture: e.fromFuture,
      data: JSON.stringify(e),
    };
    rec.me = slug;
    rec.tblkey = "slug";
    rec.tbl = "entities";
  }
  // console.log(tags);
  for (const [tag, rec] of Object.entries(tags)) {
    const e = rec.data;
    rec.prepared = e;
    rec.me = tag;
    rec.tblkey = "tag";
    rec.tbl = "tags";
  }
}

//MARK: what
async function addRelationships({ tags, entities }) {
  for (const [slug, rec] of Object.entries(entities)) {
    for (const tag of rec.data.tagList) {
      console.log("ADD TAG RELATIONSHIP", slug, tag);
      break;
    }
    break;
  }
}

async function seedData(strapiClient, things) {
  const first = Object.values(things)[0];
  // console.log({ first });
  const existing = await getExisting(strapiClient, first.tblkey, first.tbl);
  console.log("existing", existing);
  for (const [key, thing] of Object.entries(things)) {
    console.log("processing", thing.tblkey, key);
    // console.log(thing);
    if (existing[thing.me]) {
      const { id } = existing[thing.me];
      const updated = await update(strapiClient, id, thing.prepared, thing.tbl);
      thing.db = updated;
      console.log("updated", thing.tblkey, key);
    } else {
      const created = await create(strapiClient, thing.prepared, thing.tbl);
      thing.db = created;
      console.log("created", thing.tblkey, key);
    }
  }
}

async function getExisting(strapiClient, key, tbl) {
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
async function create(strapiClient, inputData, tbl) {
  const { data, error, meta } = await strapiClient.from(tbl).create(inputData);
  if (error) {
    console.log(inspect(inputData, { depth: null, colors: true }));
    console.log(inspect(error, { depth: null, colors: true }));
    process.exit(1);
  }
  return data;
}

async function update(strapiClient, id, inputData, tbl) {
  const { data, error, meta } = await strapiClient
    .from(tbl)
    .update(id, inputData);
  if (error) {
    console.log(inspect(error, { depth: null, colors: true }));
  }
  return data;
}
