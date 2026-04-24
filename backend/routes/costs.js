const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ct.*, pt.name as prompt_name FROM cost_tracking ct
       LEFT JOIN prompt_templates pt ON ct.prompt_id = pt.id
       WHERE ct.user_id = $1 ORDER BY ct.recorded_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         SUM(total_cost) as total_cost,
         SUM(input_tokens) as total_input_tokens,
         SUM(output_tokens) as total_output_tokens,
         COUNT(*) as total_requests,
         model,
         AVG(total_cost) as avg_cost_per_request
       FROM cost_tracking WHERE user_id = $1
       GROUP BY model ORDER BY total_cost DESC`,
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
      `SELECT ct.*, pt.name as prompt_name FROM cost_tracking ct
       LEFT JOIN prompt_templates pt ON ct.prompt_id = pt.id
       WHERE ct.id = $1 AND ct.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { prompt_id, model, input_tokens, output_tokens, total_cost, request_type, period } = req.body;
    const result = await pool.query(
      `INSERT INTO cost_tracking (prompt_id, model, input_tokens, output_tokens, total_cost, request_type, period, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [prompt_id || null, model, input_tokens || 0, output_tokens || 0, total_cost || 0, request_type, period, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM cost_tracking WHERE id=$1 AND user_id=$2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Cost record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
