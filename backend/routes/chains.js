const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM prompt_chains WHERE user_id = $1 ORDER BY created_at DESC',
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
      'SELECT * FROM prompt_chains WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Chain not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, steps, status } = req.body;
    const stepsArray = steps || [];
    const result = await pool.query(
      `INSERT INTO prompt_chains (name, description, steps, total_steps, status, user_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, JSON.stringify(stepsArray), stepsArray.length, status || 'draft', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, steps, status, last_output } = req.body;
    const stepsArray = steps || [];
    const result = await pool.query(
      `UPDATE prompt_chains SET name=$1, description=$2, steps=$3, total_steps=$4, status=$5, last_output=$6, updated_at=NOW()
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [name, description, JSON.stringify(stepsArray), stepsArray.length, status, last_output, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Chain not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM prompt_chains WHERE id=$1 AND user_id=$2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Chain not found' });
    res.json({ message: 'Chain deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
