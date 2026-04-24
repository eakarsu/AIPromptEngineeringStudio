const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name as owner_name FROM teams t
       LEFT JOIN users u ON t.owner_id = u.id
       WHERE t.owner_id = $1
       OR t.id IN (SELECT team_id FROM team_members WHERE user_id = $1)
       ORDER BY t.created_at DESC`,
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
      `SELECT t.*, u.name as owner_name FROM teams t
       LEFT JOIN users u ON t.owner_id = u.id WHERE t.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Team not found' });
    const members = await pool.query(
      `SELECT tm.*, u.name, u.email FROM team_members tm
       LEFT JOIN users u ON tm.user_id = u.id WHERE tm.team_id = $1`,
      [req.params.id]
    );
    res.json({ ...result.rows[0], members: members.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, plan } = req.body;
    const result = await pool.query(
      `INSERT INTO teams (name, description, owner_id, plan) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description, req.user.id, plan || 'free']
    );
    await pool.query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
      [result.rows[0].id, req.user.id, 'owner']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, plan } = req.body;
    const result = await pool.query(
      `UPDATE teams SET name=$1, description=$2, plan=$3, updated_at=NOW()
       WHERE id=$4 AND owner_id=$5 RETURNING *`,
      [name, description, plan, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Team not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM teams WHERE id=$1 AND owner_id=$2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Team not found' });
    res.json({ message: 'Team deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
