let Json = require('./Json');

class Pixi extends Json {

    constructor() {
        super();
    }

    run(data, options) {
        return super.run(data, options);
    }

    static get type() {
        return "Pixi";
    }

    static get description() {
        return "pixi.js format";
    }

    static get fileExt() {
        return "json";
    }
}

module.exports = Pixi;