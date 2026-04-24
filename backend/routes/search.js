const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Global search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { q, type } = req.query;
    if (!q || q.trim().length < 2) return res.json({ results: [] });
    const searchTerm = `%${q.trim().toLowerCase()}%`;
    const userId = req.user.id;
    const results = {};

    if (!type || type === 'prompts') {
      const prompts = await pool.query(
        `SELECT id, name, description, 'prompt' as type, status, created_at
         FROM prompt_templates WHERE user_id = $1
         AND (LOWER(name) LIKE $2 OR LOWER(description) LIKE $2 OR LOWER(content) LIKE $2)
         ORDER BY updated_at DESC LIMIT 10`,
        [userId, searchTerm]
      );
      results.prompts = prompts.rows;
    }

    if (!type || type === 'categories') {
      const categories = await pool.query(
        `SELECT id, name, description, 'category' as type, created_at
         FROM categories WHERE user_id = $1
         AND (LOWER(name) LIKE $2 OR LOWER(description) LIKE $2)
         ORDER BY name LIMIT 10`,
        [userId, searchTerm]
      );
      results.categories = categories.rows;
    }

    if (!type || type === 'chains') {
      const chains = await pool.query(
        `SELECT id, name, description, 'chain' as type, status, created_at
         FROM prompt_chains WHERE user_id = $1
         AND (LOWER(name) LIKE $2 OR LOWER(description) LIKE $2)
         ORDER BY updated_at DESC LIMIT 10`,
        [userId, searchTerm]
      );
      results.chains = chains.rows;
    }

    if (!type || type === 'teams') {
      const teams = await pool.query(
        `SELECT id, name, description, 'team' as type, created_at
         FROM teams WHERE owner_id = $1
         AND (LOWER(name) LIKE $2 OR LOWER(description) LIKE $2)
         ORDER BY name LIMIT 10`,
        [userId, searchTerm]
      );
      results.teams = teams.rows;
    }

    if (!type || type === 'snippets') {
      const snippets = await pool.query(
        `SELECT id, title as name, description, 'snippet' as type, created_at
         FROM snippets WHERE user_id = $1
         AND (LOWER(title) LIKE $2 OR LOWER(content) LIKE $2 OR LOWER(description) LIKE $2)
         ORDER BY updated_at DESC LIMIT 10`,
        [userId, searchTerm]
      );
      results.snippets = snippets.rows;
    }

    if (!type || type === 'variables') {
      const variables = await pool.query(
        `SELECT id, name, description, 'variable' as type, created_at
         FROM variables WHERE user_id = $1
         AND (LOWER(name) LIKE $2 OR LOWER(description) LIKE $2)
         ORDER BY name LIMIT 10`,
        [userId, searchTerm]
      );
      results.variables = variables.rows;
    }

    res.json({ query: q, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
