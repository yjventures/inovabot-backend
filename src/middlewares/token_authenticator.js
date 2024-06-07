const jwt = require('jsonwebtoken');

// * Middleware to authenticate JWT access token
const authenticateToken = (req, res, next) => {
    const authHeader = req?.headers?.authorization;
    const [type, token] = authHeader?authHeader.split(' '): [];
    if (!token) {
        res.status(401).json({ message: 'Unauthorized token' });
        return;
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            res.status(401).json({ message: `Unauthorized token for type ${type}` });
            return;
        }
        req.user = user;
        next();
    });
};

module.exports = {
    authenticateToken,
};