/**
 * Genera src/db/schema.generated.ts a partir de src/db/schema.sql.
 *
 * Por que existe: Metro no sabe importar archivos .sql, asi que el SQL tiene que
 * llegar al bundle como TypeScript. Mantener dos copias a mano se desincroniza;
 * esta es una sola fuente de verdad (el .sql) con una copia derivada.
 *
 *   node scripts/generar-schema.mjs            escribe el .ts
 *   node scripts/generar-schema.mjs --check    falla si el .ts quedo viejo
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const origen = join(raiz, 'src/db/schema.sql');
const destino = join(raiz, 'src/db/schema.generated.ts');

const sql = readFileSync(origen, 'utf8');
// El SQL entra en un template literal: hay que neutralizar backtick y ${
const escapado = sql.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

const salida = `/**
 * GENERADO POR scripts/generar-schema.mjs — NO EDITAR A MANO.
 * La fuente de verdad es src/db/schema.sql. Si cambiaste el esquema,
 * edita el .sql y corre: npm run db:schema
 */

export const SCHEMA_SQL = \`${escapado}\`;
`;

if (process.argv.includes('--check')) {
  const actual = readFileSync(destino, 'utf8');
  if (actual !== salida) {
    console.error('schema.generated.ts esta desactualizado. Corre: npm run db:schema');
    process.exit(1);
  }
  console.log('schema.generated.ts esta al dia');
} else {
  writeFileSync(destino, salida);
  console.log(`schema.generated.ts escrito (${sql.length} caracteres de SQL)`);
}
