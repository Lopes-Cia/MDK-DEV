export type AllowedJobScript =
  | "seed:catalog"
  | "extract:xlsx"
  | "gen:blueprint"
  | "gen:builder"
  | "verify";

export const ALLOWED_JOB_SCRIPTS: AllowedJobScript[] = [
  "seed:catalog",
  "extract:xlsx",
  "gen:blueprint",
  "gen:builder",
  "verify",
];

export const JOBS: Array<{
  script: AllowedJobScript;
  title: string;
  description: string;
}> = [
  {
    script: "seed:catalog",
    title: "seed:catalog",
    description: "Gera catálogos (categorias/produtos) a partir das fontes do MOCK-END.",
  },
  {
    script: "extract:xlsx",
    title: "extract:xlsx",
    description: "Extrai XLSX para IA (primeiro passo do pipeline).",
  },
  {
    script: "gen:blueprint",
    title: "gen:blueprint",
    description: "Gera blueprint + copy (pipeline).",
  },
  {
    script: "gen:builder",
    title: "gen:builder",
    description: "Gera arquivos do Builder (pages/presets/enabledBlocks).",
  },
  {
    script: "verify",
    title: "verify",
    description: "Verificações (themes, mockend, e node_modules vendorizado).",
  },
];

