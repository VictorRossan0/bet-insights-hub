#!/usr/bin/env node
/**
 * setup:env — copia .env.example para .env.local e pede valores no terminal.
 * Não sobrescreve .env.local sem confirmação.
 */
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const EXAMPLE = resolve(ROOT, '.env.example');
const TARGET = resolve(ROOT, '.env.local');

const REQUIRED = [
  {
    key: 'VITE_SUPABASE_URL',
    hint: 'URL do projeto (ex.: https://xxxxx.supabase.co)',
  },
  {
    key: 'VITE_SUPABASE_PUBLISHABLE_KEY',
    hint: 'Chave publishable/anon do Supabase',
  },
  {
    key: 'VITE_SUPABASE_PROJECT_ID',
    hint: 'ID do projeto (ex.: pvreimxxppnyaykveiib)',
  },
];

async function main() {
  if (!existsSync(EXAMPLE)) {
    console.error('❌ .env.example não encontrado na raiz do projeto.');
    process.exit(1);
  }

  const rl = createInterface({ input, output });

  if (existsSync(TARGET)) {
    const ans = (await rl.question('⚠️  .env.local já existe. Sobrescrever? (s/N) ')).trim().toLowerCase();
    if (ans !== 's' && ans !== 'sim' && ans !== 'y' && ans !== 'yes') {
      console.log('Cancelado. Nenhum arquivo foi alterado.');
      rl.close();
      return;
    }
  }

  copyFileSync(EXAMPLE, TARGET);
  let content = readFileSync(TARGET, 'utf8');

  console.log('\n📝 Informe os valores (deixe vazio para pular):\n');
  for (const { key, hint } of REQUIRED) {
    const value = (await rl.question(`${key}\n  ${hint}\n  > `)).trim();
    if (value) {
      const re = new RegExp(`^${key}=.*$`, 'm');
      content = re.test(content)
        ? content.replace(re, `${key}=${value}`)
        : `${content}\n${key}=${value}`;
    }
  }

  writeFileSync(TARGET, content, 'utf8');
  rl.close();

  console.log(`\n✅ ${TARGET} criado com sucesso.`);
  console.log('   Esse arquivo está no .gitignore e NÃO será enviado ao GitHub.');
  console.log('\n👉 Próximo passo: npm install && npm run dev\n');
}

main().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
