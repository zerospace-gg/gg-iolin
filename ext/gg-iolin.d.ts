/*

I lament that I cannot fully auto-generate these and they need
to be edited manually.

There are pkl bindings for typescript, but they require talking
to a live java process over stdio, so there's no good way to embed
that whole thing into browser-side js.

Pkl is designed to define types to author data formats that are
already specified. We are authoring data using Pkl as source of
truth of the data and originator of the specification / types.

Perhaps a custom pkl renderer that can output types, or even
output .ts files rather than json would be a good solution here, but
that's out of scope for our project, and it's far easier to just
mirror the types. as much as i loathe doing so.
*/

export type FactionType = "main" | "merc" | "nonplayer";

export type Tier = "T0" | "T1" | "T2" | "T3" | "T1.5" | "T2.5" | "T3.5" | "T4";

export type UpgradeTier = "T1.5" | "T2.5" | "T3.5";

export type HotKey = string;

export type ArmorType = "none" | "light" | "medium" | "heavy";

export type DomainType = "air" | "ground";

export type AllyDomainType = "friendly/air" | "friendly/ground";

export type TargetType = DomainType | AllyDomainType | "self" | "map";

export type TargetMode = "gamepiece" | "location" | "around-self" | "strip";

export type EnergyType = "classic" | "abes" | "topbar";

export type AddOnType =
  | "turret"
  | "sacrifice"
  | "building-upgrade"
  | "building-turret";

export type AbilityActivationType =
  | "auto"
  | "activated"
  | "passive"
  | "trigger";

export type AbilityToggleMode = "siege" | "attack";

export type AbilityType =
  | "attack"
  | "heal"
  | "spell"
  | "passive"
  | "toggle"
  | "trigger";

export type AutoCastMode = "always" | "toggle" | "never";

export type BuildingType =
  | "base"
  | "extractor"
  | "supply"
  | "production"
  | "tech"
  | "special"
  | "constructing-unit";

export interface Entity {
  slug: string;
  id: string;
  src: string;
  name: string;
  shortName: string;
  description: string;
  type: string;
  subtype: string;
  tier?: string;
  faction?: string;
  factionType?: FactionType;
  tagList: string;
  inGame: boolean;
  fromFuture: boolean;
  creates: string[];
  createdBy: string[];
  unlocks: string[];
  unlockedBy: string[];
  unlocksMercTier: string[];
}

export interface Ability extends Entity {
  activationType: AbilityActivationType;
  subtype: AbilityType;
  hotkey?: HotKey;
  reverseHotkey?: HotKey;
  targets: TargetType[];
  targetMode?: TargetMode;
  togglesMode?: AbilityToggleMode;
  energyCost?: number;
  energyType?: EnergyType;
  cooldown?: number;
  cooldownAtBuild?: number;
  duration?: number;
  range?: number;
  delay?: number;
  abilityOf?: string;
  shots?: number;
  volleys?: number;
  teleport?: number;
  providesDetection?: number;
  effectArea?: number;
  arcAngle?: number;
  chargeTime?: number;
  chargeMaxMultiplier?: number;
  damage?: number;
  damageOverTime?: number;
  damagePerSec?: number;
  damageDisplay?: string;
  healing?: number;
  healingOverTime?: number;
  healingPerSec?: number;
  healingDisplay?: string;
  areaRange?: number;
  areaDamage?: number;
  areaOverTime?: number;
  chainTargets?: number;
  chainReductionPercent?: number;
  splashPercent?: number;
  splashRange?: number;
  splashOverTime?: number;
  splashDisplay?: string;
  bonusPercent?: number;
  bonusVsTags?: string[];
  requiresAddOn?: string;
  autocast: AutoCastMode;
}

