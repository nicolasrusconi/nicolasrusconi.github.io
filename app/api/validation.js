var schemas = require("../model/schemas");

var accessDenied = function(res) {
    res.status(401).send("You have no access to perform the operation");
};

module.exports = {
    authenticateAdmin: function(req, res, next) {
        if (!req.user || !req.user.admin) {
            accessDenied(res);
        } else {
            schemas.Player.findOne({_id: req.user.id}, function(err, user) {
                if (!err & user.admin) {
                    next();
                } else {
                    accessDenied(res);
                }
            })
        }
    },
    authenticateUser: function(req, res, next) {
        if (!req.user) {
            accessDenied(res);
        } else {
            schemas.Player.findOne({_id: req.user.id}, function(err, user) {
                if (!err && user) {
                    next();
                } else {
                    accessDenied(res);
                }
            })
        }
        
    }
};