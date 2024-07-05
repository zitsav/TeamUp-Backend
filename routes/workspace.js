const express = require('express');
const router = express.Router();
const {
    createWorkspace,
    getAllWorkspaces,
    getWorkspaceById,
    editWorkspace,
    removeWorkspace,
    addWorkspaceMember
} = require('../controllers/workspace');
const authMiddleware = require('../middlewares/authentication');

router.use(authMiddleware)

router.post('/', createWorkspace)

router.get('/', getAllWorkspaces)

router.get('/:id', getWorkspaceById)

router.put('/:id', editWorkspace)

router.delete('/:id', removeWorkspace)

router.post('/user', addWorkspaceMember)

module.exports = router