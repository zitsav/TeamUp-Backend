const express = require('express');
const router = express.Router();
const { addWorkspaceMember, removeWorkspaceMember, getWorkspaceMembers } = require('../controllers/workspaceMember');
const authMiddleware = require('../middlewares/authentication');

router.use(authMiddleware);

router.post('/add-member', addWorkspaceMember);

router.post('/remove-member', removeWorkspaceMember);

router.get('/:workspaceId/members', getWorkspaceMembers);

module.exports = router;