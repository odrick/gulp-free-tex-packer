let Json = require('./Json');

class PhaserArray extends Json {

    constructor() {
        super();
    }

    run(data, options) {
        return super.run(data, options, {addPivot: true, isArray: true});
    }

    static get type() {
        return "PhaserArray";
    }

    static get description() {
        return "Phaser (json array)";
    }

    static get fileExt() {
        return "json";
    }
}

module.exports = PhaserArray;