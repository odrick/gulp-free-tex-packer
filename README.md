# gulp-free-tex-packer

> [![Stats](https://nodei.co/npm/gulp-free-tex-packer.svg?downloads=true&stars=true)](https://www.npmjs.com/package/gulp-free-tex-packer) \
> Free texture packer module for gulp \
> Based on https://github.com/odrick/free-tex-packer

# Install
   
$ npm install gulp-free-tex-packer
   
# Basic usage
```js
let texturePacker = require('gulp-free-tex-packer');

gulp.task('pack', function() {
    return gulp.src('src/**/*.*')
        .pipe(texturePacker())
        .pipe(gulp.dest('dest/'));
});
```

# Advanced usage

Use packer options object

```js
let texturePacker = require('gulp-free-tex-packer');

gulp.task('pack', function() {
    return gulp.src('src/**/*.*')
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


**Pack options description**: https://github.com/odrick/free-tex-packer-core#available-options

**Custom exporters description**: https://github.com/odrick/free-tex-packer-core#custom-exporter

# Used libs

* **Free texture packer core** - https://github.com/odrick/free-tex-packer-core

---
License: MIT
