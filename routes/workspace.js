const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspace');
const authMiddleware = require('../middlewares/authentication');

router.use(authMiddleware);

router.post('/', workspaceController.createWorkspace);

router.get('/', workspaceController.getAllWorkspaces);

router.get('/:id', workspaceController.getWorkspaceById);

router.put('/:id', workspaceController.editWorkspace);

router.delete('/:id', workspaceController.removeWorkspace);

module.exports = router;