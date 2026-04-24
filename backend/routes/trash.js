const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get all trashed items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM trash WHERE user_id = $1 ORDER BY deleted_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Move item to trash
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { entity_type, entity_id } = req.body;
    let entityData, entityName;
    const tableMap = {
      prompt: 'prompt_templates',
      chain: 'prompt_chains',
      snippet: 'snippets',
      folder: 'folders',
      variable: 'variables',
    };
    const nameMap = {
      prompt: 'name',
      chain: 'name',
      snippet: 'title',
      folder: 'name',
      variable: 'name',
    };
    const table = tableMap[entity_type];
    if (!table) return res.status(400).json({ error: 'Invalid entity type' });

    const entity = await pool.query(`SELECT * FROM ${table} WHERE id = $1 AND user_id = $2`, [entity_id, req.user.id]);
    if (entity.rows.length === 0) return res.status(404).json({ error: 'Entity not found' });

    entityData = entity.rows[0];
    entityName = entityData[nameMap[entity_type]];

    // Save to trash
    const result = await pool.query(
      'INSERT INTO trash (entity_type, entity_id, entity_name, entity_data, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [entity_type, entity_id, entityName, JSON.stringify(entityData), req.user.id]
    );

    // Delete from original table
    await pool.query(`DELETE FROM ${table} WHERE id = $1 AND user_id = $2`, [entity_id, req.user.id]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore item from trash
router.post('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const trashItem = await pool.query(
      'SELECT * FROM trash WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (trashItem.rows.length === 0) return res.status(404).json({ error: 'Trash item not found' });

    const item = trashItem.rows[0];
    const data = item.entity_data;
    const tableMap = {
      prompt: 'prompt_templates',
      chain: 'prompt_chains',
      snippet: 'snippets',
      folder: 'folders',
      variable: 'variables',
    };
    const table = tableMap[item.entity_type];
    if (!table) return res.status(400).json({ error: 'Cannot restore this entity type' });

    // Re-insert (without id to get new id)
    const columns = Object.keys(data).filter(k => k !== 'id');
    const values = columns.map(k => data[k]);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    await pool.query(
      `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders.join(',')})`,
      values
    );

    // Remove from trash
    await pool.query('DELETE FROM trash WHERE id = $1', [req.params.id]);

    res.json({ message: `${item.entity_type} restored successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Permanently delete from trash
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM trash WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Empty trash
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM trash WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Trash emptied' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
