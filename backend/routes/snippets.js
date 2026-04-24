const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get all snippets
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { language, pinned } = req.query;
    let query = 'SELECT * FROM snippets WHERE user_id = $1';
    const params = [req.user.id];
    if (language) {
      params.push(language);
      query += ` AND language = $${params.length}`;
    }
    if (pinned === 'true') {
      query += ' AND is_pinned = true';
    }
    query += ' ORDER BY is_pinned DESC, updated_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single snippet
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM snippets WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Snippet not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create snippet
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, description, language, tags, is_pinned } = req.body;
    const result = await pool.query(
      `INSERT INTO snippets (title, content, description, language, tags, is_pinned, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, content, description, language || 'text', tags || [], is_pinned || false, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update snippet
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, description, language, tags, is_pinned } = req.body;
    const result = await pool.query(
      `UPDATE snippets SET title = COALESCE($1, title), content = COALESCE($2, content),
       description = COALESCE($3, description), language = COALESCE($4, language),
       tags = COALESCE($5, tags), is_pinned = COALESCE($6, is_pinned), updated_at = NOW()
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [title, content, description, language, tags, is_pinned, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Snippet not found' });
    // Increment usage count when content is read/copied
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle pin
router.put('/:id/pin', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE snippets SET is_pinned = NOT is_pinned, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Snippet not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Increment usage
router.post('/:id/use', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE snippets SET usage_count = usage_count + 1 WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete snippet
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM snippets WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Snippet deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
