import userModel from "../modals/user.modal.js";
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
dotenv.config()
const secret = process.env.JWT_SECRET

export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const user = await userModel.findOne({ email })
        if (user) {
            return res.status(400)
                .json({
                    success: false,
                    message: "user already exists"
                })
        }
        const newUser = new userModel({ name, email, password });
        newUser.password = await bcrypt.hash(password, 10)
        await newUser.save()
        res.status(200)
            .json({
                success: true,
                messgae: "new user created successfully"
            })
    } catch (error) {
        console.log("ERROR IN SIGN UP", error)
        res.status(500)
            .json({
                success: false,
                message: "Internal server error"
            })
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "user could not found"
            });
        }
        const comparePass = await bcrypt.compare(password, user.password);
        if (!comparePass) {
            return res.status(403).json({
                success: false,
                message: "one or more details are invalid"
            });
        }
        const jwt_token = jwt.sign(
            {
                email: user.email,
                _id: user._id,
            },
            process.env.JWT_SECRET,
            {expiresIn: '24h'}
        );
        return res.status(200).json({
            success: true,
            message: "user logged in successfully",
            accessToken: jwt_token
        });
    } catch (error) {
        console.log("ERROR IN LOGIN", error);
        return res.status(500).json({
            success: false,
            message: "INTERNAL SERVER ERROR"
        });
    }
};