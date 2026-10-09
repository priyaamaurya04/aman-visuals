/**
 * Copies every Google Drive video referenced in the portfolio database into
 * public/videos/<driveFileId>.mp4 so the site streams them from its own hosting
 * instead of Google Drive (which rate-limits streaming with "Quota exceeded").
 *
 * Also writes src/generated/videoManifest.json ({ driveFileId: "/videos/<id>.mp4" }),
 * which parseVideoUrl() uses to swap Drive links for the local copy automatically.
 *
 * Usage:  npm run sync-videos        (also runs automatically before every build)
 *         npm run sync-videos:watch  (keeps retrying blocked videos until every one is stored)
 * Never fails the build: videos that can't be downloaded keep playing via the Drive proxy.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RTDB_URL = 'https://aman-portfolio-f7222-default-rtdb.firebaseio.com';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VIDEO_DIR = path.join(ROOT, 'public', 'videos');
const MANIFEST_PATH = path.join(ROOT, 'src', 'generated', 'videoManifest.json');
const DRIVE_ID_RE = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^&"]+&)*id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]{10,})/g;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const UNTIL_DONE = process.argv.includes('--until-done');
const RETRY_MINUTES = 10;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchDriveIds() {
  const res = await fetch(`${RTDB_URL}/portfolio.json`);
  if (!res.ok) throw new Error(`Database read failed: HTTP ${res.status}`);
  const text = await res.text();
  return [...new Set([...text.matchAll(DRIVE_ID_RE)].map((m) => m[1]))];
}

// Drive rejects larger ranges with "Quota exceeded" when a file is throttled; 64 KB still passes.
// Fast parallel fetching trips the block for every file, so chunks go one at a time with a pause.
const CHUNK = 64 * 1024;
const CHUNK_PAUSE_MS = 150;

// Fetch one byte range; Drive answers "Quota exceeded" with an HTML page, so treat that as a failure.
async function fetchRange(fileId, from, to) {
  const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Range: `bytes=${from}-${to}` }, redirect: 'follow' });
      const type = res.headers.get('content-type') || '';
      if (res.status === 206 && !type.includes('text/html')) {
        return { buf: Buffer.from(await res.arrayBuffer()), range: res.headers.get('content-range') || '' };
      }
      await res.body?.cancel();
    } catch {
      // network hiccup — retry
    }
    await sleep(1500 * attempt);
  }
  return null;
}

// Downloads in small sequential range requests and resumes from <id>.mp4.part, so a Drive
// block mid-file keeps the progress made so far and the next run continues where it stopped.
async function download(fileId) {
  const target = path.join(VIDEO_DIR, `${fileId}.mp4`);
  const tmp = `${target}.part`;
  let done = fs.existsSync(tmp) ? fs.statSync(tmp).size : 0;
  let total = 0;

  const out = fs.openSync(tmp, 'a');
  try {
    while (!total || done < total) {
      const part = await fetchRange(fileId, done, done + CHUNK - 1);
      if (!part) return false;
      total = Number(part.range.split('/')[1]);
      if (!total) return false;
      fs.writeSync(out, part.buf);
      done += part.buf.length;
      process.stdout.write(`
[sync-videos] downloading ${fileId} ... ${Math.round((done / total) * 100)}%`);
      await sleep(CHUNK_PAUSE_MS);
    }
  } finally {
    fs.closeSync(out);
  }
  fs.renameSync(tmp, target);
  return true;
}

function writeManifest() {
  const manifest = {};
  for (const file of fs.readdirSync(VIDEO_DIR)) {
    const m = file.match(/^([a-zA-Z0-9_-]{10,})\.mp4$/);
    if (m) manifest[m[1]] = `/videos/${file}`;
  }
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  return Object.keys(manifest).length;
}

// Drive file name (e.g. "smita.mp4") from the public view page — not affected by download quota.
async function fetchDriveFileName(fileId) {
  try {
    const res = await fetch(`https://drive.google.com/file/d/${fileId}/view`, { headers: { 'User-Agent': UA } });
    const m = (await res.text()).match(/<title>([^<]+?) - Google Drive<\/title>/);
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}

async function main() {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  let ids = [];
  try {
    ids = await fetchDriveIds();
  } catch (e) {
    console.warn(`[sync-videos] ${e.message} — keeping existing local videos.`);
  }

  const localPath = (id) => path.join(VIDEO_DIR, `${id}.mp4`);
  let missing = ids.filter((id) => !fs.existsSync(localPath(id)));

  // 1) Adopt videos you downloaded from Drive yourself and dropped into public/videos
  //    under their original name: rename them to <driveId>.mp4.
  const idFile = /^[a-zA-Z0-9_-]{25,}\.mp4$/;
  const looseFiles = fs.readdirSync(VIDEO_DIR).filter((f) => /\.(mp4|mov|webm)$/i.test(f) && !idFile.test(f));
  if (looseFiles.length && missing.length) {
    for (const id of missing) {
      const name = await fetchDriveFileName(id);
      const base = (f) => f.toLowerCase().replace(/\.(mp4|mov|webm)$/i, '').trim();
      const match = name && looseFiles.find((f) => base(f) === base(name));
      if (match) {
        fs.renameSync(path.join(VIDEO_DIR, match), localPath(id));
        console.log(`[sync-videos] matched "${match}" -> ${id}.mp4`);
      }
    }
    missing = ids.filter((id) => !fs.existsSync(localPath(id)));
  }

  console.log(`[sync-videos] ${ids.length} Drive video(s) in database, ${missing.length} to download.`);

  // 2) Download the rest. Drive's "Quota exceeded" block lifts after a while, so with
  //    --until-done blocked videos are retried every RETRY_MINUTES until all are stored.
  let failed = missing;
  for (let round = 1; ; round++) {
    const pending = failed;
    failed = [];
    for (const id of pending) {
      process.stdout.write(`[sync-videos] downloading ${id} ... `);
      if (await download(id)) {
        const mb = (fs.statSync(localPath(id)).size / 1048576).toFixed(1);
        console.log(` done (${mb} MB)`);
        writeManifest();
      } else {
        console.log(' blocked by Google Drive (Quota exceeded), will retry later');
        failed.push(id);
      }
    }
    if (!failed.length || !UNTIL_DONE) break;
    console.log(`[sync-videos] ${failed.length} video(s) blocked, retrying in ${RETRY_MINUTES} min (round ${round + 1}).`);
    await sleep(RETRY_MINUTES * 60_000);
  }

  const count = writeManifest();
  console.log(`[sync-videos] ${count} video(s) served locally from /videos.`);
  if (failed.length) {
    console.log(`[sync-videos] ${failed.length} video(s) still stream from Drive; run "npm run sync-videos:watch" to keep retrying.`);
  }
}

main().catch((e) => {
  console.warn('[sync-videos] skipped:', e.message);
  try { writeManifest(); } catch { /* keep build going */ }
});
