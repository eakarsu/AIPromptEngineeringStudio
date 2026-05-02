const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');
const router = express.Router();

const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

async function callOpenRouter(messages, opts = {}) {
  const response = await fetch(process.env.OPENROUTER_BASE_URL + '/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
      'X-Title': 'AI Prompt Engineering Studio',
    },
    body: JSON.stringify({
      model: opts.model || MODEL,
      messages,
      temperature: opts.temperature !== undefined ? opts.temperature : 0.7,
      max_tokens: opts.max_tokens || 2000,
    }),
  });
  if (!response.ok) throw new Error(`OpenRouter error: ${response.status} - ${await response.text()}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

function parseAIJson(text) {
  try { return JSON.parse(text); } catch {}
  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (block) { try { return JSON.parse(block[1].trim()); } catch {} }
  const s = text.search(/[{[]/);
  if (s !== -1) {
    const e = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
    if (e !== -1) { try { return JSON.parse(text.slice(s, e + 1)); } catch {} }
  }
  return null;
}

async function persistAiResult(user_id, endpoint, prompt_id, result, result_json) {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS ai_results (
      id SERIAL PRIMARY KEY, user_id INTEGER, endpoint VARCHAR(100),
      prompt_id INTEGER, result TEXT, result_json JSONB, created_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, prompt_id, result, result_json) VALUES ($1,$2,$3,$4,$5)`,
      [user_id, endpoint, prompt_id || null, result, result_json ? JSON.stringify(result_json) : null]
    );
  } catch {}
}

async function createPromptVersion(prompt_id, content, user_id, change_notes) {
  try {
    const maxVer = await pool.query(
      'SELECT COALESCE(MAX(version_number),0)+1 as next FROM prompt_versions WHERE prompt_id=$1',
      [prompt_id]
    );
    await pool.query(
      `INSERT INTO prompt_versions (prompt_id, version_number, content, change_notes, user_id) VALUES ($1,$2,$3,$4,$5)`,
      [prompt_id, maxVer.rows[0].next, content, change_notes || 'Auto-saved', user_id]
    );
  } catch {}
}

