const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get all favorites
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.*, pt.name as prompt_name, pt.description as prompt_description,
       pt.tags, pt.status, pt.model, pt.usage_count, pt.avg_rating
       FROM favorites f
       JOIN prompt_templates pt ON f.prompt_id = pt.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle favorite
router.post('/toggle', authenticateToken, async (req, res) => {
  try {
    const { prompt_id } = req.body;
    const existing = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND prompt_id = $2',
      [req.user.id, prompt_id]
    );
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM favorites WHERE id = $1', [existing.rows[0].id]);
      res.json({ favorited: false });
    } else {
      await pool.query(
        'INSERT INTO favorites (user_id, prompt_id) VALUES ($1, $2)',
        [req.user.id, prompt_id]
      );
      res.json({ favorited: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check if favorited
router.get('/check/:promptId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND prompt_id = $2',
      [req.user.id, req.params.promptId]
    );
    res.json({ favorited: result.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove favorite
router.delete('/:promptId', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND prompt_id = $2',
      [req.user.id, req.params.promptId]
    );
    res.json({ message: 'Favorite removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
