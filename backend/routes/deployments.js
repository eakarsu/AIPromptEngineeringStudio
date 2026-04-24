const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, pt.name as prompt_name FROM deployments d
       LEFT JOIN prompt_templates pt ON d.prompt_id = pt.id
       WHERE d.user_id = $1 ORDER BY d.created_at DESC`,
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
      `SELECT d.*, pt.name as prompt_name, pt.content as prompt_content FROM deployments d
       LEFT JOIN prompt_templates pt ON d.prompt_id = pt.id
       WHERE d.id = $1 AND d.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deployment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, prompt_id, version_id, environment, rate_limit } = req.body;
    const apiKey = 'psk_' + uuidv4().replace(/-/g, '');
    const result = await pool.query(
      `INSERT INTO deployments (name, prompt_id, version_id, environment, api_key, rate_limit, status, user_id, deployed_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, NOW()) RETURNING *`,
      [name, prompt_id, version_id || null, environment || 'staging', apiKey, rate_limit || 100, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, environment, status, rate_limit } = req.body;
    const result = await pool.query(
      `UPDATE deployments SET name=$1, environment=$2, status=$3, rate_limit=$4, updated_at=NOW()
       WHERE id=$5 AND user_id=$6 RETURNING *`,
      [name, environment, status, rate_limit, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deployment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM deployments WHERE id=$1 AND user_id=$2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deployment not found' });
    res.json({ message: 'Deployment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
