#!/usr/bin/env ts-node
/**
 * ConcertIndustry.com — Document Ingestion Script
 *
 * Usage:
 *   npx ts-node scripts/ingest-docs.ts [path-to-docs-folder]
 *
 * Or using npm script:
 *   npm run ingest
 *
 * This script:
 *   1. Reads all .txt, .md, and .pdf files from the specified folder
 *   2. Sends each to the /api/admin/ingest endpoint
 *   3. The endpoint chunks the text, generates embeddings, and stores in Supabase
 *
 * Requirements:
 *   - .env.local must be configured
 *   - NEXT_PUBLIC_APP_URL must point to a running Next.js instance
 *   - SUPABASE_SERVICE_ROLE_KEY must be set
 */

import * as fs from 'fs';
import * as path from 'path';

// Load env from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

// Map file names or paths to doc types
function inferDocType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes('account') || lower.includes('settlement') || lower.includes('budget')) return 'accounting';
  if (lower.includes('product')) return 'production';
  if (lower.includes('audio') || lower.includes('sound') || lower.includes('engineer')) return 'audio_engineering';
  if (lower.includes('international') || lower.includes('japan') || lower.includes('europe') || lower.includes('uk')) return 'international';
  if (lower.includes('health') || lower.includes('mental') || lower.includes('wellness')) return 'health';
  if (lower.includes('festival')) return 'festival';
  if (lower.includes('stage')) return 'stage_management';
  if (lower.includes('backline')) return 'backline';
  if (lower.includes('promot')) return 'promotion';
  if (lower.includes('tour') && lower.includes('manag')) return 'tour_management';
  if (lower.includes('rider')) return 'tour_management';
  if (lower.includes('arena')) return 'production';
  if (lower.includes('lighting')) return 'production';
  if (lower.includes('merchandis')) return 'promotion';
  if (lower.includes('logistics')) return 'tour_management';
  if (lower.includes('travel')) return 'general';
  return 'general';
}

async function extractPdfText(filePath: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfParse = require('pdf-parse');
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

async function ingestFile(filePath: string, fileName: string): Promise<void> {
  console.log(`\n📄 Ingesting: ${fileName}`);

  const ext = path.extname(fileName).toLowerCase();
  let rawText: string;

  if (ext === '.pdf') {
    try {
      rawText = await extractPdfText(filePath);
      console.log(`  📋 PDF extracted: ${rawText.length} characters`);
    } catch (err) {
      console.error(`  ❌ PDF extraction failed: ${String(err)}`);
      return;
    }
  } else {
    rawText = fs.readFileSync(filePath, 'utf-8');
  }

  if (rawText.trim().length < 100) {
    console.log(`  ⏭  Skipping (too short): ${fileName}`);
    return;
  }

  const docType = inferDocType(fileName);
  console.log(`  Doc type: ${docType}`);
  console.log(`  Characters: ${rawText.length}`);

  try {
    const response = await fetch(`${APP_URL}/api/admin/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        file_name: fileName,
        doc_type: docType,
        raw_text: rawText,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`  ❌ Failed: ${result.error}`);
    } else {
      console.log(`  ✅ Success: ${result.chunks_created}/${result.total_chunks} chunks created`);
      console.log(`  Doc ID: ${result.doc_id}`);
    }
  } catch (err) {
    console.error(`  ❌ Error: ${String(err)}`);
  }

  // Delay between files to avoid OpenAI rate limits
  await new Promise((r) => setTimeout(r, 1500));
}

async function main() {
  const docsFolder = process.argv[2] || path.join(__dirname, '..', 'docs');

  console.log('===========================================');
  console.log('ConcertIndustry — Document Ingestion Script');
  console.log('===========================================');
  console.log(`App URL: ${APP_URL}`);
  console.log(`Docs folder: ${docsFolder}`);

  if (!fs.existsSync(docsFolder)) {
    console.error(`ERROR: Docs folder not found: ${docsFolder}`);
    console.log('\nUsage: npm run ingest [path-to-docs-folder]');
    process.exit(1);
  }

  const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.pdf'];
  const files = fs.readdirSync(docsFolder)
    .filter((f) => SUPPORTED_EXTENSIONS.some((ext) => f.toLowerCase().endsWith(ext)))
    .sort();

  if (files.length === 0) {
    console.log('\nNo .txt, .md, or .pdf files found in docs folder.');
    process.exit(0);
  }

  console.log(`\nFound ${files.length} files to ingest:`);
  files.forEach((f) => console.log(`  - ${f}`));

  for (const file of files) {
    const filePath = path.join(docsFolder, file);
    await ingestFile(filePath, file);
  }

  console.log('\n===========================================');
  console.log('Ingestion complete!');
  console.log('===========================================');
  console.log('\nNext steps:');
  console.log('1. Check Supabase dashboard → Table Editor → doc_chunks');
  console.log('2. Verify embeddings are stored (embedding column should be non-null)');
  console.log('3. Test a knowledge search in the app');
  console.log('\nOptional: Create the vector index for better performance:');
  console.log('  CREATE INDEX ON doc_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
