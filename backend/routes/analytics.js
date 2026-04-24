const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, pt.name as prompt_name
       FROM analytics a
       LEFT JOIN prompt_templates pt ON a.prompt_id = pt.id
       WHERE a.user_id = $1 ORDER BY a.recorded_at DESC LIMIT 100`,
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
         COUNT(*) as total_requests,
         SUM(tokens_used) as total_tokens,
         AVG(latency_ms) as avg_latency,
         SUM(cost) as total_cost,
         COUNT(CASE WHEN success = true THEN 1 END) as successful_requests,
         COUNT(CASE WHEN success = false THEN 1 END) as failed_requests
       FROM analytics WHERE user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, pt.name as prompt_name FROM analytics a
       LEFT JOIN prompt_templates pt ON a.prompt_id = pt.id
       WHERE a.id = $1 AND a.user_id = $2`,
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
    const { prompt_id, metric_type, metric_value, tokens_used, latency_ms, cost, model, success, error_message, metadata } = req.body;
    const result = await pool.query(
      `INSERT INTO analytics (prompt_id, metric_type, metric_value, tokens_used, latency_ms, cost, model, success, error_message, metadata, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [prompt_id, metric_type, metric_value, tokens_used || 0, latency_ms || 0, cost || 0, model, success !== false, error_message, JSON.stringify(metadata || {}), req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM analytics WHERE id=$1 AND user_id=$2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Analytics record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
