const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all prompts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pt.*, c.name as category_name, c.color as category_color
       FROM prompt_templates pt
       LEFT JOIN categories c ON pt.category_id = c.id
       WHERE pt.user_id = $1
       ORDER BY pt.updated_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single prompt
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pt.*, c.name as category_name, c.color as category_color
       FROM prompt_templates pt
       LEFT JOIN categories c ON pt.category_id = c.id
       WHERE pt.id = $1 AND pt.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Prompt not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create prompt
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, content, category_id, tags, model, temperature, max_tokens, status, is_public } = req.body;
    const result = await pool.query(
      `INSERT INTO prompt_templates (name, description, content, category_id, user_id, tags, model, temperature, max_tokens, status, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, description, content, category_id || null, req.user.id, tags || [], model || 'anthropic/claude-haiku-4.5', temperature || 0.7, max_tokens || 1024, status || 'draft', is_public || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update prompt
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, content, category_id, tags, model, temperature, max_tokens, status, is_public } = req.body;
    const result = await pool.query(
      `UPDATE prompt_templates SET name=$1, description=$2, content=$3, category_id=$4, tags=$5, model=$6, temperature=$7, max_tokens=$8, status=$9, is_public=$10, updated_at=NOW()
       WHERE id=$11 AND user_id=$12 RETURNING *`,
      [name, description, content, category_id || null, tags || [], model, temperature, max_tokens, status, is_public, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Prompt not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete prompt
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM prompt_templates WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Prompt not found' });
    res.json({ message: 'Prompt deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
