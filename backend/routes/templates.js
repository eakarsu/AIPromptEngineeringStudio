const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Curated template library
const TEMPLATES = [
  {
    id: 't1', category: 'writing', name: 'Blog Post Writer',
    description: 'Write engaging blog posts on any topic',
    content: 'Write a comprehensive blog post about {{topic}}. Include an engaging introduction, 3-5 main sections with subheadings, practical examples, and a compelling conclusion. Tone: {{tone||professional}}. Target audience: {{audience||general}}.',
    tags: ['writing', 'blog', 'content'],
    difficulty: 'beginner',
  },
  {
    id: 't2', category: 'writing', name: 'Email Composer',
    description: 'Craft professional emails for any situation',
    content: 'Write a professional email for the following situation: {{situation}}. Recipient: {{recipient}}. Goal of the email: {{goal}}. Tone: {{tone||formal}}. Keep it concise and clear.',
    tags: ['writing', 'email', 'business'],
    difficulty: 'beginner',
  },
  {
    id: 't3', category: 'coding', name: 'Code Reviewer',
    description: 'Review code for bugs, security, and best practices',
    content: 'Review the following {{language}} code for bugs, security vulnerabilities, performance issues, and adherence to best practices. Provide specific suggestions for improvement:\n\n```{{language}}\n{{code}}\n```',
    tags: ['coding', 'review', 'security'],
    difficulty: 'intermediate',
  },
  {
    id: 't4', category: 'coding', name: 'Function Generator',
    description: 'Generate functions from natural language descriptions',
    content: 'Write a {{language}} function that {{description}}. Include: type hints/annotations, error handling, docstring/comments, and example usage. Follow {{language}} best practices and conventions.',
    tags: ['coding', 'generation', 'function'],
    difficulty: 'intermediate',
  },
  {
    id: 't5', category: 'analysis', name: 'Data Analyst',
    description: 'Analyze data and extract insights',
    content: 'Analyze the following data and provide insights:\n\n{{data}}\n\nProvide: 1) Key patterns and trends, 2) Anomalies or outliers, 3) Statistical summary, 4) Actionable recommendations, 5) Visualization suggestions.',
    tags: ['analysis', 'data', 'insights'],
    difficulty: 'intermediate',
  },
  {
    id: 't6', category: 'analysis', name: 'Competitive Analysis',
    description: 'Analyze competitors and market positioning',
    content: 'Perform a competitive analysis for {{company}} in the {{industry}} industry. Analyze: strengths, weaknesses, market positioning, unique value propositions, pricing strategy, target audience. Compare against competitors: {{competitors||top 3 competitors}}.',
    tags: ['analysis', 'business', 'strategy'],
    difficulty: 'advanced',
  },
  {
    id: 't7', category: 'roleplay', name: 'Expert Consultant',
    description: 'Simulate expert consultations in any domain',
    content: 'You are an expert {{role}} with 20+ years of experience in {{domain}}. I will ask you questions and you will provide expert advice, insights, and recommendations based on your deep knowledge. Stay in character and provide specific, actionable guidance. Do not give generic advice.',
    tags: ['roleplay', 'expert', 'consultation'],
    difficulty: 'intermediate',
  },
  {
    id: 't8', category: 'roleplay', name: 'Socratic Teacher',
    description: 'Learn through Socratic questioning method',
    content: 'You are a Socratic teacher helping me understand {{topic}}. Guide me through the concepts using questions rather than direct explanations. Start by assessing my current understanding, then progressively build up through guided questions. My goal: {{learning_goal||deep understanding}}.',
    tags: ['roleplay', 'education', 'teaching'],
    difficulty: 'intermediate',
  },
  {
    id: 't9', category: 'writing', name: 'Story Generator',
    description: 'Generate creative stories with rich narratives',
    content: 'Write a {{genre}} short story with the following elements:\n- Main character: {{protagonist}}\n- Setting: {{setting}}\n- Core conflict: {{conflict}}\n- Theme: {{theme||redemption}}\n- Tone: {{tone||engaging}}\n- Length: {{length||medium (~800 words)}}\nCreate vivid descriptions and compelling dialogue.',
    tags: ['writing', 'creative', 'fiction'],
    difficulty: 'intermediate',
  },
  {
    id: 't10', category: 'analysis', name: 'Document Summarizer',
    description: 'Summarize long documents into key points',
    content: 'Summarize the following document in a structured format:\n\n{{document}}\n\nProvide:\n1. Executive Summary (2-3 sentences)\n2. Key Points (bullet list)\n3. Important Data/Statistics\n4. Action Items or Recommendations\n5. Open Questions\n\nTarget audience: {{audience||executive}}',
    tags: ['analysis', 'summary', 'productivity'],
    difficulty: 'beginner',
  },
  {
    id: 't11', category: 'coding', name: 'API Documentation Writer',
    description: 'Generate comprehensive API documentation',
    content: 'Generate comprehensive API documentation for the following endpoint or codebase:\n\n{{code_or_description}}\n\nInclude: Overview, Authentication, Endpoints (method, path, params, request body, response), Error codes, Rate limits, and code examples in {{languages||JavaScript, Python}}.',
    tags: ['coding', 'documentation', 'api'],
    difficulty: 'intermediate',
  },
  {
    id: 't12', category: 'analysis', name: 'SWOT Analysis',
    description: 'Generate detailed SWOT analysis',
    content: 'Create a comprehensive SWOT analysis for {{subject}} (company/product/strategy/idea):\n\nContext: {{context}}\n\nProvide Strengths, Weaknesses, Opportunities, and Threats. For each item include: specific examples, impact level (high/medium/low), and strategic implications. End with 3 strategic recommendations.',
    tags: ['analysis', 'strategy', 'business'],
    difficulty: 'intermediate',
  },
];

// GET /api/templates - returns curated templates by category
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, page, limit } = req.query;
    let filtered = TEMPLATES;

    if (category && category !== 'all') {
      filtered = TEMPLATES.filter(t => t.category === category);
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(offset, offset + limitNum);

    const categories = [...new Set(TEMPLATES.map(t => t.category))];

    res.json({
      data: paginated,
      categories,
      page: pageNum,
      limit: limitNum,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limitNum),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/templates/:id/fork - copy template to user's prompts
router.post('/:id/fork', authenticateToken, async (req, res) => {
  try {
    const template = TEMPLATES.find(t => t.id === req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const result = await pool.query(
      `INSERT INTO prompt_templates (name, description, content, user_id, tags, model, temperature, max_tokens, status, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', false) RETURNING *`,
      [
        `${template.name} (forked)`,
        template.description,
        template.content,
        req.user.id,
        template.tags,
        'anthropic/claude-3-5-sonnet-20241022',
        0.7,
        1024,
      ]
    );

    // Create initial version
    await pool.query(
      `INSERT INTO prompt_versions (prompt_id, version_number, content, change_notes, user_id) VALUES ($1,1,$2,'Forked from template library',$3)`,
      [result.rows[0].id, template.content, req.user.id]
    );

    res.status(201).json({ message: 'Template forked successfully', prompt: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
