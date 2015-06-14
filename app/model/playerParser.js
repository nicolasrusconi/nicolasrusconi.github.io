var schemas = require("../model/schemas");
/*
 { kind: 'plus#person',
 etag: '"xxxxxxxxxxxxx"',
 gender: 'male',
 emails: [ { value: 'ebergamaschi@medallia.com', type: 'account' } ],
 objectType: 'person',
 id: 'xxxxxxxxxxxx',
 displayName: 'Ezequiel Bergamaschi',
 name: { familyName: 'Bergamaschi', givenName: 'Ezequiel' },
 url: 'https://plus.google.com/110890234919138773163',
 image:
 { url: 'https://lh3.googleusercontent.com/-iSWoErT7a24/AAAAAAAAAAI/AAAAAAAAACA/qgBbFeWXFv4/photo.jpg?sz=50',
 isDefault: false },
 isPlusUser: true,
 circledByCount: 1,
 verified: false,
 domain: 'medallia.com' }
 */

function parse(jsonPlayer) {
    console.log(jsonPlayer);
    var player = new schemas.Player();
    var medalliaDomain = "medallia.com";
    var firstEmail = jsonPlayer.emails[0].value;
    var domain = jsonPlayer.domain || firstEmail.split("@")[1];
    if (domain != medalliaDomain) {
        console.error("invalid domain: " + domain);
        return;
    }
    player.firstName = jsonPlayer.name.givenName;
    player.lastName = jsonPlayer.name.familyName;
    player.username = firstEmail.replace("@" + medalliaDomain, "");
    player.email = firstEmail;
    player.image = jsonPlayer.image.url;
    return player;
}

module.exports = {
    parse: parse
};