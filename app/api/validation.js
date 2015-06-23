module.exports = {
    authenticateUser: function(req, res, next) {
        if (!req.user || !req.user.admin) {
            res.status(401).send("You have no access to perform the operation");
        } else {
            next();
        }
    }
};