const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM optimization_jobs WHERE user_id = $1 ORDER BY created_at DESC',
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
      'SELECT * FROM optimization_jobs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, original_prompt, optimization_type, strategy } = req.body;
    const result = await pool.query(
      `INSERT INTO optimization_jobs (name, original_prompt, optimization_type, strategy, user_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, original_prompt, optimization_type || 'general', strategy || 'auto', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, original_prompt, optimized_prompt, optimization_type, strategy, status, improvement_score, ai_feedback, suggestions } = req.body;
    const result = await pool.query(
      `UPDATE optimization_jobs SET name=$1, original_prompt=$2, optimized_prompt=$3, optimization_type=$4, strategy=$5, status=$6, improvement_score=$7, ai_feedback=$8, suggestions=$9, updated_at=NOW()
       WHERE id=$10 AND user_id=$11 RETURNING *`,
      [name, original_prompt, optimized_prompt, optimization_type, strategy, status, improvement_score, ai_feedback, JSON.stringify(suggestions || []), req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM optimization_jobs WHERE id=$1 AND user_id=$2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Optimization job deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
