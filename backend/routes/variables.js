const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*, pt.name as prompt_name FROM variables v
       LEFT JOIN prompt_templates pt ON v.prompt_id = pt.id
       WHERE v.user_id = $1 ORDER BY v.created_at DESC`,
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
      `SELECT v.*, pt.name as prompt_name FROM variables v
       LEFT JOIN prompt_templates pt ON v.prompt_id = pt.id
       WHERE v.id = $1 AND v.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Variable not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, default_value, variable_type, validation_regex, required, options, prompt_id } = req.body;
    const result = await pool.query(
      `INSERT INTO variables (name, description, default_value, variable_type, validation_regex, required, options, prompt_id, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, description, default_value, variable_type || 'text', validation_regex, required || false, JSON.stringify(options || []), prompt_id || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, default_value, variable_type, validation_regex, required, options, prompt_id } = req.body;
    const result = await pool.query(
      `UPDATE variables SET name=$1, description=$2, default_value=$3, variable_type=$4, validation_regex=$5, required=$6, options=$7, prompt_id=$8, updated_at=NOW()
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [name, description, default_value, variable_type, validation_regex, required, JSON.stringify(options || []), prompt_id, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Variable not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM variables WHERE id=$1 AND user_id=$2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Variable not found' });
    res.json({ message: 'Variable deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
