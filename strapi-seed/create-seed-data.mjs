import {
  readdir,
  readFile,
  writeFile,
  mkdir,
  copyFile,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const dist = resolve(__dirname, "../dist/json");
const seed = resolve(__dirname, "../dist/strapi-seed");
const files = (await readdir(dist, { recursive: true })).filter(
  (x) =>
    x.endsWith(".json") &&
    x !== resolve(dist, "tags.json") &&
    x !== resolve(dist, "all.json"),
);
const entries = await Promise.all(
  files.map(async (file) => JSON.parse(await readFile(resolve(dist, file)))),
);

const fieldTypes = {};

for (const entry of entries) {
  for (const [key, value] of Object.entries(entry)) {
    if (key === "slug") continue;
    let t = Array.isArray(value) ? "array" : typeof value;
    if (fieldTypes[key] == undefined) {
      fieldTypes[key] = t;
    } else if (fieldTypes[key] !== t) {
      throw new Error(`Conflict: ${key} ${fieldTypes[key]} ${t}`);
    }
  }
}

// console.log(fieldTypes);

const schema = base();
for (const [field, type] of Object.entries(fieldTypes)) {
  if (field === "ggUpdated") schema.attributes[field] = { type: "datetime" };
  else if (field === "id") schema.attributes.ggId = { type };
  else if (type === "array") continue;
  else if (field === "notes") continue;
  else if (type === "number") schema.attributes[field] = { type: "decimal" };
  else schema.attributes[field] = { type };
}
for (const [field, def] of Object.entries(append)) {
  schema[field] = def;
}

let tagged = {};
let references = {};

const counts = {};
let total = 0;

const zsEntities = entries
  .map((entry) => {
    let r = {};
    if (!entry.slug && !entry.id) return;
    for (const t of entry.tagList) {
      if (!tagged[t]) tagged[t] = [];
      tagged[t].push(entry.slug);
    }
    references[entry.slug] = entry.references;
    for (const [key, value] of Object.entries(entry)) {
      if (key === "slug") r[key] = value;
      else if (key === "ggUpdated") r[key] = new Date(value);
      else if (key === "id") r.ggId = value;
      else if (key === "notes") continue;
      else if (key === "tagList") continue;
      else if (key === "references") continue;
      else if (fieldTypes[key] === "array")
        continue; // r[key] = value.join(",");
      else r[key] = value;
    }
    let fulltype = entry.type + "/" + entry.subtype;
    counts[fulltype] = (counts[fulltype] ?? 0) + 1;
    total++;
    return r;
  })
  .filter(Boolean);

const allTags = Object.entries(
  JSON.parse(await readFile(resolve(dist, "tags.json"))).tags,
).map(([name, label]) => ({ name, label }));

await mkdir(seed, { recursive: true });
await writeFile(
  resolve(seed, "zs-entity.json"),
  JSON.stringify(schema, null, 2),
);
await writeFile(resolve(seed, "zs-entities.json"), JSON.stringify(zsEntities));
await writeFile(resolve(seed, "tagged.json"), JSON.stringify(tagged));
await writeFile(resolve(seed, "references.json"), JSON.stringify(references));
await writeFile(resolve(seed, "tags.json"), JSON.stringify(allTags));
await copyFile(resolve(dist, "all.json"), resolve(seed, "all.json"));
await writeFile(
  resolve(seed, "seed-info.json"),
  JSON.stringify({ counts, total }, null, 2),
);

console.log("done!");

function base() {
  return {
    kind: "collectionType",
    collectionName: "zs_entities",
    info: {
      singularName: "zs-entity",
      pluralName: "zs-entities",
      displayName: "ZS Entity",
    },
    options: {
      draftAndPublish: false,
    },
    pluginOptions: {},
    attributes: {
      slug: {
        type: "string",
        required: true,
        unique: true,
      },
    },
  };
}

function append() {
  return {
    tags: {
      type: "relation",
      relation: "manyToMany",
      target: "api::tag.tag",
      mappedBy: "zsEntities",
    },
    references: {
      type: "relation",
      relation: "manyToMany",
      target: "api::zs-entity.zs-entity",
      inversedBy: "referencedBy",
    },
    referencedBy: {
      type: "relation",
      relation: "manyToMany",
      target: "api::zs-entity.zs-entity",
      inversedBy: "references",
    },
  };
}
