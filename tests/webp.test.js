const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const PluginError = require("plugin-error");
const texturePacker = require("..");
const { IMAGES, WEBP, TRUNCATED_WEBP, vinylFile, collect } = require("./helpers");

const webpFiles = () => Object.entries(WEBP).map(([name, data]) => vinylFile(name, data));
const frames = (result) =>
	Object.keys(JSON.parse(result.files.find((f) => f.extname === ".json").contents.toString("utf8")).frames).sort();

describe("webp images", () => {
	it("packs .webp images", async () => {
		const result = await collect(texturePacker(), webpFiles());
		assert.equal(result.error, null);
		assert.deepEqual(result.names, ["pack-result.json", "pack-result.png"]);
		assert.deepEqual(frames(result), ["blue.webp", "orange.webp"]);
	});

	it("packs .webp together with .png images", async () => {
		const files = [...webpFiles(), vinylFile("red.png", IMAGES["red.png"])];
		const result = await collect(texturePacker(), files);
		assert.equal(result.error, null);
		assert.deepEqual(frames(result), ["blue.webp", "orange.webp", "red.png"]);
	});

	it("recognizes the extension in any letter case", async () => {
		const result = await collect(texturePacker(), [vinylFile("SHOUT.WEBP", WEBP["orange.webp"])]);
		assert.equal(result.error, null);
		assert.deepEqual(frames(result), ["SHOUT.WEBP"]);
	});

	it("writes a .webp texture when textureFormat is webp", async () => {
		const result = await collect(texturePacker({ textureName: "w", textureFormat: "webp" }), webpFiles());
		assert.equal(result.error, null);
		assert.deepEqual(result.names, ["w.json", "w.webp"]);
		const head = result.files.find((f) => f.extname === ".webp").contents;
		assert.equal(head.subarray(0, 4).toString(), "RIFF");
		assert.equal(head.subarray(8, 12).toString(), "WEBP");
	});

	it("rejects a .webp file whose content is not WebP", async () => {
		const result = await collect(texturePacker(), [...webpFiles(), vinylFile("fake.webp", Buffer.from("not a webp"))]);
		assert.ok(result.error instanceof PluginError);
		assert.match(result.error.message, /fake\.webp is not a valid WEBP image/);
		assert.deepEqual(result.names, []);
	});

	it("fails instead of hanging when a .webp cannot be decoded", async () => {
		const result = await collect(texturePacker(), [vinylFile("cut.webp", TRUNCATED_WEBP)]);
		assert.ok(result.error instanceof PluginError);
		assert.match(result.error.message, /cut\.webp/);
		assert.deepEqual(result.names, []);
	});
});
