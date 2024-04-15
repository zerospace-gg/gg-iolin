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
  console.error("Error in main", e.stack);
  process.exit(1);
});

async function main() {
  await init();
  const strapi = initStrapi();
  console.log("Load Entities");
  const entities = await loadEntities();
  console.log("Load Tags");
  const tags = await loadTags();
  const all = { entities, tags };
  console.log("Add DB Search Fields");
  addDbFields(all);

  console.log("Seed Tags");
  await seedData(strapi, all.tags);
  console.log("Seed Entities");
  await seedData(strapi, all.entities);
  console.log("Seed Library Pages");
  await seedData(strapi, all.libraryPages);

  console.log("Add Relationships");
  await addRelationships(strapi, all);
  console.log("Generate Release Data");
  await generateReleaseData(all);
  console.log("Updating Release in DB");
  await updateRelease(strapi, all);
  console.log("Write seed output (for debugging)");
  await writeFile(
    resolve(seed, "seed-output.json"),
    JSON.stringify(all, null, 2),
  );
  console.log("Write Seed Release Meta");
  await writeFile(
    resolve(seed, "release.json"),
    JSON.stringify(all.release, null, 2),
  );
  console.log(insp(all.release, { depth: null, colors: true }));
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
  const strapi = createClient(auth);
  return strapi;
}

