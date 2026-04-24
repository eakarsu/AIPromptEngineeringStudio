const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get user profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const settings = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [req.user.id]
    );
    res.json({
      ...result.rows[0],
      settings: settings.rows[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { name, avatar_url } = req.body;
    const result = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), avatar_url = COALESCE($2, avatar_url), updated_at = NOW() WHERE id = $3 RETURNING id, email, name, role, avatar_url',
      [name, avatar_url, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(current_password, user.rows[0].password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get settings
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    let result = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      result = await pool.query(
        'INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *',
        [req.user.id]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { theme, language, notifications_enabled, email_notifications, default_model, default_temperature, default_max_tokens, timezone } = req.body;
    const existing = await pool.query('SELECT id FROM user_settings WHERE user_id = $1', [req.user.id]);
    let result;
    if (existing.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO user_settings (user_id, theme, language, notifications_enabled, email_notifications, default_model, default_temperature, default_max_tokens, timezone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [req.user.id, theme, language, notifications_enabled, email_notifications, default_model, default_temperature, default_max_tokens, timezone]
      );
    } else {
      result = await pool.query(
        `UPDATE user_settings SET theme = COALESCE($1, theme), language = COALESCE($2, language),
         notifications_enabled = COALESCE($3, notifications_enabled), email_notifications = COALESCE($4, email_notifications),
         default_model = COALESCE($5, default_model), default_temperature = COALESCE($6, default_temperature),
         default_max_tokens = COALESCE($7, default_max_tokens), timezone = COALESCE($8, timezone), updated_at = NOW()
         WHERE user_id = $9 RETURNING *`,
        [theme, language, notifications_enabled, email_notifications, default_model, default_temperature, default_max_tokens, timezone, req.user.id]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
