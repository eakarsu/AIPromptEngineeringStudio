const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');

// Get all API keys (masked)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, key_prefix, permissions, is_active, last_used_at, usage_count, rate_limit, expires_at, created_at FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create API key
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, permissions, rate_limit, expires_in_days } = req.body;
    const rawKey = 'ps_' + crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 10) + '...';
    const expiresAt = expires_in_days ? new Date(Date.now() + expires_in_days * 86400000) : null;

    const result = await pool.query(
      `INSERT INTO api_keys (name, key_hash, key_prefix, permissions, rate_limit, expires_at, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, key_prefix, permissions, is_active, rate_limit, expires_at, created_at`,
      [name, keyHash, keyPrefix, permissions || ['read'], rate_limit || 100, expiresAt, req.user.id]
    );

    // Return the full key only once
    res.json({ ...result.rows[0], key: rawKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update API key
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, permissions, is_active, rate_limit } = req.body;
    const result = await pool.query(
      `UPDATE api_keys SET name = COALESCE($1, name), permissions = COALESCE($2, permissions),
       is_active = COALESCE($3, is_active), rate_limit = COALESCE($4, rate_limit)
       WHERE id = $5 AND user_id = $6
       RETURNING id, name, key_prefix, permissions, is_active, last_used_at, usage_count, rate_limit, expires_at, created_at`,
      [name, permissions, is_active, rate_limit, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'API key not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revoke (delete) API key
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM api_keys WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'API key revoked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
