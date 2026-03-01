
#!/usr/bin/env python3
"""
Seed de presentes (tabela `gifts`) a partir de uma planilha Excel.

✅ Corrige o problema do Mercado Pago (324 -> 3,24):
- Este script salva o preço no banco em CENTAVOS (inteiro).
  Ex.: "324" (R$ 324,00) vira 32400.
- Assim, quando seu checkout fizer /100 para mandar ao Mercado Pago,
  o valor fica correto (32400/100 = 324.00).

Além disso:
- Lê: Nome do Produto, Preço (R$), Link de Referência
- Resolve imagem a partir de uma lista real de arquivos (images.txt)
- Insere em: gifts(id, name, price, link, image)

Uso:
  python3 seed_gifts.py --db ./database.sqlite --xlsx ./Lista.xlsx --images-list ./images.txt --truncate

Observações:
- Se a coluna `image` não existir, o script tenta criar via ALTER TABLE.
- `price` é armazenado como inteiro em CENTAVOS.
"""
import argparse
import sqlite3
import uuid
import re
import unicodedata
from pathlib import Path
import difflib

import pandas as pd


# -----------------------------
# Helpers de texto/normalização
# -----------------------------
def to_camel_case(s: str) -> str:
    s = str(s)
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", " ", s)
    parts = [p for p in s.strip().split() if p]
    if not parts:
        return ""
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def normalize_key(s: str) -> str:
    """
    Normaliza forte pra comparar:
    - remove acentos
    - lowercase
    - remove extensão
    - remove tudo que não for a-z0-9
    """
    s = str(s).strip()
    s = re.sub(r"\.(jpg|jpeg|png|webp)$", "", s, flags=re.IGNORECASE)
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "", s)
    return s


# -----------------------------
# Preço: converter para CENTAVOS
# -----------------------------
def parse_price_to_cents(v) -> int:
    """
    Aceita:
      324
      324.5
      "324,50"
      "R$ 324,50"
      "1.234,56"
      "1,234.56" (caso venha em padrão US)
    Retorna:
      int em centavos -> 32400, 32450, 123456 etc.
    """
    if v is None:
        return 0

    s = str(v).strip()
    if not s or s.lower() == "nan":
        return 0

    s = s.replace("R$", "").replace(" ", "")

    # Detecta padrão:
    # - Se tiver ',' e '.' juntos, decide pelo último separador como decimal
    #   Ex.: "1.234,56" -> decimal é ',' (padrão BR)
    #        "1,234.56" -> decimal é '.' (padrão US)
    if "," in s and "." in s:
        last_comma = s.rfind(",")
        last_dot = s.rfind(".")
        if last_comma > last_dot:
            # BR: '.' milhar, ',' decimal
            s = s.replace(".", "")
            s = s.replace(",", ".")
        else:
            # US: ',' milhar, '.' decimal
            s = s.replace(",", "")
    elif "," in s:
        # BR simples: "," decimal
        s = s.replace(".", "")      # se vier "1.234" como milhar
        s = s.replace(",", ".")
    # else: só '.' ou só número -> ok

    try:
        value = float(s)
    except Exception:
        return 0

    return int(round(value * 100))


# -----------------------------
# DB / Excel helpers
# -----------------------------
def ensure_image_column(con: sqlite3.Connection) -> bool:
    cur = con.cursor()
    cur.execute("PRAGMA table_info(gifts);")
    cols = [r[1] for r in cur.fetchall()]
    if "image" in cols:
        return False
    cur.execute("ALTER TABLE gifts ADD COLUMN image TEXT;")
    con.commit()
    return True


def pick_col(df, contains_any):
    for c in df.columns:
        if any(x.lower() in str(c).lower() for x in contains_any):
            return c
    raise SystemExit(
        f"Não encontrei coluna {contains_any} no Excel. Colunas: {list(df.columns)}"
    )


# -----------------------------
# Imagens: índice e resolução
# -----------------------------
def load_images_index(images_list_path: Path) -> tuple[dict[str, str], list[str]]:
    """
    Retorna:
      - dict normalizado -> filename original (com .jpg)
      - lista de chaves normalizadas (pra fuzzy match)
    """
    text = images_list_path.read_text(encoding="utf-8", errors="ignore")
    files = [ln.strip() for ln in text.splitlines() if ln.strip()]

    idx: dict[str, str] = {}
    collisions = []
    for fn in files:
        k = normalize_key(fn)
        if not k:
            continue
        if k in idx and idx[k] != fn:
            collisions.append((k, idx[k], fn))
            continue
        idx[k] = fn

    if collisions:
        print("AVISO: colisões de normalização (mantive o primeiro):")
        for k, a, b in collisions[:10]:
            print(f"  chave={k} -> {a} | {b}")
        if len(collisions) > 10:
            print(f"  ... e mais {len(collisions)-10}")

    return idx, list(idx.keys())


