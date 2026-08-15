#!/usr/bin/env node
// "Dependabot for the templates" — checks the PyPI dependency versions
// create-packkit-py WRITES into generated projects against the latest on PyPI.
// Dependabot/Renovate can't see these (they're strings the generator emits), so
// this is our freshness net. Flags any dependency whose floor major is behind the
// latest published major. Exits 1 if anything is stale (0 otherwise).
//
// Deps are read back out of freshly-generated pyproject.toml files (not hard-coded
// here) so this can never drift from what the generator actually emits.
import { generate } from '../dist/index.js';
import { parse as parseToml } from 'smol-toml';

// Deliberately held below latest (name -> reason). Kept here so the reason travels
// with the report; empty for now.
const HELD = {};

const floorMajor = (spec) => {
	const m = String(spec).match(/(\d+)/);
	return m ? parseInt(m[1], 10) : NaN;
};

// name + version spec out of a PEP 508 requirement string, e.g. "pytest>=8".
function splitReq(req) {
	const m = String(req).match(/^\s*([A-Za-z0-9._-]+)\s*(.*)$/);
	if (!m) return null;
	return { name: m[1], spec: m[2].trim() };
}

// Every dependency spec (with a floor) the generator emits, across both presets
// (py-cli pulls in the CLI extras; typecheck on → mypy). Deduped by name.
function collectDeps() {
	const specs = new Map(); // name -> spec (first seen)
	for (const preset of ['py-lib', 'py-cli']) {
		const target = preset === 'py-cli' ? 'cli' : 'library';
		const { files } = generate({ name: 'x', target }, { preset });
		const toml = parseToml(files['pyproject.toml']);
		const dev = toml?.project?.['optional-dependencies']?.dev ?? [];
		for (const req of dev) {
			const parsed = splitReq(req);
			// Only floors (>=) carry a meaningful "majors behind"; skip bare/pinned/other.
			if (!parsed || !/^>=?\s*\d/.test(parsed.spec)) continue;
			if (!specs.has(parsed.name)) specs.set(parsed.name, parsed.spec);
		}
	}
	return specs;
}

async function latest(name) {
	try {
		const res = await fetch(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`);
		if (!res.ok) return null;
		return (await res.json()).info?.version ?? null;
	} catch {
		return null;
	}
}

const specs = collectDeps();
const stale = [];
const held = [];
const errors = [];

await Promise.all(
	[...specs].map(async ([name, spec]) => {
		const v = await latest(name);
		if (!v) return void errors.push(name);
		const ours = floorMajor(spec);
		const theirs = floorMajor(v);
		if (Number.isFinite(ours) && Number.isFinite(theirs) && theirs > ours) {
			(HELD[name] ? held : stale).push({ name, spec, latest: v, behind: theirs - ours });
		}
	}),
);

stale.sort((a, b) => b.behind - a.behind || a.name.localeCompare(b.name));

console.log(`Checked ${specs.size} template dependencies against PyPI.`);
if (errors.length) console.log(`Could not resolve: ${errors.join(', ')}`);

if (held.length) {
	console.log(`\nℹ️  Held back on purpose (${held.length}):`);
	for (const h of held)
		console.log(`  - \`${h.name}\` @ \`${h.spec}\` (latest \`${h.latest}\`) — ${HELD[h.name]}`);
}

if (stale.length === 0) {
	console.log('\n✅ All template dependencies are within one major of the latest on PyPI.');
	process.exit(0);
}

console.log(
	`\n⚠️  ${stale.length} template dependenc${stale.length === 1 ? 'y is' : 'ies are'} a major behind:\n`,
);
console.log('| dependency | template | latest | majors behind |');
console.log('|---|---|---|---|');
for (const s of stale)
	console.log(`| \`${s.name}\` | \`${s.spec}\` | \`${s.latest}\` | ${s.behind} |`);
console.log(
	'\nUpdate the emitted floors in `src/generate.ts` (`pyprojectToml`), then re-run integration.',
);
process.exit(1);
