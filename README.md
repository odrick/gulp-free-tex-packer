# gulp-free-tex-packer

[![Stats](https://nodei.co/npm/gulp-free-tex-packer.png?downloads=true&stars=true)](https://www.npmjs.com/package/gulp-free-tex-packer) \
Free texture packer module for gulp \
Based on https://github.com/odrick/free-tex-packer

Web version of the app: https://odrick.github.io/free-tex-packer/

# Requirements

Node.js 20.9 or newer. Works with gulp 4 and gulp 5.

# Install

```
$ npm install gulp-free-tex-packer
```

# Basic usage

```js
let texturePacker = require('gulp-free-tex-packer');

gulp.task('pack', function() {
    return gulp.src('src/**/*.*', { encoding: false })
        .pipe(texturePacker())
        .pipe(gulp.dest('dest/'));
});
```

**Gulp 5:** it reads files as text by default, which breaks images. Always pass `{ encoding: false }` to `gulp.src`
when it feeds this plugin (gulp 4 ignores this option, so the example works with both versions).

# Advanced usage

Use packer options object

```js
let texturePacker = require('gulp-free-tex-packer');

gulp.task('pack', function() {
    return gulp.src('src/**/*.*', { encoding: false })
        .pipe(texturePacker({
            textureName: "my-texture",
            width: 1024,
            height: 1024,
            fixedSize: false,
            padding: 2,
            allowRotation: true,
            detectIdentical: true,
            allowTrim: true,
            exporter: "Pixi",
            removeFileExtension: true,
            prependFolderName: true
        }))
        .pipe(gulp.dest('dest/'));
});
```

The plugin packs `.png`, `.jpg` and `.jpeg` files and ignores all other files of the stream. The result files are
written next to the first image of the stream.

**Pack options description**: https://github.com/odrick/free-tex-packer-core#available-options

**Custom exporters description**: https://github.com/odrick/free-tex-packer-core#custom-exporter

# Errors

The stream fails with a plugin error (instead of hanging or writing an incomplete atlas) when:

* an image file does not contain a valid PNG/JPEG (for example, gulp 5 read it as text)
* an image cannot be decoded; the error lists the files
* the packer options are invalid, for example an unknown `packer`
* the stream contains a streamed (not buffered) file

# Used libs

* **Free texture packer core** - https://github.com/odrick/free-tex-packer-core

---
License: MIT
