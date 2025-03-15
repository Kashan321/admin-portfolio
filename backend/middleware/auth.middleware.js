import jwt from 'jsonwebtoken'

export const ensureAuthenticated = (req, res, next) => {
    const auth = req.headers['authorization']
    if (!auth) {
        res.status(403)
            .json({
                success: false,
                message: "JWT token is require"
            })
    }
    try {
        const verify = jwt.decode(auth, process.env.JWT_SECRET)
        req.user = verify
        next()
    } catch (error) {
        return res.status(401)
            .json({ message: 'Unauthorized, JWT token wrong or expired' });
    }
}