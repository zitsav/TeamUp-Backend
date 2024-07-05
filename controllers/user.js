const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, UnauthenticatedError } = require('../errors')

const updateUser = async (req, res) => {
  const {userId} = req.user
  const id = parseInt(req.params.id)
  const {name, profile} = req.body

  try{
    const user = await prisma.user.findUnique({
      where: {
        id: id
      }
    })

    if (!user){
      throw new BadRequestError("User not found")
    }

    if (user.id !== userId) {
      throw new UnauthenticatedError("Not authorized to update this user")
    }

    if (!name && !profile){
      throw new BadRequestError("Missing paramters")
    }

    await prisma.user.update({
      where: {
        id: id
      },
      data: {
        name,
        profile,
      }
    })

    res.status(StatusCodes.OK).json({message: "SUCCESS"})
  }
  catch (error){
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: "Internal server error"})
  }
}

const searchUsers = async (req, res) => {
  const {query} = req.body

  if (!query){
    throw new BadRequestError("Search query is required")
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        profile: true,
      },
    })
    res.status(StatusCodes.OK).json({users})
  }
  catch (error){
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error"})
  }
}

module.exports = {
  updateUser,
  searchUsers
}