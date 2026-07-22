import sqlite3
import json

conn = sqlite3.connect('nivaran.db')
cursor = conn.cursor()

tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").fetchall()
table_names = [t[0] for t in tables]

print(f"Total tables: {len(table_names)}")
print("Table list:", table_names)

row_counts = {}
for name in table_names:
    count = cursor.execute(f'SELECT COUNT(*) FROM "{name}"').fetchone()[0]
    row_counts[name] = count

print("\nRow counts per table:")
print(json.dumps(row_counts, indent=2))
conn.close()
