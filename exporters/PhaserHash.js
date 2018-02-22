let Json = require('./Json');

class PhaserHash extends Json {

    constructor() {
        super();
    }

    run(data, options) {
        return super.run(data, options, {addPivot: true});
    }

    static get type() {
        return "PhaserHash";
    }

    static get description() {
        return "Phaser (json hash)";
    }

    static get fileExt() {
        return "json";
    }
}

module.exports = PhaserHash;