function prepareEntity(e, parent) {
  return {
    ggId: e.id ?? `${parent.id}-${e.slug}`,
    zsVersion: e.zsVersion,
    ggRelease: e.ggRelease,
    src: e.src,
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
}

function addDbFields(all) {
  const { tags, entities } = all;
  all.libraryPages = {};
  for (const [slug, rec] of Object.entries(entities)) {
    const e = rec.data;
    rec.prepared = prepareEntity(e);
    rec.me = slug;
    rec.tblkey = "slug";
    rec.tbl = "entities";

    for (const variant of ["infusedForm", "constructingForm"]) {
      if (rec.data[variant]) {
        const vdata = rec.data[variant];
        const vslug = vdata.slug;
        entities[vslug] = {
          data: vdata,
          prepared: prepareEntity(vdata, rec.data),
          me: vslug,
          tblkey: "slug",
          tbl: "entities",
          [`${variant}Of`]: rec.data.slug,
        };
      }
    }

    all.libraryPages[slug] = {
      data: { slug, id: rec.data.id, name: rec.data.name },
      prepared: { slug, ggId: rec.data.id, name: rec.data.name },
      me: slug,
      tblkey: "slug",
      tbl: "library-pages",
    };
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

async function addRelationships(strapi, { tags, entities, libraryPages }) {
  const getTags = (x) => x.map((y) => tags[y].db.id);
  const getEntities = (x) => x.map((y) => entities[y].db.id);
  for (const [slug, rec] of Object.entries(entities)) {
    // console.log(rec);
    const updateData = {
      tags: { set: getTags(rec.data.tagList) },
      creates: { set: getEntities(rec.data.creates ?? []) },
      isCreatedBy: { set: getEntities(rec.data.createdBy ?? []) },
      isUpgradedBy: { set: getEntities(rec.data.upgradedBy ?? []) },
      providesUpgradesFor: {
        set: getEntities(rec.data.providesUpgradesFor ?? []),
      },
      unlocks: { set: getEntities(rec.data.unlocks ?? []) },
      isUnlockedBy: { set: getEntities(rec.data.unlockedBy ?? []) },
      ...(rec.data.type === "faction" && {
        facPassives: { set: getEntities(rec.data.passive ?? []) },
      }),
      ...(rec.data.type === "faction-ability" &&
        rec.data.subyte === "passive" && {
          facPassiveOf: entities[rec.data.faction].db.id,
        }),
      ...(rec.data.type === "faction" && {
        facTalents: { set: getEntities(rec.data.talent ?? []) },
      }),
      ...(rec.data.type === "faction-ability" &&
        rec.data.subyte === "talent" && {
          facTalentOf: entities[rec.data.faction].db.id,
        }),
      ...(rec.data.type === "faction" && {
        facTopbars: { set: getEntities(rec.data.topbar ?? []) },
      }),
      ...(rec.data.type === "faction-ability" &&
        rec.data.subyte === "topbar" && {
          facTopbarOf: entities[rec.data.faction].db.id,
        }),
      ...(rec.data.infusedForm && {
        infusedForm: entities[rec.data.infusedForm.slug].db.id,
      }),
      ...(rec.infusedFormOf && {
        infusedFormOf: entities[rec.infusedFormOf].db.id,
      }),
      ...(rec.data.constructingVersion && {
        constructingForm: entities[rec.data.constructingVersion.slug].db.id,
      }),
      ...(rec.constructingFormOf && {
        constructingFormOf: entities[rec.constructingFormOf].db.id,
      }),
    };
    // console.log("UPDATE", slug, updateData);
    rec.dbWithRels = await update(strapi, rec.db.id, updateData, "entities");
  }

  for (const [slug, rec] of Object.entries(libraryPages)) {
    const updateData = { entity: entities[rec.data.slug].db.id };
    rec.dbWithRels = await update(
      strapi,
      rec.db.id,
      updateData,
      "library-pages",
    );
  }

  for (const [tag, rec] of Object.entries(tags)) {
    const updateData = {
      entities: {
        set: Object.values(entities)
          .filter((x) => x.data.tagList.includes(tag))
          .map((x) => x.db.id),
      },
    };
    // console.log("update", tag, updateData);

    rec.dbWithRels = await update(strapi, rec.db.id, updateData, "tags");
  }
}

async function seedData(strapi, things) {
  const first = Object.values(things)[0];
  // console.log({ first });
  const existing = await getExisting(strapi, first.tblkey, first.tbl);
  // console.log("existing", existing);
  for (const [key, thing] of Object.entries(things)) {
    // console.log("processing", thing.tblkey, key);
    // console.log(thing);
    if (existing[thing.me]) {
      const { id } = existing[thing.me];
      const updated = await update(strapi, id, thing.prepared, thing.tbl);
      thing.db = updated;
      // console.log("updated", thing.tblkey, key);
    } else {
      const created = await create(strapi, thing.prepared, thing.tbl);
      thing.db = created;
      // console.log("created", thing.tblkey, key);
    }
  }
}

async function getExisting(strapi, key, tbl) {
  let all = [];
  let page = 1;
  // console.log("fetching", key, tbl);
  while (true) {
    const { data, error, meta } = await strapi
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

async function create(strapi, inputData, tbl) {
  const { data, error, meta } = await strapi.from(tbl).create(inputData);
  if (error) {
    console.log(inspect(inputData, { depth: null, colors: true }));
    console.log(inspect(error, { depth: null, colors: true }));
    process.exit(1);
  }
  return data;
}

async function update(strapi, id, inputData, tbl) {
  const { data, error, meta } = await strapi.from(tbl).update(id, inputData);
  if (error) {
    console.log(inspect(error, { depth: null, colors: true }));
  }
  return data;
}

async function generateReleaseData(all) {
  const { tags, entities } = all;

  let release = JSON.parse(await readFile(resolve(dist, "release.json")));
  release.iolinCounts = release.counts;
  release.dbCounts = { tags: Object.values(tags).length };

  delete release.counts;
  for (const e of Object.values(entities)) {
    const full = e.db.fulltype;
    release.dbCounts[full] = (release.dbCounts[full] ?? 0) + 1;
  }

  let total = 0;
  for (const num of Object.values(release.dbCounts)) total += num;
  release.dbCounts.total = total;

  all.release = release;
  all.releaseForDB = {
    ...release,
    iolinCounts: JSON.stringify(release.iolinCounts),
    dbCounts: JSON.stringify(release.dbCounts),
  };
}

async function updateRelease(strapi, all) {
  const { releaseForDB } = all;
  const { error } = await strapi
    .from("gg-data-release")
    .update("", releaseForDB);
  if (error) throw new Error(`${error.status} ${error.name}: ${error.message}`);
}
