import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORIAS_FILE = path.resolve(__dirname, "..", "..", "..", "data", "produtos", "categorias.json");
const PRODUTOS_FILE = path.resolve(__dirname, "..", "..", "..", "data", "produtos", "produtos.json");
const BRANDS_FILE = path.resolve(__dirname, "..", "..", "..", "data", "produtos", "brands.json");

let categoriasCache = null;
let produtosCache = null;
let brandsCache = null;

async function readJsonFile(filePath, label) {
  let raw = "[]";
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    process.stderr.write(
      `[mock-end] ${label} não conseguiu ler arquivo (${filePath}): ${String(err?.message ?? err)}\n`
    );
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    process.stderr.write(
      `[mock-end] ${label} JSON inválido (${filePath}): ${String(err?.message ?? err)}\n`
    );
    return [];
  }
}

async function loadCategorias() {
  if (categoriasCache) return categoriasCache;
  const parsed = await readJsonFile(CATEGORIAS_FILE, "mock/produtos(categorias)");
  categoriasCache = Array.isArray(parsed) ? parsed : [];
  return categoriasCache;
}

async function loadProdutos() {
  if (produtosCache) return produtosCache;
  const parsed = await readJsonFile(PRODUTOS_FILE, "mock/produtos(produtos)");
  produtosCache = Array.isArray(parsed) ? parsed : [];
  return produtosCache;
}

async function loadBrands() {
  if (brandsCache) return brandsCache;
  const parsed = await readJsonFile(BRANDS_FILE, "mock/produtos(brands)");
  brandsCache = Array.isArray(parsed) ? parsed : [];
  return brandsCache;
}

function toInt(value) {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function sortCategorias(a, b) {
  const ao = toInt(a?.order) ?? 0;
  const bo = toInt(b?.order) ?? 0;
  if (ao !== bo) return ao - bo;
  return (toInt(a?.id) ?? 0) - (toInt(b?.id) ?? 0);
}

function paginate(items, { page, pageSize }) {
  const total = items.length;
  const offset = (page - 1) * pageSize;
  const data = items.slice(offset, offset + pageSize);
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  return { data, page, pageSize, total, totalPages };
}

function normalizeCategoriaSlug(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "";
  if (raw.startsWith("/categoria/")) return raw;
  if (raw.startsWith("categoria/")) return `/${raw}`;
  if (raw.startsWith("/")) return raw;
  return `/categoria/${raw}`;
}

export class ProdutosController {
  async _categoriasIndex() {
    const categorias = await loadCategorias();
    const byId = new Map();
    const childrenByParent = new Map();

    for (const c of categorias) {
      const id = toInt(c?.id);
      if (id == null) continue;
      byId.set(id, c);
      const parentId = toInt(c?.parentId) ?? 0;
      const list = childrenByParent.get(parentId) ?? [];
      list.push(c);
      childrenByParent.set(parentId, list);
    }

    for (const [, list] of childrenByParent) list.sort(sortCategorias);
    return { byId, childrenByParent };
  }

  _buildNode(category, childrenByParent) {
    const id = toInt(category?.id);
    const children = (childrenByParent.get(id) ?? []).map((c) =>
      this._buildNode(c, childrenByParent)
    );
    return { ...category, children };
  }

  async categorias() {
    const { childrenByParent } = await this._categoriasIndex();
    const roots = childrenByParent.get(0) ?? [];
    return roots.map((c) => this._buildNode(c, childrenByParent));
  }

  async categoriaById(idCategoria) {
    const id = toInt(idCategoria);
    if (id == null) return null;
    const { byId, childrenByParent } = await this._categoriasIndex();
    const category = byId.get(id) ?? null;
    if (!category) return null;
    const categoryTree = this._buildNode(category, childrenByParent);
    return { category: categoryTree };
  }

  async categoriaBySlug(slug) {
    const key = normalizeCategoriaSlug(slug);
    if (!key) return null;
    const { byId, childrenByParent } = await this._categoriasIndex();
    const found =
      Array.from(byId.values()).find((c) => normalizeCategoriaSlug(c?.slug) === key) ?? null;
    if (!found) return null;
    const categoryTree = this._buildNode(found, childrenByParent);
    return { category: categoryTree };
  }

  async _collectDescendantCategoryIds(rootId, childrenByParent) {
    const out = new Set();
    const stack = [rootId];
    while (stack.length) {
      const current = stack.pop();
      if (current == null || out.has(current)) continue;
      out.add(current);
      const children = childrenByParent.get(current) ?? [];
      for (const child of children) {
        const childId = toInt(child?.id);
        if (childId != null) stack.push(childId);
      }
    }
    return out;
  }

  async produtosByCategoria(
    idCategoria,
    { includeDescendants = 1, page = 1, pageSize = 24 } = {}
  ) {
    const id = toInt(idCategoria);
    if (id == null) return null;
    const p = Math.max(1, toInt(page) ?? 1);
    const ps = Math.min(100, Math.max(1, toInt(pageSize) ?? 24));

    const { byId, childrenByParent } = await this._categoriasIndex();
    if (!byId.has(id)) return null;

    const produtos = await loadProdutos();

    const include = Number(includeDescendants) === 0 ? 0 : 1;
    const validCategoryIds = include
      ? await this._collectDescendantCategoryIds(id, childrenByParent)
      : new Set([id]);

    const filtered = produtos.filter((produto) => {
      const categoryId = toInt(produto?.category?.id);
      if (categoryId == null) return false;
      return validCategoryIds.has(categoryId);
    });
    return paginate(filtered, { page: p, pageSize: ps });
  }

  async produtoById(idProduto) {
    const id = toInt(idProduto);
    if (id == null) return null;
    const produtos = await loadProdutos();
    return produtos.find((p) => toInt(p?.id) === id) ?? null;
  }

  async produtoBySlug(slug) {
    const keyRaw = String(slug ?? "").trim().toLowerCase();
    const key = keyRaw.startsWith("/produtos/") ? keyRaw.slice("/produtos/".length) : keyRaw;
    if (!key) return null;
    const produtos = await loadProdutos();
    return (
      produtos.find((p) => {
        const raw = String(p?.slug ?? "").trim().toLowerCase();
        const base = raw.startsWith("/produtos/") ? raw.slice("/produtos/".length) : raw;
        return base === key;
      }) ?? null
    );
  }

  async brands() {
    const brands = await loadBrands();
    return brands;
  }

  async brandById(idBrand, { page = 1, pageSize = 24 } = {}) {
    const id = toInt(idBrand);
    if (id == null) return null;
    const p = Math.max(1, toInt(page) ?? 1);
    const ps = Math.min(100, Math.max(1, toInt(pageSize) ?? 24));

    const brands = await loadBrands();
    const brand = brands.find((b) => toInt(b?.id) === id) ?? null;
    if (!brand) return null;

    const produtos = await loadProdutos();
    const filtered = produtos.filter((produto) => {
      const bid = toInt(produto?.brand?.id);
      return bid === id;
    });

    return { brand, products: paginate(filtered, { page: p, pageSize: ps }) };
  }
}
