const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("node:stream/promises");

const gulp = require("gulp");
const PluginError = require("plugin-error");
const texturePacker = require("..");
const pkg = require("../package.json");
const exporterList = require("free-tex-packer-core/exporters/list.json");
const { IMAGES, TRUNCATED_PNG, vinylFile, collect, tempDir } = require("./helpers");

const imageFiles = () => Object.entries(IMAGES).map(([name, data]) => vinylFile(name, data));

function readJson(file) {
	return JSON.parse(file.contents.toString("utf8"));
}

describe("packing", () => {
	it("packs the images into a texture and a data file", async () => {
		const { files, error, names } = await collect(texturePacker(), imageFiles());
		assert.equal(error, null);
		assert.deepEqual(names, ["pack-result.json", "pack-result.png"]);

		const data = readJson(files.find((f) => f.extname === ".json"));
		assert.deepEqual(Object.keys(data.frames).sort(), ["blue.png", "green.png", "red.png"]);
		assert.equal(files.find((f) => f.extname === ".png").contents.subarray(1, 4).toString(), "PNG");
	});

	it("puts the result next to the first file and keeps its base and cwd", async () => {
		const { files } = await collect(texturePacker({ textureName: "sheet" }), imageFiles());
		for (const file of files) {
			assert.equal(file.base, imageFiles()[0].base);
			assert.equal(file.dirname, imageFiles()[0].base);
		}
		assert.deepEqual(files.map((f) => f.basename).sort(), ["sheet.json", "sheet.png"]);
	});

	it("passes the options to the packer", async () => {
		const { files } = await collect(
			texturePacker({ textureName: "x", exporter: "Pixi", textureFormat: "jpg", removeFileExtension: true }),
			imageFiles()
		);
		assert.deepEqual(files.map((f) => f.basename).sort(), ["x.jpg", "x.json"]);
		assert.deepEqual(Object.keys(readJson(files.find((f) => f.extname === ".json")).frames).sort(), ["blue", "green", "red"]);
	});

	it("uses the paths relative to the base for the sprite names", async () => {
		const files = [vinylFile("ui/button.png", IMAGES["red.png"]), vinylFile("hero\\idle.png", IMAGES["blue.png"])];
		const result = await collect(texturePacker(), files);
		const frames = Object.keys(readJson(result.files.find((f) => f.extname === ".json")).frames).sort();
		assert.deepEqual(frames, ["hero/idle.png", "ui/button.png"]);
	});

	it("does not modify the options object of the caller", async () => {
		const options = { textureName: "keep", padding: 1 };
		const before = JSON.stringify(options);
		await collect(texturePacker(options), imageFiles());
		assert.equal(JSON.stringify(options), before);
	});

	it("can be created once and used for several runs with the same options", async () => {
		const options = { textureName: "again" };
		const first = await collect(texturePacker(options), imageFiles());
		const second = await collect(texturePacker(options), imageFiles());
		assert.deepEqual(first.names, ["again.json", "again.png"]);
		assert.deepEqual(second.names, first.names);
	});

	for (const exporter of exporterList) {
		it(`exporter ${exporter.type} -> .${exporter.fileExt}`, async () => {
			const { names, error } = await collect(texturePacker({ exporter: exporter.type, textureName: "t" }), imageFiles());
			assert.equal(error, null);
			assert.deepEqual(names, ["t." + exporter.fileExt, "t.png"].sort());
		});
	}
});

describe("input that is not packed", () => {
	it("ignores files that are not images", async () => {
		const files = [...imageFiles(), vinylFile("readme.txt", Buffer.from("hello")), vinylFile("data.json", Buffer.from("{}"))];
		const { names, error } = await collect(texturePacker(), files);
		assert.equal(error, null);
		assert.deepEqual(names, ["pack-result.json", "pack-result.png"]);
	});

	it("emits nothing when there are no images", async () => {
		const { names, error } = await collect(texturePacker(), [vinylFile("readme.txt", Buffer.from("hello"))]);
		assert.equal(error, null);
		assert.deepEqual(names, []);
	});

	it("emits nothing for an empty stream", async () => {
		const { names, error } = await collect(texturePacker(), []);
		assert.equal(error, null);
		assert.deepEqual(names, []);
	});

	it("skips empty (null) files such as directories", async () => {
		const dir = vinylFile("folder", null);
		dir.isDirectory = () => true;
		const { names, error } = await collect(texturePacker(), [dir, ...imageFiles()]);
		assert.equal(error, null);
		assert.deepEqual(names, ["pack-result.json", "pack-result.png"]);
	});
});

