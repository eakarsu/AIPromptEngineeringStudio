const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get all tags
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tags WHERE user_id = $1 ORDER BY usage_count DESC, name ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create tag
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, color, description } = req.body;
    const result = await pool.query(
      'INSERT INTO tags (name, color, description, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, color || '#6366f1', description, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Tag already exists' });
    res.status(500).json({ error: err.message });
  }
});

// Update tag
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, color, description } = req.body;
    const result = await pool.query(
      'UPDATE tags SET name = COALESCE($1, name), color = COALESCE($2, color), description = COALESCE($3, description) WHERE id = $4 AND user_id = $5 RETURNING *',
      [name, color, description, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tag not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete tag
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM tags WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Tag deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sync tags from prompts (populate tags table from existing prompt tags)
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const prompts = await pool.query(
      'SELECT tags FROM prompt_templates WHERE user_id = $1 AND tags IS NOT NULL',
      [req.user.id]
    );
    const tagSet = new Set();
    prompts.rows.forEach(p => {
      if (p.tags) p.tags.forEach(t => tagSet.add(t));
    });
    let created = 0;
    for (const tagName of tagSet) {
      try {
        await pool.query(
          'INSERT INTO tags (name, user_id) VALUES ($1, $2) ON CONFLICT (name, user_id) DO NOTHING',
          [tagName, req.user.id]
        );
        created++;
      } catch (e) { /* skip duplicates */ }
    }
    // Update usage counts
    await pool.query(`
      UPDATE tags SET usage_count = (
        SELECT COUNT(*) FROM prompt_templates
        WHERE user_id = tags.user_id AND $1 = ANY(tags)
      ) WHERE user_id = $2
    `, ['{' + Array.from(tagSet).join(',') + '}', req.user.id]);

    res.json({ message: `Synced ${created} tags`, total: tagSet.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
