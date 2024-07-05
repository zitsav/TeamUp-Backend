const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../errors');

const createCard = async (req, res) => {
  const { userId } = req.user
  const { title, board_id, deadline, description, color, image } = req.body

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new BadRequestError("User not found, try logging in again")
    }

    if (!board_id) {
      throw new BadRequestError("Board id is required")
    }

    const board = await prisma.board.findUnique({
      where: { id: board_id },
    })

    if (!board) {
      throw new BadRequestError("Board not found")
    }

    const isMember = await prisma.workspace.findFirst({
      where: {
        id: board.workspaceId,
        members: {
          some: {
            userId: userId,
          },
        },
      },
    })

    if (!isMember) {
      throw new BadRequestError("User not permitted to create a card in this workspace")
    }

    const lastPosition = board.lastPosition

    await prisma.card.create({
      data: {
        title,
        description,
        color,
        image,
        deadline,
        position: lastPosition + 1,
        boardId: board_id,
        assignedUsers: {
          create: [
            {
              user: {
                connect: { id: userId },
              },
            },
          ],
        },
      },
    })

    await prisma.board.update({
      where: { id: board_id },
      data: { lastPosition: lastPosition + 1 },
    })

    res.status(StatusCodes.CREATED).json({ message: "SUCCESS" })
  }
  catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" })
  }
};

// const updateCard = async (req, res) => {
//   const { id } = req.params;
//   const { userId } = req.user;
//   const { title, description } = req.body;

//   try {
//     const card = await prisma.card.findUnique({
//       where: { id: parseInt(id) },
//       include: {
//         Board: {
//           include: { Workspace: true },
//         },
//       },
//     });

//     if (!card) {
//       throw new BadRequestError('Card not found');
//     }

//     const isMember = card.assignedUsers.some(assignedUsers => assignedUsers.userId === userId);
    
//     if (!isMember){
//       throw new BadRequestError("User not permitted to edit this card")
//     }

//     const updatedCard = await prisma.card.update({
//       where: { id: parseInt(id) },
//       data: {
//         title,
//         description
//       },
//     });

//     res.status(StatusCodes.OK).json({ card: updatedCard });
//   } catch (error) {
//     console.error('Error updating card:', error);
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
//   }
// };

const deleteCard = async (req, res) => {
  const id = parseInt(req.params.id)
  const {userId} = req.user

  try {
    const card = await prisma.card.findUnique({
      where: {id: id}
    })

    if (!card){
      throw new BadRequestError("Card not found")
    }

    const isMember = card.assignedUsers.some(assignedUsers => assignedUsers.userId === userId);
        
    if (!isMember){
      throw new BadRequestError("User not permitted to edit this card")
    }

    const deletedCard = await prisma.card.delete({
      where: { id: id},
    })

    res.status(StatusCodes.OK).json({message: "SUCCESS"})
  }
  catch (error){
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: "Internal server error"})
  }
}

