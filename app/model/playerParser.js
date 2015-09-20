/*
 { provider: 'google',
 id: '110890234919138773163',
 displayName: 'Ezequiel Bergamaschi',
 name: { familyName: 'Bergamaschi', givenName: 'Ezequiel' },
 isPerson: true,
 isPlusUser: true,
 language: 'en',
 emails: [ { value: 'ebergamaschi@medallia.com', type: 'account' } ],
 email: 'ebergamaschi@medallia.com',
 gender: 'male',
 photos: [ { value: 'https://lh3.googleusercontent.com/-iSWoErT7a24/AAAAAAAAAAI/AAAAAAAAACA/qgBbFeWXFv4/photo.jpg?sz=50' } ]
 }
 */

function parse(jsonPlayer) {
    //console.log(jsonPlayer);
    var player = {};
    var medalliaDomain = "medallia.com";
    var email = jsonPlayer.email;
    var domain = jsonPlayer.domain || email.split("@")[1];
    if (domain != medalliaDomain) {
        console.error("invalid domain: " + domain);
        return;
    }
    player.firstName = jsonPlayer.name.givenName;
    player.lastName = jsonPlayer.name.familyName;
    player.username = email.replace("@" + medalliaDomain, "");
    player.email = jsonPlayer.email;
    player.alias = player.username;
    player.image = jsonPlayer.photos[0].value;
    player.googleId = jsonPlayer.id;
    return player;
}

module.exports = {
    parse: parse
};