// Get all prompts (with pagination)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page, limit } = req.query;

    // No pagination params = backward compat (return all)
    if (!page && !limit) {
      const result = await pool.query(
        `SELECT pt.*, c.name as category_name, c.color as category_color
         FROM prompt_templates pt LEFT JOIN categories c ON pt.category_id=c.id
         WHERE pt.user_id=$1 ORDER BY pt.updated_at DESC`,
        [req.user.id]
      );
      return res.json(result.rows);
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    const result = await pool.query(
      `SELECT pt.*, c.name as category_name, c.color as category_color
       FROM prompt_templates pt LEFT JOIN categories c ON pt.category_id=c.id
       WHERE pt.user_id=$1 ORDER BY pt.updated_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limitNum, offset]
    );
    const count = await pool.query('SELECT COUNT(*) FROM prompt_templates WHERE user_id=$1', [req.user.id]);

    res.json({
      data: result.rows,
      page: pageNum,
      limit: limitNum,
      total: parseInt(count.rows[0].count),
      totalPages: Math.ceil(parseInt(count.rows[0].count) / limitNum),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single prompt
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pt.*, c.name as category_name, c.color as category_color
       FROM prompt_templates pt
       LEFT JOIN categories c ON pt.category_id = c.id
       WHERE pt.id = $1 AND pt.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Prompt not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create prompt
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, content, category_id, tags, model, temperature, max_tokens, status, is_public } = req.body;
    const result = await pool.query(
      `INSERT INTO prompt_templates (name, description, content, category_id, user_id, tags, model, temperature, max_tokens, status, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, description, content, category_id || null, req.user.id, tags || [], model || 'anthropic/claude-haiku-4.5', temperature || 0.7, max_tokens || 1024, status || 'draft', is_public || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update prompt (auto-creates version on save)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, content, category_id, tags, model, temperature, max_tokens, status, is_public } = req.body;

    // Get old content to check if changed
    const old = await pool.query('SELECT content FROM prompt_templates WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (old.rows.length === 0) return res.status(404).json({ error: 'Prompt not found' });

    const result = await pool.query(
      `UPDATE prompt_templates SET name=$1, description=$2, content=$3, category_id=$4, tags=$5, model=$6, temperature=$7, max_tokens=$8, status=$9, is_public=$10, updated_at=NOW()
       WHERE id=$11 AND user_id=$12 RETURNING *`,
      [name, description, content, category_id || null, tags || [], model, temperature, max_tokens, status, is_public, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Prompt not found' });

    // Auto-create version if content changed
    if (content && old.rows[0].content !== content) {
      await createPromptVersion(req.params.id, content, req.user.id, 'Auto-saved on update');
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete prompt
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM prompt_templates WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Prompt not found' });
    res.json({ message: 'Prompt deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/prompts/:id/versions - version history for a prompt
router.get('/:id/versions', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT pv.*, pt.name as prompt_name FROM prompt_versions pv
       LEFT JOIN prompt_templates pt ON pv.prompt_id=pt.id
       WHERE pv.prompt_id=$1 AND pv.user_id=$2
       ORDER BY pv.version_number DESC LIMIT $3 OFFSET $4`,
      [req.params.id, req.user.id, limit, offset]
    );
    const count = await pool.query('SELECT COUNT(*) FROM prompt_versions WHERE prompt_id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ data: result.rows, page, limit, total: parseInt(count.rows[0].count), totalPages: Math.ceil(parseInt(count.rows[0].count)/limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/prompts/:id/versions/:vid/restore - restore a version
router.post('/:id/versions/:vid/restore', authenticateToken, async (req, res) => {
  try {
    const version = await pool.query(
      'SELECT * FROM prompt_versions WHERE id=$1 AND prompt_id=$2 AND user_id=$3',
      [req.params.vid, req.params.id, req.user.id]
    );
    if (version.rows.length === 0) return res.status(404).json({ error: 'Version not found' });

    const result = await pool.query(
      `UPDATE prompt_templates SET content=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3 RETURNING *`,
      [version.rows[0].content, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Prompt not found' });

    // Create a new version for the restoration
    await createPromptVersion(req.params.id, version.rows[0].content, req.user.id, `Restored from version ${version.rows[0].version_number}`);

    res.json({ message: 'Version restored', prompt: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/prompts/:id/ab-test - real A/B auto-evaluator
router.post('/:id/ab-test', authenticateToken, async (req, res) => {
  try {
    const { variant_a, variant_b, test_input, num_runs } = req.body;
    const runs = Math.min(parseInt(num_runs) || 3, 5);

    if (!variant_a || !variant_b || !test_input) {
      return res.status(400).json({ error: 'variant_a, variant_b, and test_input are required' });
    }

    // Run each variant num_runs times
    const runVariant = async (prompt) => {
      const responses = [];
      for (let i = 0; i < runs; i++) {
        try {
          const r = await callOpenRouter(
            [{ role: 'user', content: `${prompt}\n\nInput: ${test_input}` }],
            { temperature: 0.7, max_tokens: 1000 }
          );
          responses.push(r);
        } catch {}
      }
      return responses;
    };

    const [responsesA, responsesB] = await Promise.all([runVariant(variant_a), runVariant(variant_b)]);

    // AI evaluator scores each set
    const evalSystem = `You are an expert AI output evaluator. Return ONLY valid JSON:
{"variant_a_scores":[{"run":1,"consistency":8,"quality":7,"helpfulness":9,"total":24}],"variant_b_scores":[{"run":1,"consistency":7,"quality":8,"helpfulness":8,"total":23}],"variant_a_avg":24,"variant_b_avg":23,"winner":"A","winner_reason":"string","statistical_summary":"string"}`;

    const evalPrompt = `Evaluate these ${runs} runs of each prompt variant on consistency (1-10), quality (1-10), helpfulness (1-10):

Test Input: ${test_input}

VARIANT A (${runs} runs):
${responsesA.map((r,i)=>`Run ${i+1}: ${r.slice(0,500)}`).join('\n\n')}

VARIANT B (${runs} runs):
${responsesB.map((r,i)=>`Run ${i+1}: ${r.slice(0,500)}`).join('\n\n')}`;

    const evalResponse = await callOpenRouter(
      [{ role: 'system', content: evalSystem }, { role: 'user', content: evalPrompt }],
      { temperature: 0.1, max_tokens: 2000 }
    );
    const parsed = parseAIJson(evalResponse);

    await persistAiResult(req.user.id, 'ab-test', req.params.id, evalResponse, parsed);

    res.json({
      responses_a: responsesA,
      responses_b: responsesB,
      evaluation: parsed,
      raw_evaluation: evalResponse,
      num_runs: runs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/prompts/:id/security-scan - injection vulnerability scanner
router.post('/:id/security-scan', authenticateToken, async (req, res) => {
  try {
    const prompt = await pool.query('SELECT * FROM prompt_templates WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (prompt.rows.length === 0) return res.status(404).json({ error: 'Prompt not found' });

    const { additional_context } = req.body;
    const promptContent = prompt.rows[0].content;

    const systemPrompt = `You are a security researcher specializing in LLM prompt security. Return ONLY valid JSON:
{"vulnerabilities":[{"type":"prompt_injection|jailbreak|pii_exposure|instruction_override|role_confusion","severity":"low|medium|high|critical","description":"string","example_attack":"string","fix":"string"}],"overall_risk":"low|medium|high|critical","risk_score":7,"safe_to_deploy":true,"recommendations":["string"]}`;

    const scanPrompt = `Analyze this AI prompt for security vulnerabilities including prompt injection, jailbreak vectors, PII exposure risks, and instruction override possibilities:

PROMPT:
${promptContent}

${additional_context ? `Additional context: ${additional_context}` : ''}

Act as a red-team security researcher. Be thorough in identifying all possible attack vectors.`;

    const aiResponse = await callOpenRouter(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: scanPrompt }],
      { temperature: 0.2, max_tokens: 2000 }
    );
    const parsed = parseAIJson(aiResponse);

    await persistAiResult(req.user.id, 'security-scan', req.params.id, aiResponse, parsed);

    res.json({ result: parsed, raw: aiResponse, prompt_name: prompt.rows[0].name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/prompts/check-pii - PII detector
router.post('/check-pii', authenticateToken, async (req, res) => {
  try {
    const { prompt_text } = req.body;
    if (!prompt_text) return res.status(400).json({ error: 'prompt_text is required' });

    const systemPrompt = `You are a PII detection expert. Return ONLY valid JSON:
{"pii_found":true,"pii_items":[{"type":"name|email|phone|ssn|credit_card|address|ip|dob|other","value":"detected value","position":"string","severity":"low|medium|high"}],"risk_level":"low|medium|high","anonymized_version":"string with [REDACTED] replacements","recommendations":["string"]}`;

    const aiResponse = await callOpenRouter(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Scan this text for PII:\n\n${prompt_text}` }],
      { temperature: 0.1, max_tokens: 2000 }
    );
    const parsed = parseAIJson(aiResponse);

    await persistAiResult(req.user.id, 'check-pii', null, aiResponse, parsed);

    res.json({ result: parsed, raw: aiResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/prompts/:id/deploy - deploy prompt as standalone API
router.post('/:id/deploy', authenticateToken, async (req, res) => {
  try {
    const { name, environment, rate_limit } = req.body;

    const prompt = await pool.query('SELECT * FROM prompt_templates WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (prompt.rows.length === 0) return res.status(404).json({ error: 'Prompt not found' });

    // Generate deployment key and HMAC secret
    const deploymentKey = crypto.randomBytes(24).toString('hex');
    const apiKey = 'psk_' + crypto.randomBytes(20).toString('hex');
    const hmacSecret = crypto.randomBytes(32).toString('hex');

    const deployName = name || `${prompt.rows[0].name} API`;
    const endpointUrl = `${process.env.CLIENT_URL || 'http://localhost:3001'}/api/deployed/${deploymentKey}`;

    // Ensure hmac_secret column exists
    await pool.query(`ALTER TABLE deployments ADD COLUMN IF NOT EXISTS hmac_secret VARCHAR(255)`);
    await pool.query(`ALTER TABLE deployments ADD COLUMN IF NOT EXISTS deployment_key VARCHAR(255) UNIQUE`);

    const result = await pool.query(
      `INSERT INTO deployments (name, prompt_id, environment, api_key, rate_limit, status, user_id, deployed_at, endpoint_url, hmac_secret, deployment_key)
       VALUES ($1,$2,$3,$4,$5,'active',$6,NOW(),$7,$8,$9) RETURNING *`,
      [deployName, req.params.id, environment || 'production', apiKey, rate_limit || 100, req.user.id, endpointUrl, hmacSecret, deploymentKey]
    );

    res.status(201).json({
      ...result.rows[0],
      api_key_plain: apiKey,
      hmac_secret,
      endpoint_url: endpointUrl,
      deployment_key: deploymentKey,
      curl_example: `curl -X POST "${endpointUrl}" \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"input": "your input here"}'`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
