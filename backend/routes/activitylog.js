const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get activity log
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { entity_type, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT * FROM activity_log WHERE user_id = $1';
    const params = [req.user.id];
    if (entity_type) {
      params.push(entity_type);
      query += ` AND entity_type = $${params.length}`;
    }
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    const result = await pool.query(query, params);
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM activity_log WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ activities: result.rows, total: parseInt(countResult.rows[0].total) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log activity
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { action, entity_type, entity_id, entity_name, details } = req.body;
    const result = await pool.query(
      `INSERT INTO activity_log (user_id, action, entity_type, entity_id, entity_name, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, action, entity_type, entity_id, entity_name, details || {}, req.ip]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get activity stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [today, week, byType, byAction] = await Promise.all([
      pool.query(
        "SELECT COUNT(*) as count FROM activity_log WHERE user_id = $1 AND created_at >= CURRENT_DATE",
        [req.user.id]
      ),
      pool.query(
        "SELECT COUNT(*) as count FROM activity_log WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'",
        [req.user.id]
      ),
      pool.query(
        'SELECT entity_type, COUNT(*) as count FROM activity_log WHERE user_id = $1 GROUP BY entity_type ORDER BY count DESC',
        [req.user.id]
      ),
      pool.query(
        'SELECT action, COUNT(*) as count FROM activity_log WHERE user_id = $1 GROUP BY action ORDER BY count DESC LIMIT 10',
        [req.user.id]
      ),
    ]);
    res.json({
      today: parseInt(today.rows[0].count),
      this_week: parseInt(week.rows[0].count),
      by_type: byType.rows,
      by_action: byAction.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear activity log
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM activity_log WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Activity log cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
