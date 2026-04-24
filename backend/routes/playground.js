const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM playground_sessions WHERE user_id = $1 ORDER BY created_at DESC',
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
      'SELECT * FROM playground_sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, prompt_text, system_prompt, model, temperature, max_tokens } = req.body;
    const result = await pool.query(
      `INSERT INTO playground_sessions (name, prompt_text, system_prompt, model, temperature, max_tokens, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name || 'Untitled Session', prompt_text, system_prompt, model || 'anthropic/claude-haiku-4.5', temperature || 0.7, max_tokens || 1024, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, prompt_text, system_prompt, model, temperature, max_tokens, response_text, tokens_used, latency_ms, cost } = req.body;
    const result = await pool.query(
      `UPDATE playground_sessions SET name=$1, prompt_text=$2, system_prompt=$3, model=$4, temperature=$5, max_tokens=$6, response_text=$7, tokens_used=$8, latency_ms=$9, cost=$10, updated_at=NOW()
       WHERE id=$11 AND user_id=$12 RETURNING *`,
      [name, prompt_text, system_prompt, model, temperature, max_tokens, response_text, tokens_used, latency_ms, cost, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM playground_sessions WHERE id=$1 AND user_id=$2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
