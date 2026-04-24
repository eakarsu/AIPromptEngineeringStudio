const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get all folders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.*, (SELECT COUNT(*) FROM folder_prompts WHERE folder_id = f.id) as prompt_count
       FROM folders f WHERE f.user_id = $1 ORDER BY f.name ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get folder with prompts
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const folder = await pool.query(
      'SELECT * FROM folders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (folder.rows.length === 0) return res.status(404).json({ error: 'Folder not found' });

    const prompts = await pool.query(
      `SELECT pt.*, fp.added_at FROM folder_prompts fp
       JOIN prompt_templates pt ON fp.prompt_id = pt.id
       WHERE fp.folder_id = $1 ORDER BY fp.added_at DESC`,
      [req.params.id]
    );
    res.json({ ...folder.rows[0], prompts: prompts.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create folder
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, color, icon, parent_id } = req.body;
    const result = await pool.query(
      'INSERT INTO folders (name, description, color, icon, parent_id, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, color || '#6366f1', icon || 'folder', parent_id || null, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update folder
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
    const result = await pool.query(
      `UPDATE folders SET name = COALESCE($1, name), description = COALESCE($2, description),
       color = COALESCE($3, color), icon = COALESCE($4, icon), updated_at = NOW()
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [name, description, color, icon, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Folder not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add prompt to folder
router.post('/:id/prompts', authenticateToken, async (req, res) => {
  try {
    const { prompt_id } = req.body;
    await pool.query(
      'INSERT INTO folder_prompts (folder_id, prompt_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, prompt_id]
    );
    res.json({ message: 'Prompt added to folder' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove prompt from folder
router.delete('/:id/prompts/:promptId', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM folder_prompts WHERE folder_id = $1 AND prompt_id = $2',
      [req.params.id, req.params.promptId]
    );
    res.json({ message: 'Prompt removed from folder' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete folder
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM folders WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Folder deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
