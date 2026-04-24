const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get comments for a prompt
router.get('/prompt/:promptId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name as author_name, u.avatar_url as author_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.prompt_id = $1
       ORDER BY c.created_at ASC`,
      [req.params.promptId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all comments by user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, pt.name as prompt_name, u.name as author_name
       FROM comments c
       JOIN prompt_templates pt ON c.prompt_id = pt.id
       JOIN users u ON c.user_id = u.id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { prompt_id, content, parent_id } = req.body;
    const result = await pool.query(
      'INSERT INTO comments (prompt_id, user_id, content, parent_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [prompt_id, req.user.id, content, parent_id || null]
    );
    const comment = await pool.query(
      `SELECT c.*, u.name as author_name, u.avatar_url as author_avatar
       FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = $1`,
      [result.rows[0].id]
    );
    res.json(comment.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update comment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    const result = await pool.query(
      'UPDATE comments SET content = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [content, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Comment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete comment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM comments WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
