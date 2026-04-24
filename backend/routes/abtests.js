const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ab.*, pa.name as prompt_a_name, pb.name as prompt_b_name
       FROM ab_tests ab
       LEFT JOIN prompt_templates pa ON ab.prompt_a_id = pa.id
       LEFT JOIN prompt_templates pb ON ab.prompt_b_id = pb.id
       WHERE ab.user_id = $1 ORDER BY ab.created_at DESC`,
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
      `SELECT ab.*, pa.name as prompt_a_name, pa.content as prompt_a_content,
              pb.name as prompt_b_name, pb.content as prompt_b_content
       FROM ab_tests ab
       LEFT JOIN prompt_templates pa ON ab.prompt_a_id = pa.id
       LEFT JOIN prompt_templates pb ON ab.prompt_b_id = pb.id
       WHERE ab.id = $1 AND ab.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'A/B test not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, prompt_a_id, prompt_b_id, test_input, evaluation_criteria } = req.body;
    const result = await pool.query(
      `INSERT INTO ab_tests (name, description, prompt_a_id, prompt_b_id, test_input, evaluation_criteria, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description, prompt_a_id, prompt_b_id, test_input, evaluation_criteria, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, prompt_a_id, prompt_b_id, status, winner, test_input, evaluation_criteria } = req.body;
    const result = await pool.query(
      `UPDATE ab_tests SET name=$1, description=$2, prompt_a_id=$3, prompt_b_id=$4, status=$5, winner=$6, test_input=$7, evaluation_criteria=$8, updated_at=NOW()
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [name, description, prompt_a_id, prompt_b_id, status, winner, test_input, evaluation_criteria, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'A/B test not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM ab_tests WHERE id=$1 AND user_id=$2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'A/B test not found' });
    res.json({ message: 'A/B test deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