const changeCardPosition = async (req, res) => {
  const id = parseInt(req.params.id);
  const { userId } = req.user;
  const { newPosition } = req.body;

  try {
    const card = await prisma.card.findUnique({
      where: { id: id },
      include: {
        assignedUsers: true,
      },
    })

    if (!card) {
      throw new BadRequestError("Card not found");
    }

    const isMember = card.assignedUsers.some((assignedUser) => assignedUser.userId === userId);

    if (!isMember) {
      throw new BadRequestError("User not permitted to edit this card");
    }

    const board = await prisma.board.findUnique({
      where: {id: card.boardId}
    })

    if (newPosition > board.lastPosition || newPosition < 1) {
      throw new BadRequestError("Invalid position");
    }

    const boardCards = await prisma.card.findMany({
      where: { boardId: card.boardId },
      orderBy: { position: 'asc' },
    });

    let updatedCards = [];
    if (newPosition < card.position) {
      updatedCards = boardCards.filter((c) => c.position >= newPosition && c.position < card.position);
      updatedCards.forEach((c) => c.position++);
    } else if (newPosition > card.position) {
      updatedCards = boardCards.filter((c) => c.position > card.position && c.position <= newPosition);
      updatedCards.forEach((c) => c.position--);
    }

    await prisma.$transaction(
      updatedCards.map((c) =>
        prisma.card.update({
          where: { id: c.id },
          data: { position: c.position },
        })
      )
    );

    await prisma.card.update({
      where: { id: id },
      data: { position: newPosition },
    });

    res.status(StatusCodes.OK).json({ message: "SUCCESS" });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
}

const moveCardToDifferentBoard = async (req, res) => {
  const id = parseInt(req.params.id);
  const { userId } = req.user;
  const { newBoardId, newPosition } = req.body;

  try {
    const card = await prisma.card.findUnique({
      where: { id: id },
      include: {
        assignedUsers: true,
      },
    })

    if (!card) {
      throw new BadRequestError('Card not found')
    }

    const isMember = card.assignedUsers.some((assignedUser) => assignedUser.userId === userId);

    if (!isMember) {
      throw new BadRequestError("User not permitted to move this card");
    }

    const currentBoard = await prisma.board.findUnique({
      where: {id: card.boardId},
      include: { cards: { orderBy: { position: 'asc' } } },
    })

    const targetBoard = await prisma.board.findUnique({
      where: { id: newBoardId },
      include: { cards: { orderBy: { position: 'asc' } } },
    })

    if (!targetBoard) {
      throw new BadRequestError('Target board not found')
    }

    if (targetBoard.workspaceId !== currentBoard.workspaceId) {
      throw new BadRequestError("Boards belong to a different workspace")
    }

    if (newPosition > targetBoard.lastPosition + 1 || newPosition < 1) {
      throw new BadRequestError('Invalid position for target board')
    }

    const originalBoardCards = currentBoard.cards

    const targetBoardCards = targetBoard.cards

    const updatedOriginalBoardCards = originalBoardCards.filter((c) => c.position > card.position)
    updatedOriginalBoardCards.forEach((c) => c.position--)

    const updatedTargetBoardCards = targetBoardCards.filter((c) => c.position >= newPosition)
    updatedTargetBoardCards.forEach((c) => c.position++)

    await prisma.$transaction([
      ...updatedOriginalBoardCards.map((c) =>
        prisma.card.update({
          where: { id: c.id },
          data: { position: c.position },
        })
      ),
      ...updatedTargetBoardCards.map((c) =>
        prisma.card.update({
          where: { id: c.id },
          data: { position: c.position },
        })
      ),
      prisma.card.update({
        where: { id: id },
        data: {
          boardId: newBoardId,
          position: newPosition,
        },
      }),
    ])

    res.status(StatusCodes.OK).json({ message: "SUCCESS" });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
};

const addCardMember = async (req, res) => {
  const { userId } = req.user
  const { cardId, email } = req.body

  try {
    const card = await prisma.card.findUnique({
      where: {
        id: cardId,
      },
      include: { assignedUsers: true },
    })

    if (!card) {
      throw new BadRequestError("Card not found")
    }

    const isMember = card.assignedUsers.some((assignedUser) => assignedUser.userId === userId)

    if (!isMember) {
      throw new BadRequestError("User not permitted to add members to this card");
    }

    const member = await prisma.user.findUnique({
      where: {
        email: email,
      }
    })

    if (!member) {
      throw new BadRequestError("User not found")
    }

    await prisma.cardUser.create({
      data: {
        userId: member.id,
        cardId: cardId,
      },
    })

    res.status(StatusCodes.CREATED).json({ message: "SUCCESS" })
  }
  catch (error) {
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" })
  }
};

module.exports = {
  createCard,
  deleteCard,
  changeCardPosition,
  moveCardToDifferentBoard,
  addCardMember
}