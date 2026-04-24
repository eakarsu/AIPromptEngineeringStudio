const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, pt.name as prompt_name FROM evaluations e
       LEFT JOIN prompt_templates pt ON e.prompt_id = pt.id
       WHERE e.user_id = $1 ORDER BY e.created_at DESC`,
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
      `SELECT e.*, pt.name as prompt_name FROM evaluations e
       LEFT JOIN prompt_templates pt ON e.prompt_id = pt.id
       WHERE e.id = $1 AND e.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Evaluation not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, prompt_id, input_text, output_text, score, criteria, feedback, evaluation_type, status } = req.body;
    const result = await pool.query(
      `INSERT INTO evaluations (name, prompt_id, input_text, output_text, score, criteria, feedback, evaluation_type, status, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, prompt_id || null, input_text, output_text, score, JSON.stringify(criteria || {}), feedback, evaluation_type || 'manual', status || 'pending', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, input_text, output_text, score, criteria, feedback, evaluation_type, status, ai_analysis } = req.body;
    const result = await pool.query(
      `UPDATE evaluations SET name=$1, input_text=$2, output_text=$3, score=$4, criteria=$5, feedback=$6, evaluation_type=$7, status=$8, ai_analysis=$9, updated_at=NOW()
       WHERE id=$10 AND user_id=$11 RETURNING *`,
      [name, input_text, output_text, score, JSON.stringify(criteria || {}), feedback, evaluation_type, status, ai_analysis, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Evaluation not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM evaluations WHERE id=$1 AND user_id=$2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Evaluation not found' });
    res.json({ message: 'Evaluation deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
