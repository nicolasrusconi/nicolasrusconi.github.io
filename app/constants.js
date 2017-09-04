function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

define("HOME", "home");
define("AWAY", "away");
define("PLAYER", "player");
define("PARTNER", "partner");