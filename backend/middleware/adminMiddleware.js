import jwt from 'jsonwebtoken';

export const verifyAdmin = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vizhabook_secret_key');
            
            if (!decoded || decoded.role !== 'SUPER_ADMIN') {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied. Super Admin privileges required.'
                });
            }
            
            req.user = decoded;
            return next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized, token failed'
            });
        }
    }

    return res.status(401).json({
        success: false,
        error: 'Not authorized, no token provided'
    });
};
