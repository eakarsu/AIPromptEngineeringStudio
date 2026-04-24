const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pv.*, pt.name as prompt_name
       FROM prompt_versions pv
       LEFT JOIN prompt_templates pt ON pv.prompt_id = pt.id
       WHERE pv.user_id = $1 ORDER BY pv.created_at DESC`,
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
      `SELECT pv.*, pt.name as prompt_name FROM prompt_versions pv
       LEFT JOIN prompt_templates pt ON pv.prompt_id = pt.id
       WHERE pv.id = $1 AND pv.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Version not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { prompt_id, content, change_notes, performance_score } = req.body;
    const maxVersion = await pool.query(
      'SELECT COALESCE(MAX(version_number), 0) + 1 as next_version FROM prompt_versions WHERE prompt_id = $1',
      [prompt_id]
    );
    const result = await pool.query(
      `INSERT INTO prompt_versions (prompt_id, version_number, content, change_notes, performance_score, user_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [prompt_id, maxVersion.rows[0].next_version, content, change_notes, performance_score || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { content, change_notes, performance_score } = req.body;
    const result = await pool.query(
      `UPDATE prompt_versions SET content=$1, change_notes=$2, performance_score=$3
       WHERE id=$4 AND user_id=$5 RETURNING *`,
      [content, change_notes, performance_score, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Version not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM prompt_versions WHERE id=$1 AND user_id=$2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Version not found' });
    res.json({ message: 'Version deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