describe("errors", () => {
	function assertPluginError(error, pattern) {
		assert.ok(error, "expected an error");
		assert.ok(error instanceof PluginError, "expected a PluginError, got " + error);
		assert.equal(error.plugin, pkg.name);
		assert.match(error.message, pattern);
	}

	it("rejects streamed (not buffered) files", async () => {
		const streamed = vinylFile("red.png", require("stream").Readable.from([IMAGES["red.png"]]));
		const { error, names } = await collect(texturePacker(), [streamed]);
		assertPluginError(error, /Streaming not supported/);
		assert.deepEqual(names, []);
	});

	it("rejects an image whose content is not an image, and says how to read binary files in gulp 5", async () => {
		const { error, names } = await collect(texturePacker(), [...imageFiles(), vinylFile("broken.png", Buffer.from("not a png"))]);
		assertPluginError(error, /broken\.png/);
		assert.match(error.message, /encoding: false/);
		assert.deepEqual(names, []);
	});

	it("rejects a png that was decoded as text (gulp 5 default) instead of hanging", async () => {
		const asText = Buffer.from(IMAGES["red.png"].toString("utf8"), "utf8");
		const { error } = await collect(texturePacker(), [vinylFile("red.png", asText)]);
		assertPluginError(error, /red\.png/);
		assert.match(error.message, /encoding: false/);
	});

	it("fails instead of hanging when no image can be decoded", async () => {
		const { error, names } = await collect(texturePacker(), [vinylFile("cut.png", TRUNCATED_PNG)]);
		assertPluginError(error, /cut\.png/);
		assert.deepEqual(names, []);
	});

	it("fails instead of writing an atlas without the images that cannot be decoded", async () => {
		const { error, names } = await collect(texturePacker(), [...imageFiles(), vinylFile("cut.png", TRUNCATED_PNG)]);
		assertPluginError(error, /cut\.png/);
		assert.deepEqual(names, []);
	});

	it("reports an unknown packer as a plugin error, not as a crash", async () => {
		const { error } = await collect(texturePacker({ packer: "NoSuchPacker" }), imageFiles());
		assertPluginError(error, /Unknown packer/);
	});

	it("reports an unknown exporter as a plugin error, not as a crash", async () => {
		const { error } = await collect(texturePacker({ exporter: "NoSuchExporter" }), imageFiles());
		assert.ok(error instanceof PluginError, "expected a PluginError, got " + error);
	});
});

describe("console.error", () => {
	it("is left alone while packing, also after a failure", async () => {
		const original = console.error;
		const seen = [];
		console.error = (...args) => seen.push(args.join(" "));
		try {
			const replaced = console.error;
			const pending = collect(texturePacker(), imageFiles());
			assert.equal(console.error, replaced);
			console.error("something else");
			await pending;
			await collect(texturePacker(), [vinylFile("cut.png", TRUNCATED_PNG)]);
			assert.equal(console.error, replaced);
		} finally {
			console.error = original;
		}
		assert.deepEqual(seen, ["something else"]);
	});
});

describe("streams that pack at the same time", () => {
	it("do not affect each other", async () => {
		const [good, bad, alsoGood] = await Promise.all([
			collect(texturePacker({ textureName: "good" }), imageFiles()),
			collect(texturePacker({ textureName: "bad" }), [vinylFile("cut.png", TRUNCATED_PNG)]),
			collect(texturePacker({ textureName: "also-good" }), imageFiles()),
		]);
		assert.equal(good.error, null);
		assert.deepEqual(good.names, ["good.json", "good.png"]);
		assert.equal(alsoGood.error, null);
		assert.deepEqual(alsoGood.names, ["also-good.json", "also-good.png"]);
		assert.match(bad.error.message, /cut.png/);
	});
});

describe("with gulp 5", () => {
	function writeFixtures() {
		const dir = tempDir();
		const src = path.join(dir, "src");
		fs.mkdirSync(path.join(src, "sub"), { recursive: true });
		fs.writeFileSync(path.join(src, "red.png"), IMAGES["red.png"]);
		fs.writeFileSync(path.join(src, "sub", "green.png"), IMAGES["green.png"]);
		fs.writeFileSync(path.join(src, "notes.txt"), "not an image");
		return { dir, src, dest: path.join(dir, "dest") };
	}

	it("packs gulp.src(..., { encoding: false }) into gulp.dest", async () => {
		const { dir, src, dest } = writeFixtures();
		await pipeline(
			gulp.src("**/*", { cwd: src, encoding: false, nodir: true }),
			texturePacker({ textureName: "atlas" }),
			gulp.dest(dest)
		);
		assert.deepEqual(fs.readdirSync(dest).sort(), ["atlas.json", "atlas.png"]);
		const frames = Object.keys(JSON.parse(fs.readFileSync(path.join(dest, "atlas.json"), "utf8")).frames).sort();
		assert.deepEqual(frames, ["red.png", "sub/green.png"]);
		fs.rmSync(dir, { recursive: true, force: true });
	});

	it("explains what is wrong with the default gulp.src (images read as text)", async () => {
		const { dir, src, dest } = writeFixtures();
		await assert.rejects(
			pipeline(gulp.src("**/*.png", { cwd: src }), texturePacker(), gulp.dest(dest)),
			(error) => error instanceof PluginError && /encoding: false/.test(error.message)
		);
		assert.equal(fs.existsSync(dest), false);
		fs.rmSync(dir, { recursive: true, force: true });
	});
});
