var _ = require("underscore");

module.exports = function(app) {
    app.post('/api/random/group', function(req, res) {
        var groups = [];
        _.each(req.body.groups, function(group, groupIdx) {
            if (!_.isArray(group)) {
                res.send("invalid");
            } else {
                _.each(_.shuffle(group), function(item, i) {
                    if (!groups[i]) {
                        groups[i] = {}
                    }
                    groups[i]['key' + groupIdx] = item;
                });
            }
        });
        res.json(groups);
    });
    app.post("/api/random/value", function(req, res) {
        res.send(_.sample(req.body.data));
    })
};