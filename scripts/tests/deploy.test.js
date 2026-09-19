import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, access, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import ghpages from 'gh-pages';
import { createPublishOptions, retainAssets, RETENTION_MS } from '../deploy.js';

const exists = (file) => access(file).then(() => true, () => false);
const git = (cwd, ...args) => execFileSync('git', args, { cwd, stdio: 'pipe' });

test('保留現用與近期舊資源，到期才清除；首次發布有寬限期', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'anxi-retention-'));
  try {
    await mkdir(path.join(dir, 'assets'));
    for (const name of ['current.js', 'recent.js', 'expired.js', 'legacy.js']) {
      await writeFile(path.join(dir, 'assets', name), name);
    }
    const now = Date.now();
    await writeFile(path.join(dir, 'asset-retention.json'), JSON.stringify({
      'current.js': now - 2 * RETENTION_MS,
      'recent.js': now - 1000,
      'expired.js': now - RETENTION_MS,
    }));
    await retainAssets(dir, new Set(['current.js']), now);
    for (const name of ['current.js', 'recent.js', 'legacy.js']) assert.equal(await exists(path.join(dir, 'assets', name)), true);
    assert.equal(await exists(path.join(dir, 'assets/expired.js')), false);
    await retainAssets(dir, new Set(['current.js']), now + RETENTION_MS);
    assert.equal(await exists(path.join(dir, 'assets/legacy.js')), false);
    assert.equal(await exists(path.join(dir, 'assets/current.js')), true);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('實際發布兩版至本機 Git：舊 chunk 可用、HTML 更新、已刪公開頁移除', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'anxi-publish-'));
  const remote = path.join(dir, 'remote.git');
  const build = path.join(dir, 'build');
  try {
    git(dir, 'init', '--bare', remote);
    await mkdir(path.join(build, 'assets'), { recursive: true });
    await writeFile(path.join(build, 'index.html'), 'version-one');
    await writeFile(path.join(build, 'removed-page.html'), 'old public page');
    await writeFile(path.join(build, 'assets/old.js'), 'old chunk');
    await writeFile(path.join(build, 'stats.html'), 'private build analysis');
    const publish = async () => {
      const options = await createPublishOptions(build);
      await new Promise((resolve, reject) => ghpages.publish(build, {
        ...options, repo: remote, user: { name: 'Deploy test', email: 'test@example.invalid' },
      }, (error) => error ? reject(error) : resolve()));
    };
    await publish();
    await rm(path.join(build, 'removed-page.html'));
    await rm(path.join(build, 'assets/old.js'));
    await writeFile(path.join(build, 'index.html'), 'version-two');
    await writeFile(path.join(build, 'assets/new.js'), 'new chunk');
    await publish();
    assert.equal(git(dir, '--git-dir', remote, 'show', 'gh-pages:index.html').toString(), 'version-two');
    assert.equal(git(dir, '--git-dir', remote, 'show', 'gh-pages:assets/old.js').toString(), 'old chunk');
    assert.equal(git(dir, '--git-dir', remote, 'show', 'gh-pages:assets/new.js').toString(), 'new chunk');
    const files = git(dir, '--git-dir', remote, 'ls-tree', '-r', '--name-only', 'gh-pages').toString().split('\n');
    assert(!files.includes('removed-page.html'));
    assert(!files.includes('stats.html'));
    assert(files.includes('.nojekyll'));
    const manifest = JSON.parse(git(dir, '--git-dir', remote, 'show', 'gh-pages:asset-retention.json').toString());
    assert(manifest['old.js'] && manifest['new.js']);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
