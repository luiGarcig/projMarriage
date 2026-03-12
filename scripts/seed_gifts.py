#!/usr/bin/env python3
import argparse
import sqlite3
import psycopg2
from psycopg2.extras import execute_values


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sqlite", required=True, help="Caminho do database.sqlite")
    ap.add_argument("--db-url", required=True, help="DATABASE_URL do Postgres de produção")
    ap.add_argument("--truncate", action="store_true", help="Limpa gifts antes de inserir")
    args = ap.parse_args()

    # Lê do SQLite
    sconn = sqlite3.connect(args.sqlite)
    sconn.row_factory = sqlite3.Row
    scur = sconn.cursor()

    rows = scur.execute("""
        SELECT id, name, price, image
        FROM gifts
        ORDER BY name
    """).fetchall()

    payload = [(r["id"], r["name"], r["price"], r["image"]) for r in rows]
    sconn.close()

    if not payload:
        print("Nenhum registro encontrado em gifts no SQLite.")
        return

    # Escreve no Postgres
    pconn = psycopg2.connect(args.db_url)
    try:
        pconn.autocommit = False
        pcur = pconn.cursor()

        if args.truncate:
            pcur.execute("TRUNCATE TABLE payments CASCADE;")
            pcur.execute("TRUNCATE TABLE gifts CASCADE;")

        execute_values(
            pcur,
            """
            INSERT INTO gifts (id, name, price, image)
            VALUES %s
            """,
            payload
        )

        pconn.commit()
        print(f"OK: {len(payload)} gifts copiados do SQLite para produção.")
        print("Exemplo:")
        print("  id   =", payload[0][0])
        print("  name =", payload[0][1])
        print("  price=", payload[0][2])
        print("  image=", payload[0][3])

    except Exception:
        pconn.rollback()
        raise
    finally:
        pconn.close()


if __name__ == "__main__":
    main()