export interface Gamepiece extends Entity {
  hexiteCost?: number;
  fluxCost?: number;
  buildCount?: number;
  cooldown?: number;
  energyCost?: number;
  energyCostType?: EnergyType;
  buildTime?: number;
  rebuildable?: boolean;
  rebuildTime?: number;
  domain: DomainType;
  hotkey?: HotKey;
  gathersFlux?: number;
  gathersRichFlux?: number;
  gathersHexite?: number;
  gathersEmptyHexite?: number;
  supply?: number;
  hp?: number;
  vision?: number;
  speed?: number;
  shields?: number;
  abesEnergy?: number;
  energy?: number;
  armor?: number;
  armorType?: ArmorType;
  stunResist?: number;
  provedsSupply?: number;
  providesBiomass?: number;
  providesDetection?: number;
  providesUpgradesFor?: string[];
  upgradedBy?: string[];
  targetable?: boolean;
  carryCapacity?: number;
  maxAddOns?: number;
  hasAddOnType?: AddOnType;
  ability: Record<string, Ability>;
  addOn: Record<string, AddOn>;
  uuid: string;
}

export interface AddOn extends Gamepiece {
  addOnType: AddOnType;
  addOnOf: string;
  ability: Record<string, Ability>;
}

export interface Upgrade extends Entity {
  upgradeOf: string;
}

export interface Building extends Gamepiece {
  buildingType: BuildingType;
}

export interface Unit extends Gamepiece {
  constructingForm?: Building;
  mindConrollable?: boolean;
  infusable?: boolean;
  infusedForm?: Unit;
  infuseCost?: number;
  upgrade: Record<string, Upgrade>;
}

export interface FactionAbility extends Entity {
  activationType: AbilityActivationType;
  subtype: AbilityType;
  hotkey?: HotKey;
  reverseHotkey?: HotKey;
  targets: TargetType[];
  targetMode?: TargetMode;
  togglesMode?: AbilityToggleMode;
  energyCost?: number;
  energyType?: EnergyType;
  cooldown?: number;
  cooldownAtBuild?: number;
  duration?: number;
  range?: number;
  delay?: number;
  abilityOf?: string;
  shots?: number;
  volleys?: number;
  teleport?: number;
  providesDetection?: number;
  effectArea?: number;
  arcAngle?: number;
  chargeTime?: number;
  chargeMaxMultiplier?: number;
  damage?: number;
  damageOverTime?: number;
  damagePerSec?: number;
  damageDisplay?: string;
  healing?: number;
  healingOverTime?: number;
  healingPerSec?: number;
  healingDisplay?: string;
  areaRange?: number;
  areaDamage?: number;
  areaOverTime?: number;
  splashPercent?: number;
  splashRange?: number;
  splashOverTime?: number;
  splashDisplay?: string;
  bonusPercent?: number;
  bonusVsTags?: string[];
  requiresAddOn?: string;
  autocast: AutoCastMode;
}

export interface FactionPassive extends FactionAbility {}

export interface FactionTalent extends FactionAbility {
  level: number;
  column: number;
}

export interface FactionTopbar extends FactionAbility {
  slot: number;
}

export interface Faction extends Entity {
  mercHeroesAllowed: boolean;
  hero: string[];
  unit: string[];
  building: string[];
  passive: Record<string, FactionPassive>;
  talent: Record<string, FactionTalent>;
  topbar: Record<string, FactionTopbar>;
}

export interface RTSMap extends Entity {
  xpTowers: number;
  fluxDistance: "close" | "near" | "medium-far" | "distant";
  mapSize: "small" | "medium" | "large";
  players: number;
}

export type AnyGamepiece = Unit | Building | AddOn;

export interface MetaReleaseCounts {
  tags: number;
  units: number;
  buildings: number;
  factions: number;
  maps: number;
  talents: number;
  passives: number;
  topbars: number;
  total: number;
}

export interface MetaRelease {
  zsVersion?: string;
  ggVersion?: string;
  ggUpdated?: string;
  ggRelease?: string;
  counts: MetaReleaseCounts;
}

export interface MetaIdxSummary {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  type: string;
  subtype: string;
  faction?: string;
  tier?: string;
  hotkey?: string;
  inGame: boolean;
}

export interface MetaIdx {
  all: Record<string, MetaIdxSummary>;
  ids: Record<string, string>;
}
