const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../errors');

const updateBoard = async (req, res) => {
  const {id} = parseInt(req.params)
  const {userId} = req.user
  const {title} = req.body

  try{
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      }
    })

    if (!user){
      throw new BadRequestError("User not found, try logging in again")
    }

    const board = await prisma.board.findUnique({
      where: {
        id: parseInt(id)
      },
      include: {
        Workspace: {
          include: {
            members: true,
          }
        }
      }
    })

    if (!board){
      throw new BadRequestError("Board not found")
    }

    await prisma.board.update({
      where: {
        id: id,
      },
      data: {
        title
      },
    })

    res.status(StatusCodes.OK).json({message: "SUCCESS"})
  }
  catch (error){
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: "Internal server error"})
  }
};

module.exports = {
  updateBoard
}