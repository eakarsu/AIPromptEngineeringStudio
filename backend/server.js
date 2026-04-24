const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });
const { initDB } = require('./db');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/prompts', require('./routes/prompts'));
app.use('/api/versions', require('./routes/versions'));
app.use('/api/ab-tests', require('./routes/abtests'));
app.use('/api/optimization', require('./routes/optimization'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/library', require('./routes/library'));
app.use('/api/variables', require('./routes/variables'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/chains', require('./routes/chains'));
app.use('/api/evaluations', require('./routes/evaluations'));
app.use('/api/costs', require('./routes/costs'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/playground', require('./routes/playground'));
app.use('/api/deployments', require('./routes/deployments'));
app.use('/api/exports', require('./routes/exports'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/search', require('./routes/search'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/activity', require('./routes/activitylog'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/trash', require('./routes/trash'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/api-keys', require('./routes/apikeys'));
app.use('/api/folders', require('./routes/folders'));
app.use('/api/snippets', require('./routes/snippets'));

// Dashboard stats
const { authenticateToken } = require('./middleware/auth');
const { pool } = require('./db');

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [prompts, tests, deployments, costs, versions, chains, evaluations, library, categories, variables, teams, playground, exports, analytics, optimization, favorites, folders, snippets, tags, webhooks, apiKeys, comments, notifications, activities] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM prompt_templates WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM ab_tests WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM deployments WHERE user_id = $1', [userId]),
      pool.query('SELECT COALESCE(SUM(total_cost), 0) as total FROM cost_tracking WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM prompt_versions WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM prompt_chains WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM evaluations WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM prompt_library WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM categories WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM variables WHERE user_id = $1', [userId]),
      pool.query("SELECT COUNT(*) as count FROM teams WHERE owner_id = $1 OR id IN (SELECT team_id FROM team_members WHERE user_id = $1)", [userId]),
      pool.query('SELECT COUNT(*) as count FROM playground_sessions WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM export_import_jobs WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM analytics WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM optimization_jobs WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM favorites WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM folders WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM snippets WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM tags WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM webhooks WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM api_keys WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM comments WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false', [userId]),
      pool.query('SELECT COUNT(*) as count FROM activity_log WHERE user_id = $1', [userId]),
    ]);
    const costsCount = await pool.query('SELECT COUNT(*) as count FROM cost_tracking WHERE user_id = $1', [userId]);
    res.json({
      prompts: parseInt(prompts.rows[0].count),
      ab_tests: parseInt(tests.rows[0].count),
      deployments: parseInt(deployments.rows[0].count),
      total_cost: parseFloat(costs.rows[0].total),
      versions: parseInt(versions.rows[0].count),
      chains: parseInt(chains.rows[0].count),
      evaluations: parseInt(evaluations.rows[0].count),
      library: parseInt(library.rows[0].count),
      categories: parseInt(categories.rows[0].count),
      variables: parseInt(variables.rows[0].count),
      teams: parseInt(teams.rows[0].count),
      playground: parseInt(playground.rows[0].count),
      exports: parseInt(exports.rows[0].count),
      analytics: parseInt(analytics.rows[0].count),
      optimization: parseInt(optimization.rows[0].count),
      costs: parseInt(costsCount.rows[0].count),
      favorites: parseInt(favorites.rows[0].count),
      folders: parseInt(folders.rows[0].count),
      snippets: parseInt(snippets.rows[0].count),
      tags: parseInt(tags.rows[0].count),
      webhooks: parseInt(webhooks.rows[0].count),
      api_keys: parseInt(apiKeys.rows[0].count),
      comments: parseInt(comments.rows[0].count),
      unread_notifications: parseInt(notifications.rows[0].count),
      activities: parseInt(activities.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const start = async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
