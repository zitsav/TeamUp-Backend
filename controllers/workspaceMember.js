const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../errors');

const addWorkspaceMember = async (req, res) => {
  const { userId } = req.user;
  const { workspaceId, memberId } = req.body;
  
  try {
    const workspace = await prisma.workspace.findUnique({
      where: {
        id: parseInt(workspaceId),
      },
    });
    if (!workspace) {
      throw new BadRequestError('Workspace not found');
    }

    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(userId),
      },
    });
    if (!user) {
      throw new BadRequestError('User not found, try logging in again');
    }

    const isUserInWorkspace = await prisma.workspaceMember.findFirst({
      where: {
        userId: parseInt(userId),
        workspaceId: parseInt(workspaceId),
      },
    });
    if (!isUserInWorkspace){
      throw new BadRequestError('User not authorized to add a member');
    }

    const member = await prisma.user.findUnique({
      where: {
        id: parseInt(memberId),
      },
    });
    if (!member) {
      throw new BadRequestError('User not found');
    }

    const newMember = await prisma.workspaceMember.create({
      data: {
        userId: parseInt(memberId),
        workspaceId: parseInt(workspaceId),
      },
    });

    res.status(StatusCodes.CREATED).json({ member: newMember });
  } catch (error) {
    console.error('Error adding workspace member:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const removeWorkspaceMember = async (req, res) => {
  const { userId } = req.user;
  const { workspaceId, memberId } = req.body;
  
  try {
    const workspace = await prisma.workspace.findUnique({
      where: {
        id: parseInt(workspaceId),
      },
    });
    if (!workspace) {
      throw new BadRequestError('Workspace not found');
    }

    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(userId),
      },
    });
    if (!user) {
      throw new BadRequestError('User not found, try logging in again');
    }

    const isUserInWorkspace = await prisma.workspaceMember.findFirst({
      where: {
        userId: parseInt(userId),
        workspaceId: parseInt(workspaceId),
      },
    });
    if (!isUserInWorkspace){
      throw new BadRequestError('User is not permitted to remove a member from the workspace');
    }

    const deletedMember = await prisma.workspaceMember.delete({
      where: {
        id: parseInt(memberId),
      },
    });

    if (!deletedMember) {
      throw new BadRequestError('Workspace member not found');
    }

    res.status(StatusCodes.OK).json({ member: deletedMember });
  } catch (error) {
    console.error('Error removing workspace member:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

const getWorkspaceMembers = async (req, res) => {
  const { userId } = req.user;
  const { workspaceId } = req.params;

  try {
    const workspace = await prisma.workspace.findUnique({
      where: {
        id: parseInt(workspaceId),
      },
    });
    if (!workspace) {
      throw new BadRequestError('Workspace not found');
    }

    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(userId),
      },
    });
    if (!user) {
      throw new BadRequestError('User not found, try logging in again');
    }

    const isUserInWorkspace = await prisma.workspaceMember.findFirst({
      where: {
        userId: parseInt(userId),
        workspaceId: parseInt(workspaceId),
      },
    });
    if (!isUserInWorkspace){
      throw new BadRequestError('User is not authorized to view this workspace');
    }

    const workspaceMembers = await prisma.workspaceMember.findMany({
      where: {
        workspaceId: parseInt(workspaceId),
      },
    });

    res.status(StatusCodes.OK).json({ members: workspaceMembers });
  } catch (error) {
    console.error('Error fetching workspace members:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
  }
};

module.exports = {
  addWorkspaceMember,
  removeWorkspaceMember,
  getWorkspaceMembers,
};