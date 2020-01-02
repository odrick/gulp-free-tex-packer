let through = require("through2");
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
    return new PluginError("gulp-free-tex-packer", txt)
}

const SUPPORTED_EXT = ["png", "jpg", "jpeg"];

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

        if (SUPPORTED_EXT.indexOf(getExtFromPath(file.relative)) < 0) {
            cb();
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

        if (!options) options = {};
        options.appInfo = appInfo;

        texturePacker(files, options, (files, error) => {
            if (error) {
                cb(getError(error.description || "Unknown error"));
                return;
            }
            for (let item of files) {
                let file = firstFile.clone({ contents: false });
                file.path = path.join(firstFile.base, item.name);
                file.contents = item.buffer;
                this.push(file);
            }
            cb();
        });
    }

    return through.obj(bufferContents, endStream);
};
