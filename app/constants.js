function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}
// MONGO
define("MONGO_ID", "_id");
// Team type
define("HOME", "home");
define("AWAY", "away");

// Player type
define("PLAYER", "player");
define("PARTNER", "partner");

// data
define("GOALS", "goals");