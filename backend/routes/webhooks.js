const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');

// Get all webhooks
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM webhooks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create webhook
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, url, events } = req.body;
    const secret = crypto.randomBytes(32).toString('hex');
    const result = await pool.query(
      'INSERT INTO webhooks (name, url, secret, events, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, url, secret, events || [], req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update webhook
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, url, events, is_active } = req.body;
    const result = await pool.query(
      `UPDATE webhooks SET name = COALESCE($1, name), url = COALESCE($2, url),
       events = COALESCE($3, events), is_active = COALESCE($4, is_active), updated_at = NOW()
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [name, url, events, is_active, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Webhook not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test webhook
router.post('/:id/test', authenticateToken, async (req, res) => {
  try {
    const webhook = await pool.query(
      'SELECT * FROM webhooks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (webhook.rows.length === 0) return res.status(404).json({ error: 'Webhook not found' });

    const w = webhook.rows[0];
    const payload = JSON.stringify({
      event: 'test',
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test webhook from Prompt Studio' },
    });
    const signature = crypto.createHmac('sha256', w.secret).update(payload).digest('hex');

    try {
      const response = await fetch(w.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
        },
        body: payload,
        signal: AbortSignal.timeout(10000),
      });
      await pool.query(
        'UPDATE webhooks SET last_triggered_at = NOW(), last_status_code = $1 WHERE id = $2',
        [response.status, req.params.id]
      );
      res.json({ success: response.ok, status: response.status });
    } catch (fetchErr) {
      await pool.query(
        'UPDATE webhooks SET failure_count = failure_count + 1 WHERE id = $1',
        [req.params.id]
      );
      res.json({ success: false, error: fetchErr.message });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete webhook
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM webhooks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Webhook deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Regenerate secret
router.post('/:id/regenerate-secret', authenticateToken, async (req, res) => {
  try {
    const secret = crypto.randomBytes(32).toString('hex');
    const result = await pool.query(
      'UPDATE webhooks SET secret = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [secret, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Webhook not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
