const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pl.*, pt.content as prompt_content, u.name as author_name
       FROM prompt_library pl
       LEFT JOIN prompt_templates pt ON pl.prompt_id = pt.id
       LEFT JOIN users u ON pl.user_id = u.id
       WHERE pl.user_id = $1 ORDER BY pl.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pl.*, pt.content as prompt_content, u.name as author_name
       FROM prompt_library pl
       LEFT JOIN prompt_templates pt ON pl.prompt_id = pt.id
       LEFT JOIN users u ON pl.user_id = u.id
       WHERE pl.id = $1 AND pl.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Library item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { prompt_id, title, description, category, difficulty, use_case, example_output, is_featured } = req.body;
    const result = await pool.query(
      `INSERT INTO prompt_library (prompt_id, title, description, category, difficulty, use_case, example_output, is_featured, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [prompt_id || null, title, description, category, difficulty || 'intermediate', use_case, example_output, is_featured || false, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, difficulty, use_case, example_output, is_featured } = req.body;
    const result = await pool.query(
      `UPDATE prompt_library SET title=$1, description=$2, category=$3, difficulty=$4, use_case=$5, example_output=$6, is_featured=$7, updated_at=NOW()
       WHERE id=$8 AND user_id=$9 RETURNING *`,
      [title, description, category, difficulty, use_case, example_output, is_featured, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Library item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM prompt_library WHERE id=$1 AND user_id=$2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Library item not found' });
    res.json({ message: 'Library item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
