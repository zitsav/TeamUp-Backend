const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, UnauthenticatedError } = require('../errors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient()

const createJWT = (userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
    return token
}

const register = async (req, res) => {
    const { name, email, profile, password, fcmToken } = req.body

    try {
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email,
            }
        })

        if (existingUser) {
            throw new BadRequestError("User already exists")
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
                profile,
                fcmToken
            },
        })

        const token = createJWT(newUser.id)

        res.status(StatusCodes.CREATED).json({
            name: newUser.name,
            profile: newUser.profile,
            id: newUser.id,
            email: newUser.email,
            fcmToken: newUser.fcmToken,
            token
        })
    }
    catch (error){
        console.error(error)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error"})
    }
}

const login = async (req, res) => {
    const { email, password, fcmToken } = req.body

    if (!email || !password) {
        throw new BadRequestError("Please provide email and password")
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } })

        if (!user) {
            throw new UnauthenticatedError("Invalid email")
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash)

        if (!isPasswordCorrect) {
            throw new UnauthenticatedError("Invalid password")
        }

        const token = createJWT(user.id)

        if (fcmToken) {
            await prisma.user.update({
                where: { id: user.id },
                data: { fcmToken },
            })
        }

        res.status(StatusCodes.OK).json({
            name: user.name,
            profile: user.profile,
            id: user.id,
            email: user.email,
            fcmToken: user.fcmToken,
            token
        })
    }
    catch (error){
        console.error(error)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: "Internal server error"})
    }
}

module.exports = {
    register,
    login,
}