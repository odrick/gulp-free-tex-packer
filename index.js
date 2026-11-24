let { Transform } = require("stream");
let path = require("path");
let PluginError = require("plugin-error");
let texturePacker = require("free-tex-packer-core");
let appInfo = require("./package.json");

function fixPath(path) {
    return path.split("\\").join("/");
}

function getExtFromPath(path) {
    return path.split(".").pop().toLowerCase();
}

function getError(txt) {
    return new PluginError(appInfo.name, txt)
}

const SUPPORTED_EXT = ["png", "jpg", "jpeg", "webp"];

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** True when the content starts like a file of the given type (png, jpg, jpeg, webp). */
function hasImageSignature(ext, contents) {
    if (ext === "png") {
        return contents.length >= PNG_SIGNATURE.length && contents.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
    }

    if (ext === "webp") {
        // RIFF <size> WEBP
        return contents.length >= 12 && contents.toString("latin1", 0, 4) === "RIFF" && contents.toString("latin1", 8, 12) === "WEBP";
    }

    return contents.length >= 3 && contents[0] === 0xff && contents[1] === 0xd8 && contents[2] === 0xff;
}

// free-tex-packer-core skips images it cannot decode and only reports that with console.error
// ("free-tex-packer-core: Error reading <path>"). When no image can be decoded it never calls back at all.
// So the plugin listens to these reports while it packs. Several streams can pack at the same time,
// therefore console.error is patched once and shared, and every stream only takes its own file names.
const READ_ERROR = /^free-tex-packer-core: Error reading (.+)$/;
const readErrorListeners = new Set();
let originalConsoleError = null;

function listenToReadErrors(listener) {
    if (!readErrorListeners.size) {
        originalConsoleError = console.error;
        console.error = function (...args) {
            let match = READ_ERROR.exec(args.join(" "));
            if (match) {
                let consumed = false;
                for (let item of Array.from(readErrorListeners)) {
                    if (item(match[1])) consumed = true;
                }
                if (consumed) return;
            }
            originalConsoleError.apply(console, args);
        };
    }

    readErrorListeners.add(listener);

    return () => {
        readErrorListeners.delete(listener);
        if (!readErrorListeners.size && originalConsoleError) {
            console.error = originalConsoleError;
            originalConsoleError = null;
        }
    };
}

module.exports = function (options) {
    let files = [];
    let firstFile = null;

    function bufferContents(file, enc, cb) {
        if (file.isNull()) {
            cb();
            return;
        }

        if (file.isStream()) {
            cb(getError("Streaming not supported"));
            return;
        }

        if (!firstFile) firstFile = file;

        let ext = getExtFromPath(file.relative);

        if (SUPPORTED_EXT.indexOf(ext) < 0) {
            cb();
            return;
        }

        if (!hasImageSignature(ext, file.contents)) {
            cb(getError(file.relative + " is not a valid " + ext.toUpperCase() + " image. " +
                "If it is a binary file read as text, note that gulp 5 needs gulp.src(..., { encoding: false }) for images."));
            return;
        }

        files.push({ path: fixPath(file.relative), contents: file.contents });

        cb();
    }

    function endStream(cb) {
        if (!files.length) {
            cb();
            return;
        }

        // Do not change the object of the caller
        let packOptions = Object.assign({}, options, { appInfo: appInfo });

        let names = new Set(files.map(item => item.path));
        let unreadable = [];
        let finished = false;
        let stopListening = null;

        let finish = (error) => {
            if (finished) return;
            finished = true;
            stopListening();
            cb(error);
        };

        let unreadableError = () => getError("Cannot pack, " + unreadable.length +
            (unreadable.length === 1 ? " image cannot" : " images cannot") + " be decoded: " + unreadable.join(", "));

        stopListening = listenToReadErrors((name) => {
            if (finished || !names.has(name)) return false;

            unreadable.push(name);

            // nothing can be packed, the packer would not call back
            if (unreadable.length === files.length) finish(unreadableError());

            return true;
        });

        try {
            texturePacker(files, packOptions, (result, error) => {
                if (finished) return;

                if (error) {
                    finish(getError(error.message || error.description || "Unknown error"));
                    return;
                }

                if (unreadable.length) {
                    finish(unreadableError());
                    return;
                }

                for (let item of result) {
                    let file = firstFile.clone({ contents: false });
                    file.path = path.join(firstFile.base, item.name);
                    file.contents = item.buffer;
                    this.push(file);
                }

                finish();
            });
        }
        catch (error) {
            // e.g. an unknown packer is thrown synchronously
            finish(getError(error.message || error.description || "Unknown error"));
        }
    }

    return new Transform({
        objectMode: true,
        transform(file, enc, cb) {
            bufferContents(file, enc, cb);
        },
        flush(cb) {
            endStream.call(this, cb);
        }
    });
};
