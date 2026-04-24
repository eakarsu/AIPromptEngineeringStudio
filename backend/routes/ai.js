const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const callOpenRouter = async (messages, options = {}) => {
  const response = await fetch(process.env.OPENROUTER_BASE_URL + '/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AI Prompt Engineering Studio'
    },
    body: JSON.stringify({
      model: options.model || process.env.OPENROUTER_MODEL,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1024,
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
  }

  return await response.json();
};

// Playground - Run prompt
router.post('/playground/run', authenticateToken, async (req, res) => {
  try {
    const { prompt_text, system_prompt, model, temperature, max_tokens, session_id } = req.body;
    const startTime = Date.now();

    const messages = [];
    if (system_prompt) messages.push({ role: 'system', content: system_prompt });
    messages.push({ role: 'user', content: prompt_text });

    const aiResponse = await callOpenRouter(messages, { model, temperature, max_tokens });
    const latency = Date.now() - startTime;
    const responseText = aiResponse.choices?.[0]?.message?.content || '';
    const tokensUsed = aiResponse.usage?.total_tokens || 0;
    const inputTokens = aiResponse.usage?.prompt_tokens || 0;
    const outputTokens = aiResponse.usage?.completion_tokens || 0;
    const cost = (inputTokens * 0.00001 + outputTokens * 0.00005);

    if (session_id) {
      await pool.query(
        `UPDATE playground_sessions SET response_text=$1, tokens_used=$2, latency_ms=$3, cost=$4, updated_at=NOW() WHERE id=$5 AND user_id=$6`,
        [responseText, tokensUsed, latency, cost, session_id, req.user.id]
      );
    }

    // Track cost
    await pool.query(
      `INSERT INTO cost_tracking (model, input_tokens, output_tokens, total_cost, request_type, user_id)
       VALUES ($1, $2, $3, $4, 'playground', $5)`,
      [model || process.env.OPENROUTER_MODEL, inputTokens, outputTokens, cost, req.user.id]
    );

    // Track analytics
    await pool.query(
      `INSERT INTO analytics (metric_type, metric_value, tokens_used, latency_ms, cost, model, success, user_id)
       VALUES ('playground_run', $1, $2, $3, $4, $5, true, $6)`,
      [tokensUsed, tokensUsed, latency, cost, model || process.env.OPENROUTER_MODEL, req.user.id]
    );

    res.json({
      response: responseText,
      usage: aiResponse.usage,
      model: aiResponse.model,
      latency_ms: latency,
      cost,
      raw_response: aiResponse
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optimize prompt
router.post('/optimize', authenticateToken, async (req, res) => {
  try {
    const { prompt, optimization_type, job_id } = req.body;
    const startTime = Date.now();

    const systemPrompt = `You are an expert prompt engineer. Your task is to optimize the given prompt for better results.

Optimization type: ${optimization_type || 'general'}

Provide your response in this exact format:
**Optimized Prompt:**
[The improved prompt]

**Changes Made:**
- [Change 1]
- [Change 2]
- [Change 3]

**Improvement Score:** [Score out of 100]

**Explanation:**
[Why these changes improve the prompt]

**Additional Suggestions:**
- [Suggestion 1]
- [Suggestion 2]`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please optimize this prompt:\n\n${prompt}` }
    ];

    const aiResponse = await callOpenRouter(messages, { temperature: 0.3, max_tokens: 2048 });
    const latency = Date.now() - startTime;
    const responseText = aiResponse.choices?.[0]?.message?.content || '';
    const tokensUsed = aiResponse.usage?.total_tokens || 0;

    if (job_id) {
      await pool.query(
        `UPDATE optimization_jobs SET optimized_prompt=$1, ai_feedback=$2, status='completed', improvement_score=$3, updated_at=NOW()
         WHERE id=$4 AND user_id=$5`,
        [responseText, responseText, 85, job_id, req.user.id]
      );
    }

    res.json({
      response: responseText,
      usage: aiResponse.usage,
      model: aiResponse.model,
      latency_ms: latency,
      raw_response: aiResponse
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Evaluate output
router.post('/evaluate', authenticateToken, async (req, res) => {
  try {
    const { prompt, output, criteria, evaluation_id } = req.body;
    const startTime = Date.now();

    const systemPrompt = `You are an expert AI output evaluator. Evaluate the given AI output based on the prompt that generated it.

Evaluation criteria: ${criteria || 'relevance, accuracy, completeness, clarity, creativity'}

Provide your evaluation in this exact format:
**Overall Score:** [Score out of 100]

**Category Scores:**
- Relevance: [Score]/100
- Accuracy: [Score]/100
- Completeness: [Score]/100
- Clarity: [Score]/100
- Creativity: [Score]/100

**Strengths:**
- [Strength 1]
- [Strength 2]

**Weaknesses:**
- [Weakness 1]
- [Weakness 2]

**Recommendations:**
- [Recommendation 1]
- [Recommendation 2]`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Prompt: ${prompt}\n\nOutput to evaluate: ${output}` }
    ];

    const aiResponse = await callOpenRouter(messages, { temperature: 0.2, max_tokens: 2048 });
    const latency = Date.now() - startTime;
    const responseText = aiResponse.choices?.[0]?.message?.content || '';

    if (evaluation_id) {
      await pool.query(
        `UPDATE evaluations SET ai_analysis=$1, status='completed', updated_at=NOW()
         WHERE id=$2 AND user_id=$3`,
        [responseText, evaluation_id, req.user.id]
      );
    }

    res.json({
      response: responseText,
      usage: aiResponse.usage,
      model: aiResponse.model,
      latency_ms: latency,
      raw_response: aiResponse
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// A/B Test - Run comparison
router.post('/ab-test/run', authenticateToken, async (req, res) => {
  try {
    const { prompt_a, prompt_b, test_input, test_id } = req.body;
    const startTime = Date.now();

    const [responseA, responseB] = await Promise.all([
      callOpenRouter([
        { role: 'user', content: `${prompt_a}\n\nInput: ${test_input}` }
      ]),
      callOpenRouter([
        { role: 'user', content: `${prompt_b}\n\nInput: ${test_input}` }
      ])
    ]);

    const outputA = responseA.choices?.[0]?.message?.content || '';
    const outputB = responseB.choices?.[0]?.message?.content || '';

    // Ask AI to judge
    const judgeResponse = await callOpenRouter([
      { role: 'system', content: 'You are an impartial judge comparing two AI outputs. Evaluate both and determine which is better. Respond with your analysis.' },
      { role: 'user', content: `Test Input: ${test_input}\n\n**Output A:**\n${outputA}\n\n**Output B:**\n${outputB}\n\nWhich output is better and why? Provide scores for each (0-100).` }
    ], { temperature: 0.1 });

    const judgeText = judgeResponse.choices?.[0]?.message?.content || '';
    const latency = Date.now() - startTime;

    if (test_id) {
      await pool.query(
        `UPDATE ab_tests SET total_runs = total_runs + 1, status='completed', updated_at=NOW()
         WHERE id=$1 AND user_id=$2`,
        [test_id, req.user.id]
      );
    }

    res.json({
      output_a: outputA,
      output_b: outputB,
      judge_analysis: judgeText,
      latency_ms: latency,
      usage_a: responseA.usage,
      usage_b: responseB.usage
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chain execution
router.post('/chain/run', authenticateToken, async (req, res) => {
  try {
    const { steps, chain_id } = req.body;
    const results = [];
    let previousOutput = '';
    const startTime = Date.now();

    for (const step of steps) {
      const promptWithContext = previousOutput
        ? `Previous step output: ${previousOutput}\n\n${step.prompt}`
        : step.prompt;

      const response = await callOpenRouter([
        { role: 'system', content: step.system_prompt || 'You are a helpful assistant.' },
        { role: 'user', content: promptWithContext }
      ], { temperature: step.temperature || 0.7 });

      const output = response.choices?.[0]?.message?.content || '';
      results.push({
        step_name: step.name,
        input: promptWithContext,
        output,
        usage: response.usage
      });
      previousOutput = output;
    }

    const latency = Date.now() - startTime;

    if (chain_id) {
      await pool.query(
        `UPDATE prompt_chains SET execution_count = execution_count + 1, last_output=$1, avg_duration_ms=$2, status='completed', updated_at=NOW()
         WHERE id=$3 AND user_id=$4`,
        [previousOutput, latency, chain_id, req.user.id]
      );
    }

    res.json({ results, latency_ms: latency, final_output: previousOutput });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate prompt from description
router.post('/generate-prompt', authenticateToken, async (req, res) => {
  try {
    const { description, use_case, tone } = req.body;

    const messages = [
      { role: 'system', content: 'You are an expert prompt engineer. Generate a high-quality, well-structured prompt template based on the user description. Include placeholders using {{variable_name}} syntax where appropriate.' },
      { role: 'user', content: `Create a prompt template for: ${description}\nUse case: ${use_case || 'general'}\nTone: ${tone || 'professional'}` }
    ];

    const aiResponse = await callOpenRouter(messages, { temperature: 0.5, max_tokens: 2048 });
    const responseText = aiResponse.choices?.[0]?.message?.content || '';

    res.json({
      response: responseText,
      usage: aiResponse.usage,
      model: aiResponse.model,
      raw_response: aiResponse
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
