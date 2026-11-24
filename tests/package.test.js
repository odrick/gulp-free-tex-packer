const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const pkg = require("../package.json");

/** Lowest version mentioned in a node range such as ">=20.9.0", "^18.20.0||>=22" or ">= 14.0". */
function lowestNode(range) {
	const versions = [...String(range).matchAll(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/g)].map((m) => [
		Number(m[1]),
		Number(m[2] || 0),
		Number(m[3] || 0),
	]);
	assert.ok(versions.length, `cannot read a version from engines range "${range}"`);
	return versions.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])[0];
}

const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

describe("package.json", () => {
	it("depends on free-tex-packer-core 0.4 or newer", () => {
		// ^0.3.x does not accept 0.4.0 (caret ranges of 0.x versions stop at the next minor)
		assert.match(pkg.dependencies["free-tex-packer-core"], /^\^0\.(?:[4-9]|\d{2,})\./);
	});

	it("declares a Node.js version that every dependency supports", () => {
		assert.ok(pkg.engines && pkg.engines.node, 'missing "engines.node"');
		const own = lowestNode(pkg.engines.node);
		for (const name of Object.keys(pkg.dependencies)) {
			const dep = JSON.parse(fs.readFileSync(path.join(root, "node_modules", name, "package.json"), "utf8"));
			if (!dep.engines || !dep.engines.node) continue;
			assert.ok(
				compare(own, lowestNode(dep.engines.node)) >= 0,
				`engines.node (${pkg.engines.node}) allows Node older than ${name}@${dep.version} requires (${dep.engines.node})`
			);
		}
	});

	it("links to the right GitHub repository", () => {
		const expected = "https://github.com/odrick/gulp-free-tex-packer";
		assert.equal(pkg.url, expected, '"url" is written into the exported files, keep it https');
		assert.equal(pkg.homepage, expected + "#readme");
		assert.equal(pkg.bugs && pkg.bugs.url, expected + "/issues");
		assert.match(pkg.repository.url, /github\.com\/odrick\/gulp-free-tex-packer/);
	});

	it("publishes the plugin and nothing unneeded", () => {
		assert.ok(fs.existsSync(path.join(root, pkg.main)), `main file ${pkg.main} does not exist`);
		assert.ok(Array.isArray(pkg.files), 'missing "files" list');
		assert.ok(pkg.files.includes(pkg.main), `"files" must include ${pkg.main}`);
		assert.ok(!pkg.files.some((f) => /test/i.test(f)), "tests must not be published");
	});
});

describe("README", () => {
	const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

	it("tells gulp 5 users to read images as binary", () => {
		assert.match(readme, /encoding: false/);
	});

	it("does not use gulp.src for images without the binary option", () => {
		// every gulp.src(...) call in the examples must pass { encoding: false }
		const calls = readme.match(/gulp\.src\([^)]*\)/g) || [];
		assert.ok(calls.length > 0, "no gulp.src examples found");
		for (const call of calls) assert.match(call, /encoding: false/, `example without the binary option: ${call}`);
	});

	it("does not mention the removed website", () => {
		assert.doesNotMatch(readme, /free-tex-packer\.com/);
	});
});
