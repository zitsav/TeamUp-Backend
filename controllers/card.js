const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../errors');

const isWorkspaceMember = async (workspaceId, userId) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { members: true },
  });

  if (!workspace) {
    throw new BadRequestError('Workspace not found');
  }

  const isMember = workspace.members.some(member => member.userId === userId);
  if (!isMember) {
    throw new BadRequestError('User is not authorized to perform this action');
  }
};

const createCard = async (req, res) => {
  const { userId } = req.user;
  const { title, board_id, deadline } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestError('User not found, try logging in again');
    }

    if (!board_id) {
      throw new BadRequestError('Board id is required');
    }

    const board = await prisma.board.findUnique({
      where: { id: parseInt(board_id) },
      include: {
        Workspace: true,
        cards: { orderBy: { position: 'desc' }, take: 1 },
      },
    });

    if (!board) {
      throw new BadRequestError('Board not found');
    }

    await isWorkspaceMember(board.workspaceId, userId);

    const lastPosition = board.cards.length > 0 ? board.cards[0].position : 0;

    const newCard = await prisma.card.create({
      data: {
        title,
        deadline,
        position: lastPosition + 1,
        boardId: parseInt(board_id),
        startedBy: userId,
      },
    });

    await prisma.board.update({
      where: { id: parseInt(board_id) },
      data: { lastPosition: lastPosition + 1 },
    });

    res.status(StatusCodes.CREATED).json({ card: newCard });
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const getCard = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    const card = await prisma.card.findUnique({
      where: { id: parseInt(id) },
      include: {
        Board: {
          include: { Workspace: true },
        },
      },
    });

    if (!card) {
      throw new BadRequestError('Card not found');
    }

    await isWorkspaceMember(card.Board.workspaceId, userId);

    res.status(StatusCodes.OK).json({ card });
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const updateCard = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  const { title, description, position } = req.body;

  try {
    const card = await prisma.card.findUnique({
      where: { id: parseInt(id) },
      include: {
        Board: {
          include: { Workspace: true },
        },
      },
    });

    if (!card) {
      throw new BadRequestError('Card not found');
    }

    await isWorkspaceMember(card.Board.workspaceId, userId);

    if (position !== undefined) {
      if (position >= card.Board.lastPosition) {
        throw new BadRequestError('Invalid position');
      }
    }

    const updatedCard = await prisma.card.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        position,
      },
    });

    res.status(StatusCodes.OK).json({ card: updatedCard });
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const deleteCard = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    const card = await prisma.card.findUnique({
      where: { id: parseInt(id) },
      include: {
        Board: {
          include: { Workspace: true },
        },
      },
    });

    if (!card) {
      throw new BadRequestError('Card not found');
    }

    await isWorkspaceMember(card.Board.workspaceId, userId);

    const deletedCard = await prisma.card.delete({
      where: { id: parseInt(id) },
    });

    res.status(StatusCodes.OK).json({ card: deletedCard });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const getAllCardsInBoard = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  try {
    const board = await prisma.board.findUnique({
      where: { id: parseInt(id) },
      include: {
        Workspace: {
          include: { members: true },
        },
        cards: { orderBy: { position: 'asc' } },
      },
    });

    if (!board) {
      throw new BadRequestError('Board not found');
    }

    await isWorkspaceMember(board.workspaceId, userId);

    res.status(StatusCodes.OK).json({ cards: board.cards });
  } catch (error) {
    console.error('Error fetching cards in board:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const changeCardPosition = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  const { newPosition } = req.body;

  try {
    const card = await prisma.card.findUnique({
      where: { id: parseInt(id) },
      include: {
        Board: true,
      },
    });

    if (!card) {
      throw new BadRequestError('Card not found');
    }

    await isWorkspaceMember(card.Board.workspaceId, userId);

    if (newPosition >= card.Board.lastPosition) {
      throw new BadRequestError('Invalid position');
    }

    const boardCards = await prisma.card.findMany({
      where: { boardId: card.boardId },
      orderBy: { position: 'asc' },
    });

    let updatedCards = [];
    if (newPosition < card.position) {
      updatedCards = boardCards.filter(c => c.position >= newPosition && c.position < card.position);
      updatedCards.forEach(c => c.position++);
    } else if (newPosition > card.position) {
      updatedCards = boardCards.filter(c => c.position > card.position && c.position <= newPosition);
      updatedCards.forEach(c => c.position--);
    }

    await prisma.$transaction(
      updatedCards.map(c => prisma.card.update({
        where: { id: c.id },
        data: { position: c.position },
      }))
    );

    const updatedCard = await prisma.card.update({
      where: { id: parseInt(id) },
      data: { position: newPosition },
    });

    res.status(StatusCodes.OK).json({ card: updatedCard });
  } catch (error) {
    console.error('Error changing card position:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const moveCardToDifferentBoard = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  const { newBoardId, newPosition } = req.body;

  try {
    const card = await prisma.card.findUnique({
      where: { id: parseInt(id) },
      include: {
        Board: true,
      },
    });

    if (!card) {
      throw new BadRequestError('Card not found');
    }

    await isWorkspaceMember(card.Board.workspaceId, userId);

    const targetBoard = await prisma.board.findUnique({
      where: { id: parseInt(newBoardId) },
      include: { cards: { orderBy: { position: 'asc' } } },
    });

    if (!targetBoard) {
      throw new BadRequestError('Target board not found');
    }

    await isWorkspaceMember(targetBoard.workspaceId, userId);

    if (newPosition > targetBoard.lastPosition + 1) {
      throw new BadRequestError('Invalid position for target board');
    }

    const originalBoardCards = await prisma.card.findMany({
      where: { boardId: card.boardId },
      orderBy: { position: 'asc' },
    });

    const targetBoardCards = targetBoard.cards;

    const updatedOriginalBoardCards = originalBoardCards.filter(c => c.position > card.position);
    updatedOriginalBoardCards.forEach(c => c.position--);

    const updatedTargetBoardCards = targetBoardCards.filter(c => c.position >= newPosition);
    updatedTargetBoardCards.forEach(c => c.position++);

    await prisma.$transaction([
      ...updatedOriginalBoardCards.map(c => prisma.card.update({
        where: { id: c.id },
        data: { position: c.position },
      })),
      ...updatedTargetBoardCards.map(c => prisma.card.update({
        where: { id: c.id },
        data: { position: c.position },
      })),
      prisma.card.update({
        where: { id: parseInt(id) },
        data: {
          boardId: parseInt(newBoardId),
          position: newPosition,
        },
      }),
    ]);

    res.status(StatusCodes.OK).json({ message: 'Card moved successfully' });
  } catch (error) {
    console.error('Error moving card:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createCard,
  getCard,
  updateCard,
  deleteCard,
  getAllCardsInBoard,
  changeCardPosition,
  moveCardToDifferentBoard,
};