const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: '../.env' });
const { initDB } = require('./db');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// AI rate limiter: 20 req/hour keyed by user ID or IP
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return `user_${decoded.id}`;
      } catch {}
    }
    return req.ip;
  },
  message: { error: 'Too many AI requests. Limit is 20 per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply AI rate limiter to all AI routes
app.use('/api/ai', aiRateLimiter);
app.use(/^\/api\/prompts\/\d+\/(ab-test|security-scan|deploy)/, aiRateLimiter);
app.use('/api/prompts/check-pii', aiRateLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/prompts', require('./routes/prompts'));
app.use('/api/templates', require('./routes/templates'));
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

// Public deployed prompt endpoint (no auth - uses API key in header)
const { pool } = require('./db');
const crypto = require('crypto');

const MODEL_DEPLOYED = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

app.post('/api/deployed/:deploymentKey', async (req, res) => {
  try {
    const { deploymentKey } = req.params;
    const { input } = req.body;

    const authHeader = req.headers['authorization'];
    const providedKey = authHeader && authHeader.replace('Bearer ', '');

    if (!input) return res.status(400).json({ error: 'input is required' });

    // Lookup deployment
    await pool.query(`ALTER TABLE deployments ADD COLUMN IF NOT EXISTS deployment_key VARCHAR(255)`);
    await pool.query(`ALTER TABLE deployments ADD COLUMN IF NOT EXISTS hmac_secret VARCHAR(255)`);

    const dep = await pool.query(
      `SELECT d.*, pt.content as prompt_content, pt.model, pt.temperature, pt.max_tokens
       FROM deployments d LEFT JOIN prompt_templates pt ON d.prompt_id=pt.id
       WHERE d.deployment_key=$1 AND d.status='active'`,
      [deploymentKey]
    );

    if (dep.rows.length === 0) return res.status(404).json({ error: 'Deployment not found or inactive' });
    const deployment = dep.rows[0];

    // Validate X-Signature HMAC if provided
    const xSig = req.headers['x-signature'];
    if (xSig && deployment.hmac_secret) {
      const expectedSig = crypto.createHmac('sha256', deployment.hmac_secret).update(JSON.stringify(req.body)).digest('hex');
      if (xSig !== `sha256=${expectedSig}`) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Validate API key
    if (providedKey !== deployment.api_key) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Run prompt
    const startTime = Date.now();
    const promptText = deployment.prompt_content.replace(/\{\{input\}\}/g, input).replace(/\{\{user_input\}\}/g, input);

    const aiRes = await fetch(process.env.OPENROUTER_BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
        'X-Title': 'AI Prompt Engineering Studio',
      },
      body: JSON.stringify({
        model: deployment.model || MODEL_DEPLOYED,
        messages: [{ role: 'user', content: promptText }],
        temperature: parseFloat(deployment.temperature) || 0.7,
        max_tokens: deployment.max_tokens || 1024,
      }),
    });

    if (!aiRes.ok) throw new Error(`AI error: ${aiRes.status}`);
    const aiData = await aiRes.json();
    const output = aiData.choices[0].message.content;
    const latency = Date.now() - startTime;

    // Update stats
    await pool.query(
      `UPDATE deployments SET total_requests=total_requests+1, avg_latency_ms=$1, updated_at=NOW() WHERE deployment_key=$2`,
      [latency, deploymentKey]
    );

    res.json({ output, latency_ms: latency, deployment_name: deployment.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard stats
const { authenticateToken } = require('./middleware/auth');

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

// AI feature mount: regression-test
app.use('/api/ai/regression-test', require('./routes/ai-regression-test'));
// === Batch 07 Gaps & Frontend Mounts ===
app.use('/api/gap-no-ai-prompt-classification-autotag-by-domai', require('./routes/gap-no-ai-prompt-classification-autotag-by-domai'));
app.use('/api/gap-no-multilanguage-prompt-translation', require('./routes/gap-no-multilanguage-prompt-translation'));
app.use('/api/gap-no-ai-piiinjection-security-scanning-ui-stub', require('./routes/gap-no-ai-piiinjection-security-scanning-ui-stub'));
app.use('/api/gap-no-ai-regression-testing-against-golden-outp', require('./routes/gap-no-ai-regression-testing-against-golden-outp'));
app.use('/api/gap-no-ai-modelspecific-prompt-rewriter-claude-v', require('./routes/gap-no-ai-modelspecific-prompt-rewriter-claude-v'));
app.use('/api/gap-no-public-prompt-marketplace-discovery-forki', require('./routes/gap-no-public-prompt-marketplace-discovery-forki'));
app.use('/api/gap-no-production-model-registry-beyond-deployme', require('./routes/gap-no-production-model-registry-beyond-deployme'));
app.use('/api/gap-limited-realtime-collaborative-editing-no-cr', require('./routes/gap-limited-realtime-collaborative-editing-no-cr'));
app.use('/api/gap-no-gitstyle-visual-diff-for-prompt-versions', require('./routes/gap-no-gitstyle-visual-diff-for-prompt-versions'));
app.use('/api/gap-no-ssoenterprise-auth-provider-integration', require('./routes/gap-no-ssoenterprise-auth-provider-integration'));
// === End Batch 07 ===
