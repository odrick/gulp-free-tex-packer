const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const Vinyl = require("vinyl");

// ---- tiny PNG encoder (no dependencies) -------------------------------------------------------

const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		table[n] = c >>> 0;
	}
	return table;
})();

function crc32(buf) {
	let c = 0xffffffff;
	for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
	const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
	const out = Buffer.alloc(body.length + 8);
	out.writeUInt32BE(data.length, 0);
	body.copy(out, 4);
	out.writeUInt32BE(crc32(body), body.length + 4);
	return out;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** RGBA PNG; pixel(x, y) returns [r, g, b, a]. */
function makePng(width, height, pixel) {
	const raw = Buffer.alloc((width * 4 + 1) * height);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const [r, g, b, a] = pixel(x, y);
			raw.set([r, g, b, a], y * (width * 4 + 1) + 1 + x * 4);
		}
	}
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8; // bit depth
	ihdr[9] = 6; // RGBA
	return Buffer.concat([
		PNG_SIGNATURE,
		chunk("IHDR", ihdr),
		chunk("IDAT", zlib.deflateSync(raw)),
		chunk("IEND", Buffer.alloc(0)),
	]);
}

/** A solid sprite surrounded by a transparent margin, so that trimming has something to do. */
function sprite(width, height, margin, color) {
	return makePng(width, height, (x, y) =>
		x >= margin && y >= margin && x < width - margin && y < height - margin ? [...color, 255] : [0, 0, 0, 0]
	);
}

const IMAGES = {
	"red.png": sprite(24, 16, 2, [230, 40, 40]),
	"green.png": sprite(12, 30, 3, [40, 200, 60]),
	"blue.png": sprite(20, 20, 0, [40, 60, 230]),
};

/** A PNG with a correct signature whose data is cut off: it looks like an image but cannot be decoded. */
const TRUNCATED_PNG = Buffer.concat([PNG_SIGNATURE, Buffer.from("this is not a real png body")]);

// ---- streams ----------------------------------------------------------------------------------------

const BASE = path.join(os.tmpdir(), "gulp-ftp-test-base");

function vinylFile(name, contents) {
	return new Vinyl({ cwd: BASE, base: BASE, path: path.join(BASE, name), contents });
}

/**
 * Writes the files into the stream and resolves with what came out and with the error (if any).
 * Rejects when the stream neither ends nor fails in time, i.e. when the task would hang in gulp.
 */
function collect(stream, files, timeoutMs = 8000) {
	return new Promise((resolve, reject) => {
		const out = [];
		let settled = false;
		const settle = (error) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolve({ files: out, error: error || null, names: out.map((f) => f.relative.split("\\").join("/")).sort() });
		};
		const timer = setTimeout(() => {
			if (settled) return;
			settled = true;
			reject(new Error("the stream neither ended nor failed within " + timeoutMs + " ms (the gulp task would hang)"));
		}, timeoutMs);
		stream.on("data", (f) => out.push(f));
		stream.on("error", settle);
		stream.on("end", () => settle(null));
		for (const f of files) stream.write(f);
		stream.end();
	});
}

function tempDir() {
	return fs.mkdtempSync(path.join(os.tmpdir(), "gulp-ftp-test-"));
}

module.exports = { makePng, sprite, IMAGES, TRUNCATED_PNG, PNG_SIGNATURE, vinylFile, collect, tempDir, BASE };