def resolve_image(name: str, images_idx: dict[str, str], images_keys: list[str]) -> tuple[str, str]:
    """
    Retorna (image_filename, status)
    status:
      - "exact": bateu direto na lista
      - "fuzzy": bateu por aproximação
      - "fallback": não achou; gera camelCase.jpg
    """
    camel = to_camel_case(name)

    k1 = normalize_key(camel)
    if k1 in images_idx:
        return images_idx[k1], "exact"

    k2 = normalize_key(name)
    if k2 in images_idx:
        return images_idx[k2], "exact"

    # Fuzzy bem conservador (ajuda com diferenças pequenas de espaços/palavras)
    candidates = difflib.get_close_matches(k2, images_keys, n=1, cutoff=0.92)
    if candidates:
        return images_idx[candidates[0]], "fuzzy"

    return f"{camel}.jpg", "fallback"


# -----------------------------
# Main
# -----------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", required=True, help="Caminho do arquivo .sqlite")
    ap.add_argument("--xlsx", required=True, help="Caminho do arquivo .xlsx")
    ap.add_argument("--images-list", required=True, help="TXT com nomes das imagens (1 por linha)")
    ap.add_argument("--truncate", action="store_true", help="Apaga todos os registros de gifts antes de inserir")
    ap.add_argument("--no-alter", action="store_true", help="Não tentar adicionar coluna image (falha se não existir)")
    args = ap.parse_args()

    db_path = Path(args.db).expanduser().resolve()
    xlsx_path = Path(args.xlsx).expanduser().resolve()
    images_path = Path(args.images_list).expanduser().resolve()

    if not db_path.exists():
        raise SystemExit(f"DB não encontrado: {db_path}")
    if not xlsx_path.exists():
        raise SystemExit(f"XLSX não encontrado: {xlsx_path}")
    if not images_path.exists():
        raise SystemExit(f"Lista de imagens não encontrada: {images_path}")

    df = pd.read_excel(xlsx_path)

    name_col = pick_col(df, ["nome do produto", "nome"])
    price_col = pick_col(df, ["preço", "preco", "valor"])
    link_col = pick_col(df, ["link", "url"])

    images_idx, images_keys = load_images_index(images_path)

    con = sqlite3.connect(str(db_path))
    try:
        if not args.no_alter:
            ensure_image_column(con)

        cur = con.cursor()

        if args.truncate:
            cur.execute("DELETE FROM gifts;")

        rows = []
        stats_img = {"exact": 0, "fuzzy": 0, "fallback": 0}
        stats_price = {"ok": 0, "zero": 0}

        for _, r in df.iterrows():
            name = str(r[name_col]).strip()
            if not name or name.lower() == "nan":
                continue

            price_cents = parse_price_to_cents(r[price_col])
            if price_cents <= 0:
                stats_price["zero"] += 1
            else:
                stats_price["ok"] += 1

            link = str(r[link_col]).strip()
            image, st = resolve_image(name, images_idx, images_keys)
            stats_img[st] += 1

            rows.append((str(uuid.uuid4()), name, price_cents, link, image))

        cur.executemany(
            "INSERT INTO gifts (id, name, price, link, image) VALUES (?,?,?,?,?)",
            rows,
        )
        con.commit()

        print(f"OK: inseridos {len(rows)} itens em gifts.")
        print(f"Imagens: exact={stats_img['exact']} | fuzzy={stats_img['fuzzy']} | fallback={stats_img['fallback']}")
        print(f"Preços: ok={stats_price['ok']} | zerados={stats_price['zero']}")
        if rows:
            print("Exemplo:")
            print("  Nome:", rows[0][1])
            print("  Price (centavos):", rows[0][2])
            print("  Price (reais):", f"{rows[0][2] / 100:.2f}")
            print("  Imagem:", rows[0][4])

    finally:
        con.close()


if __name__ == "__main__":
    main()

