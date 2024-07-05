const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../errors');

const createWorkspace = async (req, res) => {
  const {userId} = req.user
  const {title, icon} = req.body

  try{
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      }
    })

    if (!user) {
      throw new BadRequestError("User not found, try logging in again")
    }

    if (!title){
      throw new BadRequestError("No title provided")
    }

    await prisma.workspace.create({
      data:{
        title,
        icon,
        members: {
          create: {
            userId
          }
        },
        boards: {
          create: [
            {title: "ToDo"},
            {title: "Ongoing"},
            {title: "Finished"}
          ],
        },
      }
    })

    res.status(StatusCodes.CREATED).json({message: "SUCCESS"})
  } catch (error) {
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error"})
  }
};

const getAllWorkspaces = async (req, res) => {
  const {userId} = req.user

  try{
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      }
    })

    if (!user){
      throw new BadRequestError("User not found, try logging in again")
    }

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          }
        }
      },
      select: {
        id: true,
        title: true,
        icon: true,
        members: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: true,
              },
            },    
          }
        }
      }
    })

    res.status(StatusCodes.OK).json({workspaces});
  }
  catch (error){
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: "Internal server error"})
  }
};

const getWorkspaceById = async (req, res) => {
  const {userId} = req.user
  const id = parseInt(req.params.id)

  try{
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      }
    })

    if (!user){
      throw new BadRequestError("User not found, try logging in again")
    }

    const isMember = await prisma.workspace.findFirst({
      where: {
        id: id,
        members: {
          some: {
            userId: userId,
          },
        },
      },
    })

    if (!isMember) {
      throw new BadRequestError("User not allowed to view this workspace")
    }

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: id,
      },
      include: {
        members: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: true,
              },
            },    
          }
        },
        boards: {
          include: {
            cards: {
              include: {
                subtasks: true,
                assignedUsers: {
                  select: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        profile: true,
                      },
                    },    
                  }
                },
              },
            },
          },
        },
      },
    })

    if (!workspace) {
      throw new BadRequestError("Workspace not found")
    }

    res.status(StatusCodes.OK).json({workspace})
  }
  catch (error){
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: "Internal server error"})
  }
}

const editWorkspace = async (req, res) => {
  const {userId} = req.user
  const id = parseInt(req.params.id)
  const {title} = req.body

  try{
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      }
    })

    if (!user){
      throw new BadRequestError("User not found, try logging in again")
    }

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: id,
      }
    })

    if (!workspace){
      throw new BadRequestError("Workspace not found")
    }

    const isMember = await prisma.workspace.findFirst({
      where: {
        id: id,
        members: {
          some: {
            userId: userId,
          },
        },
      },
    })

    if (!isMember) {
      throw new BadRequestError("User not allowed to view this workspace")
    }

    await prisma.workspace.update({
      where: {
        id: parseInt(id),
      },
      data: {
        title,
      },
    })

    res.status(StatusCodes.OK).json({message: "SUCCESS"})
  }
  catch (error){
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error"})
  }
}

const removeWorkspace = async (req, res) => {
  const {userId} = parseInt(req.user)
  const id = parseInt(req.params.id)

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      }
    })

    if (!user) {
      throw new BadRequestError("User not found, try logging in again")
    }

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: id
      }
    })

    if (!workspace){
      throw new BadRequestError("Workspace not found")
    }

    const isMember = await prisma.workspace.findFirst({
      where: {
        id: id,
        members: {
          some: {
            userId: userId,
          },
        },
      },
    })

    if (!isMember) {
      throw new BadRequestError("User not allowed to view this workspace")
    }

    await prisma.workspace.delete({
      where: {
        id: id
      },
    })

    res.status(StatusCodes.OK).json({message: "SUCCESS"})
  }
  catch (error){
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: "Internal server error"})
  }
}

const addWorkspaceMember = async (req, res) => {
  const {userId} = req.user
  const {workspaceId, email} = req.body
  
  try {
    const workspace = await prisma.workspace.findUnique({
      where: {
        id: workspaceId
      },
    })

    if (!workspace) {
      throw new BadRequestError("Workspace not found")
    }

    const isMember = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        members: {
          some: {
            userId: userId,
          },
        },
      },
    })

    if (!isMember) {
      throw new BadRequestError("User not allowed to view this workspace")
    }

    const member = await prisma.user.findUnique({
      where:{
        email:email,
      },
    })

    if (!member) {
      throw new BadRequestError("User not found")
    }

    const newMember = await prisma.workspaceMember.create({
      data:{
        userId: member.id,
        workspaceId: workspaceId
      }
    })

    res.status(StatusCodes.CREATED).json({message: "SUCCESS"})
  } catch (error) {
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: "Internal server error"})
  }
};

module.exports = {
  createWorkspace,
  getAllWorkspaces,
  getWorkspaceById,
  editWorkspace,
  removeWorkspace,
  addWorkspaceMember
};