let Json = require('./Json');

class JsonHash extends Json {

    constructor() {
        super();
    }

    run(data, options) {
        return super.run(data, options, {addPivot: true});
    }

    static get type() {
        return "JsonHash";
    }

    static get description() {
        return "Json hash";
    }

    static get fileExt() {
        return "json";
    }
}

module.exports = JsonHash;