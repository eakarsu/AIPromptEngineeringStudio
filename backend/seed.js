const bcrypt = require('bcryptjs');
const { pool, initDB } = require('./db');
require('dotenv').config({ path: '../.env' });

const seed = async () => {
  try {
    await initDB();

    // Clear existing data
    await pool.query(`
      TRUNCATE users, categories, prompt_templates, prompt_versions, ab_tests,
      optimization_jobs, analytics, prompt_library, variables, teams, team_members,
      prompt_chains, evaluations, cost_tracking, playground_sessions, deployments,
      export_import_jobs CASCADE;
    `);

    // Create admin user
    const hashedPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 10);
    const userResult = await pool.query(
      `INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id`,
      [process.env.DEFAULT_ADMIN_EMAIL || 'admin@promptstudio.com', hashedPassword, 'Admin User', 'admin']
    );
    const userId = userResult.rows[0].id;

    // ========== CATEGORIES (15+) ==========
    const categories = [
      ['Content Writing', 'Prompts for blog posts, articles, and content creation', '#6366f1', 'edit'],
      ['Code Generation', 'Programming and code-related prompts', '#10b981', 'code'],
      ['Data Analysis', 'Prompts for analyzing and interpreting data', '#f59e0b', 'chart'],
      ['Customer Support', 'Customer service and support prompts', '#ef4444', 'headset'],
      ['Marketing', 'Marketing copy, ads, and campaign prompts', '#8b5cf6', 'megaphone'],
      ['Education', 'Teaching and educational content prompts', '#06b6d4', 'book'],
      ['Translation', 'Language translation and localization', '#ec4899', 'globe'],
      ['Summarization', 'Text summarization and condensation', '#14b8a6', 'compress'],
      ['Creative Writing', 'Fiction, poetry, and creative prompts', '#f97316', 'sparkles'],
      ['SEO', 'Search engine optimization prompts', '#84cc16', 'search'],
      ['Email', 'Email drafting and templates', '#a855f7', 'mail'],
      ['Legal', 'Legal document and compliance prompts', '#64748b', 'scale'],
      ['Healthcare', 'Medical and health-related prompts', '#22c55e', 'heart'],
      ['Finance', 'Financial analysis and reporting prompts', '#eab308', 'dollar'],
      ['Social Media', 'Social media content and engagement', '#e11d48', 'share'],
      ['Product', 'Product descriptions and specifications', '#0ea5e9', 'box']
    ];

    const categoryIds = [];
    for (const [name, description, color, icon] of categories) {
      const r = await pool.query(
        'INSERT INTO categories (name, description, color, icon, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [name, description, color, icon, userId]
      );
      categoryIds.push(r.rows[0].id);
    }
    console.log(`Seeded ${categories.length} categories`);

    // ========== PROMPT TEMPLATES (20+) ==========
    const prompts = [
      ['Blog Post Generator', 'Generate SEO-optimized blog posts on any topic', 'Write a comprehensive blog post about {{topic}}. Include an engaging introduction, 3-5 main sections with headers, practical examples, and a compelling conclusion. Target audience: {{audience}}. Tone: {{tone}}. Word count: approximately {{word_count}} words.', categoryIds[0], ['blog', 'seo', 'content'], 'active', 0.7],
      ['Python Code Generator', 'Generate clean Python code with documentation', 'Write a Python function that {{task_description}}. Include: type hints, docstring with examples, error handling, and unit tests. Follow PEP 8 conventions. Complexity level: {{complexity}}.', categoryIds[1], ['python', 'code', 'automation'], 'active', 0.3],
      ['Data Insight Extractor', 'Extract key insights from raw data descriptions', 'Analyze the following data and provide key insights:\n\nData: {{data_description}}\n\nProvide:\n1. Top 5 key findings\n2. Trends and patterns\n3. Anomalies or outliers\n4. Actionable recommendations\n5. Visualization suggestions', categoryIds[2], ['data', 'analysis', 'insights'], 'active', 0.5],
      ['Customer Response Template', 'Professional customer support responses', 'Draft a professional customer support response for the following issue:\n\nCustomer Issue: {{issue}}\nSentiment: {{sentiment}}\nPriority: {{priority}}\n\nResponse should be empathetic, solution-oriented, and include next steps.', categoryIds[3], ['support', 'customer', 'response'], 'active', 0.6],
      ['Ad Copy Creator', 'Create compelling advertising copy', 'Create {{ad_type}} ad copy for:\n\nProduct: {{product}}\nTarget Audience: {{audience}}\nKey Benefits: {{benefits}}\nCall to Action: {{cta}}\n\nProvide 3 variations with different hooks.', categoryIds[4], ['ads', 'marketing', 'copy'], 'active', 0.8],
      ['Lesson Plan Generator', 'Create structured lesson plans', 'Create a detailed lesson plan for teaching {{subject}} to {{grade_level}} students.\n\nDuration: {{duration}}\nLearning Objectives: {{objectives}}\n\nInclude: warm-up activity, main instruction, practice exercises, assessment, and differentiation strategies.', categoryIds[5], ['education', 'teaching', 'curriculum'], 'active', 0.6],
      ['Multi-Language Translator', 'Translate text with cultural context', 'Translate the following text from {{source_language}} to {{target_language}}:\n\n{{text}}\n\nConsiderations:\n- Maintain tone and style\n- Adapt cultural references\n- Provide alternative translations for ambiguous phrases\n- Note any untranslatable concepts', categoryIds[6], ['translation', 'language', 'localization'], 'active', 0.3],
      ['Executive Summary Writer', 'Condense long documents into executive summaries', 'Create an executive summary of the following content:\n\n{{content}}\n\nFormat:\n- One-paragraph overview\n- Key points (bullet format)\n- Critical metrics/data\n- Recommended actions\n- Maximum {{max_words}} words', categoryIds[7], ['summary', 'executive', 'condensation'], 'active', 0.4],
      ['Short Story Creator', 'Generate creative short stories', 'Write a short story with these parameters:\n\nGenre: {{genre}}\nSetting: {{setting}}\nMain Character: {{character}}\nConflict: {{conflict}}\nTone: {{tone}}\n\nWord count: approximately {{word_count}} words. Include vivid descriptions and dialogue.', categoryIds[8], ['creative', 'fiction', 'story'], 'active', 0.9],
      ['SEO Meta Generator', 'Generate SEO-optimized meta tags and descriptions', 'Generate SEO metadata for:\n\nPage Topic: {{topic}}\nTarget Keywords: {{keywords}}\nPage Type: {{page_type}}\n\nProvide:\n1. Title tag (50-60 chars)\n2. Meta description (150-160 chars)\n3. H1 tag suggestion\n4. 5 related keywords\n5. Schema markup suggestion', categoryIds[9], ['seo', 'meta', 'optimization'], 'active', 0.4],
      ['Email Campaign Writer', 'Create email marketing campaigns', 'Write a {{email_type}} email for:\n\nBrand: {{brand}}\nGoal: {{goal}}\nAudience Segment: {{segment}}\nKey Message: {{message}}\n\nInclude: Subject line (3 options), preview text, body copy, and CTA button text.', categoryIds[10], ['email', 'campaign', 'marketing'], 'active', 0.7],
      ['Contract Clause Drafter', 'Draft legal contract clauses', 'Draft a {{clause_type}} clause for a {{contract_type}} agreement:\n\nParties: {{parties}}\nKey Terms: {{terms}}\nJurisdiction: {{jurisdiction}}\n\nNote: This is for reference only and should be reviewed by a legal professional.', categoryIds[11], ['legal', 'contract', 'clause'], 'active', 0.2],
      ['Patient Education Content', 'Create patient-friendly health information', 'Create patient education content about {{condition}}:\n\nReading Level: {{reading_level}}\nLanguage: Plain English\n\nInclude:\n1. What is it?\n2. Common symptoms\n3. Treatment options\n4. Lifestyle recommendations\n5. When to see a doctor\n\nDisclaimer: For informational purposes only.', categoryIds[12], ['health', 'patient', 'education'], 'active', 0.4],
      ['Financial Report Generator', 'Generate financial analysis reports', 'Generate a financial analysis report for:\n\nCompany/Period: {{company}}\nMetrics: {{metrics}}\nComparison Period: {{comparison}}\n\nInclude:\n1. Executive summary\n2. Key financial metrics\n3. Trend analysis\n4. Risk assessment\n5. Recommendations', categoryIds[13], ['finance', 'report', 'analysis'], 'active', 0.3],
      ['Social Media Post Creator', 'Create engaging social media content', 'Create a {{platform}} post for:\n\nBrand: {{brand}}\nTopic: {{topic}}\nGoal: {{goal}}\nTone: {{tone}}\n\nInclude: Post text, hashtag suggestions, best posting time, and engagement hook.', categoryIds[14], ['social', 'media', 'engagement'], 'active', 0.8],
      ['Product Description Writer', 'Write compelling product descriptions', 'Write a product description for:\n\nProduct: {{product_name}}\nCategory: {{category}}\nFeatures: {{features}}\nTarget Buyer: {{buyer}}\nPrice Point: {{price}}\n\nInclude: Headline, key benefits, technical specs summary, and urgency element.', categoryIds[15], ['product', 'ecommerce', 'description'], 'active', 0.7],
      ['API Documentation Generator', 'Generate API endpoint documentation', 'Generate comprehensive API documentation for:\n\nEndpoint: {{endpoint}}\nMethod: {{method}}\nDescription: {{description}}\n\nInclude: Parameters, request body schema, response schema, example requests/responses, error codes, and rate limiting info.', categoryIds[1], ['api', 'documentation', 'developer'], 'active', 0.3],
      ['Interview Question Generator', 'Create structured interview questions', 'Generate interview questions for a {{role}} position:\n\nSeniority: {{level}}\nKey Skills: {{skills}}\nCompany Culture: {{culture}}\n\nProvide:\n1. 5 Technical questions\n2. 5 Behavioral questions\n3. 3 Situational questions\n4. 2 Culture fit questions\n5. Scoring rubric for each', categoryIds[5], ['interview', 'hiring', 'hr'], 'active', 0.6],
      ['Bug Report Analyzer', 'Analyze and categorize bug reports', 'Analyze this bug report and provide structured analysis:\n\nBug Report: {{bug_report}}\n\nProvide:\n1. Severity classification (Critical/High/Medium/Low)\n2. Likely root cause\n3. Affected components\n4. Steps to reproduce (refined)\n5. Suggested fix approach\n6. Testing recommendations', categoryIds[1], ['bug', 'qa', 'debugging'], 'active', 0.3],
      ['Meeting Notes Summarizer', 'Summarize meeting transcripts', 'Summarize the following meeting notes:\n\n{{notes}}\n\nFormat:\n- Meeting Overview (1-2 sentences)\n- Key Decisions Made\n- Action Items (with owners and deadlines)\n- Open Questions\n- Next Steps', categoryIds[7], ['meeting', 'notes', 'summary'], 'active', 0.4]
    ];

    const promptIds = [];
    for (const [name, description, content, catId, tags, status, temp] of prompts) {
      const r = await pool.query(
        `INSERT INTO prompt_templates (name, description, content, category_id, user_id, tags, status, temperature, usage_count, avg_rating)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [name, description, content, catId, userId, tags, status, temp, Math.floor(Math.random() * 500) + 10, (Math.random() * 2 + 3).toFixed(2)]
      );
      promptIds.push(r.rows[0].id);
    }
    console.log(`Seeded ${prompts.length} prompt templates`);

    // ========== PROMPT VERSIONS (15+) ==========
    const versions = [];
    for (let i = 0; i < Math.min(16, promptIds.length); i++) {
      for (let v = 1; v <= 3; v++) {
        versions.push([promptIds[i], v,
          `Version ${v} of prompt - Enhanced with better instructions and clearer output format. Added more specific constraints and examples.`,
          `v${v}: ${v === 1 ? 'Initial version' : v === 2 ? 'Improved clarity and structure' : 'Added error handling and edge cases'}`,
          (70 + Math.random() * 30).toFixed(2)
        ]);
      }
    }
    for (const [promptId, version, content, notes, score] of versions) {
      await pool.query(
        'INSERT INTO prompt_versions (prompt_id, version_number, content, change_notes, performance_score, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [promptId, version, content, notes, score, userId]
      );
    }
    console.log(`Seeded ${versions.length} prompt versions`);

    // ========== A/B TESTS (15+) ==========
    const abTests = [
      ['Formal vs Casual Blog Intro', 'Testing formal vs casual tone for blog introductions', promptIds[0], promptIds[8], 'running', 'Write about artificial intelligence', 'Engagement, clarity, readability'],
      ['Detailed vs Concise Code Docs', 'Comparing documentation verbosity levels', promptIds[1], promptIds[16], 'completed', 'Create a REST API endpoint', 'Accuracy, completeness, usefulness'],
      ['Bullet vs Narrative Summary', 'Testing summary format preferences', promptIds[7], promptIds[19], 'running', 'Q3 performance review', 'Clarity, information density'],
      ['Technical vs Simple Health Info', 'Medical content readability test', promptIds[12], promptIds[5], 'draft', 'Explain diabetes management', 'Comprehension, accuracy'],
      ['Short vs Long Ad Copy', 'Testing ad copy length effectiveness', promptIds[4], promptIds[15], 'completed', 'New fitness tracker launch', 'Click-through, engagement'],
      ['Direct vs Story-based Email', 'Email engagement approach test', promptIds[10], promptIds[8], 'running', 'Product launch announcement', 'Open rate, conversion'],
      ['Structured vs Free-form Analysis', 'Data analysis format comparison', promptIds[2], promptIds[13], 'completed', 'Revenue data for Q4', 'Insight quality, actionability'],
      ['Question-led vs Statement-led SEO', 'SEO title approach comparison', promptIds[9], promptIds[0], 'running', 'Cloud computing trends', 'CTR, ranking'],
      ['Empathetic vs Efficient Support', 'Customer support tone testing', promptIds[3], promptIds[10], 'draft', 'Billing dispute resolution', 'CSAT, resolution time'],
      ['Creative vs Formulaic Social Posts', 'Social media engagement testing', promptIds[14], promptIds[4], 'completed', 'New product announcement', 'Engagement rate, shares'],
      ['Step-by-step vs Overview Teaching', 'Educational approach comparison', promptIds[5], promptIds[7], 'running', 'Introduction to Python', 'Comprehension, retention'],
      ['Literal vs Adaptive Translation', 'Translation approach comparison', promptIds[6], promptIds[7], 'draft', 'Marketing brochure translation', 'Accuracy, naturalness'],
      ['Feature vs Benefit Product Copy', 'Product description approach test', promptIds[15], promptIds[4], 'completed', 'SaaS product description', 'Conversion rate'],
      ['Behavioral vs Technical Interview Q', 'Interview question effectiveness', promptIds[17], promptIds[5], 'running', 'Senior engineer interview', 'Candidate assessment quality'],
      ['Automated vs Manual Bug Analysis', 'Bug report analysis comparison', promptIds[18], promptIds[2], 'draft', 'Memory leak in production', 'Accuracy, speed'],
      ['Verbose vs Minimal Code Gen', 'Code output verbosity test', promptIds[1], promptIds[16], 'running', 'Build a pagination component', 'Code quality, readability']
    ];

    for (const [name, desc, paId, pbId, status, input, criteria] of abTests) {
      await pool.query(
        `INSERT INTO ab_tests (name, description, prompt_a_id, prompt_b_id, status, test_input, evaluation_criteria, total_runs, prompt_a_wins, prompt_b_wins, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [name, desc, paId, pbId, status, input, criteria, Math.floor(Math.random() * 100), Math.floor(Math.random() * 50), Math.floor(Math.random() * 50), userId]
      );
    }
    console.log(`Seeded ${abTests.length} A/B tests`);

    // ========== OPTIMIZATION JOBS (15+) ==========
    const optimizations = [
      ['Improve Blog Clarity', 'Write a blog about AI', 'Write a comprehensive, SEO-optimized blog post about AI that engages readers with clear examples...', 'clarity', 'chain-of-thought', 'completed', 85.5],
      ['Enhance Code Prompt Precision', 'Write Python code', 'Write clean, well-documented Python code with type hints, error handling, and comprehensive tests...', 'precision', 'few-shot', 'completed', 92.0],
      ['Optimize Data Analysis Flow', 'Analyze this data', 'Perform systematic data analysis: identify patterns, outliers, correlations, and provide actionable insights...', 'structure', 'step-by-step', 'completed', 78.3],
      ['Boost Customer Response Empathy', 'Reply to customer', 'Craft an empathetic, solution-focused response acknowledging the customer concern and providing clear next steps...', 'tone', 'persona-based', 'completed', 88.7],
      ['Sharpen Marketing Copy', 'Create ad copy', 'Create compelling, conversion-optimized ad copy with strong hooks, clear value propositions, and irresistible CTAs...', 'engagement', 'aida-framework', 'completed', 91.2],
      ['Refine Teaching Prompt', 'Create lesson plan', 'Design an adaptive lesson plan with scaffolded learning objectives, interactive activities, and multiple assessment methods...', 'completeness', 'bloom-taxonomy', 'completed', 86.4],
      ['Translation Accuracy Boost', 'Translate text', 'Translate with cultural sensitivity, maintaining semantic meaning while adapting idioms and references...', 'accuracy', 'back-translation', 'in_progress', null],
      ['Summary Conciseness', 'Summarize document', 'Create a concise executive summary capturing key decisions, metrics, and action items in under 200 words...', 'conciseness', 'compression', 'completed', 89.1],
      ['Story Creativity Boost', 'Write a story', 'Craft an immersive narrative with complex characters, vivid sensory details, and unexpected plot twists...', 'creativity', 'brainstorming', 'completed', 94.5],
      ['SEO Keyword Integration', 'Generate meta tags', 'Generate SEO metadata with naturally integrated keywords, compelling click-through copy, and proper schema markup...', 'seo-score', 'keyword-density', 'completed', 87.8],
      ['Email Conversion Boost', 'Write email campaign', 'Write a high-converting email with personalized subject lines, scannable body copy, and a single clear CTA...', 'conversion', 'persuasion-framework', 'in_progress', null],
      ['Legal Precision Enhancement', 'Draft contract clause', 'Draft precise legal language with clear definitions, specific obligations, and enforceable terms...', 'precision', 'legal-framework', 'completed', 83.6],
      ['Health Content Readability', 'Create patient info', 'Create patient-friendly health content at 6th-grade reading level with clear actionable guidance...', 'readability', 'plain-language', 'completed', 90.2],
      ['Financial Report Depth', 'Generate report', 'Generate comprehensive financial analysis with trend identification, risk assessment, and strategic recommendations...', 'depth', 'analytical-framework', 'pending', null],
      ['Social Media Viral Factor', 'Create social post', 'Create scroll-stopping social content with emotional hooks, shareability triggers, and community engagement prompts...', 'virality', 'engagement-hooks', 'completed', 88.9],
      ['Interview Question Depth', 'Generate questions', 'Generate probing interview questions that assess both technical competency and cultural alignment...', 'depth', 'competency-based', 'completed', 85.1]
    ];

    for (const [name, original, optimized, type, strategy, status, score] of optimizations) {
      await pool.query(
        `INSERT INTO optimization_jobs (name, original_prompt, optimized_prompt, optimization_type, strategy, status, improvement_score, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [name, original, optimized, type, strategy, status, score, userId]
      );
    }
    console.log(`Seeded ${optimizations.length} optimization jobs`);

    // ========== ANALYTICS (20+) ==========
    const metricTypes = ['completion', 'playground_run', 'optimization', 'evaluation', 'chain_execution'];
    const models = ['anthropic/claude-haiku-4.5', 'openai/gpt-4o-mini', 'google/gemini-flash-1.5', 'meta-llama/llama-3-70b'];

    for (let i = 0; i < 20; i++) {
      const pId = promptIds[i % promptIds.length];
      await pool.query(
        `INSERT INTO analytics (prompt_id, metric_type, metric_value, tokens_used, latency_ms, cost, model, success, user_id, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - interval '${i} days')`,
        [pId, metricTypes[i % metricTypes.length], (Math.random() * 100).toFixed(2),
         Math.floor(Math.random() * 2000) + 100, Math.floor(Math.random() * 3000) + 200,
         (Math.random() * 0.05).toFixed(6), models[i % models.length], Math.random() > 0.1, userId]
      );
    }
    console.log('Seeded 20 analytics records');

    // ========== PROMPT LIBRARY (15+) ==========
    const libraryItems = [
      ['Ultimate Blog Writer', 'Generate professional blog content', 'content-writing', 'beginner', 'Content marketing', true],
      ['Clean Code Generator', 'Production-ready code generation', 'code-generation', 'advanced', 'Software development', true],
      ['Data Whisperer', 'Extract insights from any dataset', 'data-analysis', 'intermediate', 'Business intelligence', false],
      ['Support Hero', 'Perfect customer responses every time', 'customer-support', 'beginner', 'Customer service', true],
      ['Ad Copy Master', 'High-converting advertising copy', 'marketing', 'intermediate', 'Digital advertising', false],
      ['Lesson Architect', 'Structured educational content', 'education', 'intermediate', 'Teaching', false],
      ['Global Translator', 'Context-aware translations', 'translation', 'advanced', 'Localization', true],
      ['Brief Builder', 'Concise document summaries', 'summarization', 'beginner', 'Document processing', false],
      ['Story Weaver', 'Compelling narrative generation', 'creative-writing', 'intermediate', 'Creative projects', true],
      ['SEO Wizard', 'Search-optimized content metadata', 'seo', 'intermediate', 'SEO optimization', false],
      ['Email Alchemist', 'High-converting email campaigns', 'email-marketing', 'advanced', 'Email marketing', true],
      ['Legal Eagle', 'Precise legal document drafting', 'legal', 'advanced', 'Legal compliance', false],
      ['Health Communicator', 'Patient-friendly medical content', 'healthcare', 'intermediate', 'Patient education', false],
      ['Finance Analyst', 'Comprehensive financial reports', 'finance', 'advanced', 'Financial analysis', true],
      ['Social Spark', 'Viral social media content', 'social-media', 'beginner', 'Social media management', false],
      ['Product Pitch', 'Compelling product descriptions', 'ecommerce', 'beginner', 'E-commerce', true]
    ];

    for (let i = 0; i < libraryItems.length; i++) {
      const [title, desc, category, difficulty, useCase, featured] = libraryItems[i];
      await pool.query(
        `INSERT INTO prompt_library (prompt_id, title, description, category, difficulty, use_case, downloads, rating, rating_count, is_featured, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [promptIds[i % promptIds.length], title, desc, category, difficulty, useCase,
         Math.floor(Math.random() * 5000), (Math.random() * 2 + 3).toFixed(2), Math.floor(Math.random() * 200) + 5, featured, userId]
      );
    }
    console.log(`Seeded ${libraryItems.length} library items`);

    // ========== VARIABLES (15+) ==========
    const variables = [
      ['topic', 'The main subject or topic', 'artificial intelligence', 'text', null, true],
      ['audience', 'Target audience for the content', 'tech professionals', 'select', null, true],
      ['tone', 'Writing tone and style', 'professional', 'select', null, false],
      ['word_count', 'Target word count', '1000', 'number', '^[0-9]+$', false],
      ['language', 'Target language for output', 'English', 'select', null, true],
      ['complexity', 'Complexity level', 'intermediate', 'select', null, false],
      ['format', 'Output format preference', 'markdown', 'select', null, false],
      ['industry', 'Target industry context', 'technology', 'text', null, false],
      ['brand_voice', 'Brand voice guidelines', 'friendly and authoritative', 'textarea', null, false],
      ['keywords', 'Target SEO keywords', 'AI, machine learning, automation', 'text', null, false],
      ['max_words', 'Maximum word limit', '500', 'number', '^[0-9]+$', false],
      ['genre', 'Content genre', 'informative', 'select', null, false],
      ['platform', 'Target platform', 'website', 'select', null, true],
      ['priority', 'Content priority level', 'high', 'select', null, false],
      ['temperature', 'AI temperature setting', '0.7', 'number', '^[0-1]?\\.?[0-9]*$', false],
      ['persona', 'AI persona to adopt', 'expert consultant', 'text', null, false]
    ];

    for (let i = 0; i < variables.length; i++) {
      const [name, desc, defaultVal, type, regex, required] = variables[i];
      const options = type === 'select' ? ['option1', 'option2', 'option3'] : [];
      await pool.query(
        `INSERT INTO variables (name, description, default_value, variable_type, validation_regex, required, options, prompt_id, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [name, desc, defaultVal, type, regex, required, JSON.stringify(options), promptIds[i % promptIds.length], userId]
      );
    }
    console.log(`Seeded ${variables.length} variables`);

    // ========== TEAMS (15+) ==========
    const teams = [
      ['Content Team', 'Blog and article writing team', 'pro', 8],
      ['Engineering', 'Software development team', 'enterprise', 15],
      ['Data Science', 'Analytics and ML team', 'pro', 6],
      ['Customer Success', 'Customer support and success', 'pro', 12],
      ['Marketing', 'Digital marketing team', 'enterprise', 10],
      ['Education', 'Training and documentation', 'free', 4],
      ['Localization', 'Translation and i18n team', 'pro', 7],
      ['Executive', 'Leadership team', 'enterprise', 5],
      ['Creative', 'Design and creative team', 'pro', 9],
      ['SEO Team', 'Search optimization specialists', 'pro', 6],
      ['Growth', 'Growth hacking team', 'enterprise', 8],
      ['Legal & Compliance', 'Legal department', 'enterprise', 4],
      ['Product', 'Product management team', 'pro', 11],
      ['QA', 'Quality assurance team', 'pro', 7],
      ['DevOps', 'Infrastructure and operations', 'enterprise', 5],
      ['Research', 'R&D and innovation team', 'pro', 6]
    ];

    for (const [name, desc, plan, memberCount] of teams) {
      const r = await pool.query(
        'INSERT INTO teams (name, description, owner_id, plan, member_count) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [name, desc, userId, plan, memberCount]
      );
      await pool.query(
        'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
        [r.rows[0].id, userId, 'owner']
      );
    }
    console.log(`Seeded ${teams.length} teams`);

    // ========== PROMPT CHAINS (15+) ==========
    const chains = [
      ['Research → Draft → Edit', 'Complete content creation pipeline', [
        { name: 'Research', prompt: 'Research the topic: {{topic}}', system_prompt: 'You are a research assistant.' },
        { name: 'Draft', prompt: 'Write a draft article based on this research.', system_prompt: 'You are a content writer.' },
        { name: 'Edit', prompt: 'Edit and polish this draft for publication.', system_prompt: 'You are a professional editor.' }
      ], 'active'],
      ['Analyze → Summarize → Report', 'Data to report pipeline', [
        { name: 'Analyze', prompt: 'Analyze this data: {{data}}', system_prompt: 'You are a data analyst.' },
        { name: 'Summarize', prompt: 'Summarize the key findings.', system_prompt: 'You are a business analyst.' },
        { name: 'Report', prompt: 'Create an executive report.', system_prompt: 'You are a report writer.' }
      ], 'active'],
      ['Brainstorm → Evaluate → Select', 'Idea generation pipeline', [
        { name: 'Brainstorm', prompt: 'Generate 10 ideas for: {{topic}}', system_prompt: 'You are a creative strategist.' },
        { name: 'Evaluate', prompt: 'Evaluate each idea on feasibility and impact.', system_prompt: 'You are a business evaluator.' },
        { name: 'Select', prompt: 'Select top 3 ideas with implementation plans.', system_prompt: 'You are a project manager.' }
      ], 'draft'],
      ['Extract → Transform → Load', 'ETL prompt pipeline', [
        { name: 'Extract', prompt: 'Extract structured data from: {{input}}', system_prompt: 'You are a data extractor.' },
        { name: 'Transform', prompt: 'Transform data into required format.', system_prompt: 'You are a data engineer.' },
        { name: 'Load', prompt: 'Validate and prepare for storage.', system_prompt: 'You are a data validator.' }
      ], 'active'],
      ['Question → Answer → Verify', 'Q&A verification chain', [
        { name: 'Question', prompt: 'Generate questions about: {{topic}}', system_prompt: 'You are a curious researcher.' },
        { name: 'Answer', prompt: 'Answer each question thoroughly.', system_prompt: 'You are a domain expert.' },
        { name: 'Verify', prompt: 'Fact-check and verify answers.', system_prompt: 'You are a fact-checker.' }
      ], 'active'],
      ['Translate → Review → Localize', 'Translation quality pipeline', [
        { name: 'Translate', prompt: 'Translate to {{language}}: {{text}}', system_prompt: 'You are a translator.' },
        { name: 'Review', prompt: 'Review translation for accuracy.', system_prompt: 'You are a linguistic reviewer.' },
        { name: 'Localize', prompt: 'Adapt for cultural context.', system_prompt: 'You are a localization expert.' }
      ], 'draft'],
      ['Outline → Write → Format', 'Document creation pipeline', [
        { name: 'Outline', prompt: 'Create an outline for: {{topic}}', system_prompt: 'You are a content strategist.' },
        { name: 'Write', prompt: 'Write content following the outline.', system_prompt: 'You are a technical writer.' },
        { name: 'Format', prompt: 'Format for publication.', system_prompt: 'You are a formatter.' }
      ], 'active'],
      ['Classify → Route → Respond', 'Customer service automation', [
        { name: 'Classify', prompt: 'Classify this ticket: {{ticket}}', system_prompt: 'You are a ticket classifier.' },
        { name: 'Route', prompt: 'Determine the appropriate team.', system_prompt: 'You are a routing specialist.' },
        { name: 'Respond', prompt: 'Draft initial response.', system_prompt: 'You are a support agent.' }
      ], 'active'],
      ['Audit → Fix → Validate', 'Code review pipeline', [
        { name: 'Audit', prompt: 'Audit this code: {{code}}', system_prompt: 'You are a code reviewer.' },
        { name: 'Fix', prompt: 'Fix identified issues.', system_prompt: 'You are a software engineer.' },
        { name: 'Validate', prompt: 'Validate fixes are correct.', system_prompt: 'You are a QA engineer.' }
      ], 'draft'],
      ['Detect → Analyze → Mitigate', 'Security analysis chain', [
        { name: 'Detect', prompt: 'Detect vulnerabilities in: {{input}}', system_prompt: 'You are a security analyst.' },
        { name: 'Analyze', prompt: 'Analyze severity and impact.', system_prompt: 'You are a risk assessor.' },
        { name: 'Mitigate', prompt: 'Recommend mitigation steps.', system_prompt: 'You are a security engineer.' }
      ], 'active'],
      ['Plan → Execute → Review', 'Project planning chain', [
        { name: 'Plan', prompt: 'Create project plan for: {{project}}', system_prompt: 'You are a project planner.' },
        { name: 'Execute', prompt: 'Break into actionable tasks.', system_prompt: 'You are a task manager.' },
        { name: 'Review', prompt: 'Review and optimize the plan.', system_prompt: 'You are a project reviewer.' }
      ], 'draft'],
      ['Collect → Clean → Visualize', 'Data visualization pipeline', [
        { name: 'Collect', prompt: 'Identify data sources for: {{topic}}', system_prompt: 'You are a data collector.' },
        { name: 'Clean', prompt: 'Suggest data cleaning steps.', system_prompt: 'You are a data cleanser.' },
        { name: 'Visualize', prompt: 'Recommend visualizations.', system_prompt: 'You are a data visualizer.' }
      ], 'active'],
      ['Draft → A/B Test → Optimize', 'Content optimization chain', [
        { name: 'Draft', prompt: 'Draft content for: {{topic}}', system_prompt: 'You are a copywriter.' },
        { name: 'A/B Test', prompt: 'Create A/B test variations.', system_prompt: 'You are a conversion optimizer.' },
        { name: 'Optimize', prompt: 'Optimize based on test results.', system_prompt: 'You are a performance analyst.' }
      ], 'draft'],
      ['Persona → Journey → Touchpoint', 'UX research chain', [
        { name: 'Persona', prompt: 'Create user persona for: {{product}}', system_prompt: 'You are a UX researcher.' },
        { name: 'Journey', prompt: 'Map the user journey.', system_prompt: 'You are a journey mapper.' },
        { name: 'Touchpoint', prompt: 'Identify optimization opportunities.', system_prompt: 'You are a UX designer.' }
      ], 'active'],
      ['Benchmark → Test → Report', 'Performance testing chain', [
        { name: 'Benchmark', prompt: 'Define benchmarks for: {{system}}', system_prompt: 'You are a performance engineer.' },
        { name: 'Test', prompt: 'Design test scenarios.', system_prompt: 'You are a test engineer.' },
        { name: 'Report', prompt: 'Generate performance report.', system_prompt: 'You are a reporting analyst.' }
      ], 'active']
    ];

    for (const [name, desc, steps, status] of chains) {
      await pool.query(
        `INSERT INTO prompt_chains (name, description, steps, total_steps, status, execution_count, avg_duration_ms, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [name, desc, JSON.stringify(steps), steps.length, status,
         Math.floor(Math.random() * 50), Math.floor(Math.random() * 5000) + 1000, userId]
      );
    }
    console.log(`Seeded ${chains.length} prompt chains`);

    // ========== EVALUATIONS (15+) ==========
    const evaluations = [
      ['Blog Quality Check', 'How well does the blog post engage readers?', 'AI is transforming industries...', 85.5, 'manual', 'completed'],
      ['Code Accuracy Test', 'Does the generated code work correctly?', 'def fibonacci(n): ...', 92.0, 'automated', 'completed'],
      ['Data Insight Relevance', 'Are the extracted insights actionable?', 'Revenue increased 15% QoQ...', 78.3, 'manual', 'completed'],
      ['Support Response Quality', 'Customer satisfaction with response', 'We apologize for the inconvenience...', 88.7, 'automated', 'completed'],
      ['Ad Copy Effectiveness', 'Click-through rate prediction', 'Discover the future of...', 91.2, 'ai', 'completed'],
      ['Lesson Plan Completeness', 'Coverage of learning objectives', 'Unit 1: Introduction to...', 86.4, 'manual', 'completed'],
      ['Translation Accuracy', 'Semantic preservation in translation', 'La innovación impulsa...', 83.8, 'automated', 'completed'],
      ['Summary Comprehensiveness', 'Key information retention', 'Key findings: Revenue up...', 89.1, 'manual', 'completed'],
      ['Story Engagement Score', 'Reader engagement metrics', 'The night was dark...', 94.5, 'ai', 'completed'],
      ['SEO Score Check', 'Meta tag optimization level', 'Title: AI Revolution...', 87.8, 'automated', 'completed'],
      ['Email Open Rate Predictor', 'Predicted email performance', 'Subject: Exclusive offer...', 82.3, 'ai', 'completed'],
      ['Legal Precision Audit', 'Legal accuracy assessment', 'Clause 3.1: The parties...', 90.2, 'manual', 'completed'],
      ['Health Content Readability', 'Flesch-Kincaid readability score', 'Diabetes is a condition...', 88.5, 'automated', 'completed'],
      ['Financial Report Depth', 'Analysis thoroughness evaluation', 'Q4 Revenue: $2.3M...', 85.1, 'manual', 'pending'],
      ['Social Post Virality', 'Predicted engagement metrics', 'Just launched our new...', 79.6, 'ai', 'completed'],
      ['Product Copy Conversion', 'Conversion rate prediction', 'The ultimate wireless...', 86.9, 'automated', 'completed']
    ];

    for (let i = 0; i < evaluations.length; i++) {
      const [name, input, output, score, type, status] = evaluations[i];
      await pool.query(
        `INSERT INTO evaluations (name, prompt_id, input_text, output_text, score, evaluation_type, status, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [name, promptIds[i % promptIds.length], input, output, score, type, status, userId]
      );
    }
    console.log(`Seeded ${evaluations.length} evaluations`);

    // ========== COST TRACKING (15+) ==========
    for (let i = 0; i < 20; i++) {
      const model = models[i % models.length];
      const inputTokens = Math.floor(Math.random() * 2000) + 100;
      const outputTokens = Math.floor(Math.random() * 1000) + 50;
      const cost = inputTokens * 0.00001 + outputTokens * 0.00005;
      const requestTypes = ['playground', 'optimization', 'evaluation', 'ab_test', 'chain'];

      await pool.query(
        `INSERT INTO cost_tracking (prompt_id, model, input_tokens, output_tokens, total_cost, request_type, user_id, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - interval '${i} days')`,
        [promptIds[i % promptIds.length], model, inputTokens, outputTokens, cost.toFixed(6), requestTypes[i % requestTypes.length], userId]
      );
    }
    console.log('Seeded 20 cost tracking records');

    // ========== PLAYGROUND SESSIONS (15+) ==========
    const sessions = [
      ['Blog Intro Test', 'Write an engaging intro about AI', 'You are a professional writer', 0.7],
      ['Code Review Session', 'Review this Python function', 'You are a senior developer', 0.3],
      ['Data Query Test', 'Analyze sales trends', 'You are a data analyst', 0.5],
      ['Support Draft', 'Handle refund request', 'You are a support agent', 0.6],
      ['Ad Headline Test', 'Create 5 ad headlines', 'You are a copywriter', 0.8],
      ['Quiz Generator', 'Generate 10 quiz questions', 'You are a teacher', 0.6],
      ['Translation Test', 'Translate to Spanish', 'You are a translator', 0.3],
      ['Meeting Summary', 'Summarize meeting notes', 'You are an assistant', 0.4],
      ['Story Opening', 'Write a mystery opening', 'You are a novelist', 0.9],
      ['SEO Analysis', 'Optimize page metadata', 'You are an SEO expert', 0.4],
      ['Email Subject Lines', 'Generate 10 subject lines', 'You are an email marketer', 0.8],
      ['Contract Review', 'Review NDA clause', 'You are a lawyer', 0.2],
      ['Patient FAQ', 'Create FAQ for diabetes', 'You are a doctor', 0.4],
      ['Budget Analysis', 'Analyze Q4 budget', 'You are a financial analyst', 0.3],
      ['Tweet Generator', 'Create viral tweets', 'You are a social media manager', 0.9],
      ['API Design', 'Design REST API endpoints', 'You are a backend architect', 0.3]
    ];

    for (const [name, prompt, system, temp] of sessions) {
      await pool.query(
        `INSERT INTO playground_sessions (name, prompt_text, system_prompt, temperature, tokens_used, latency_ms, cost, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [name, prompt, system, temp, Math.floor(Math.random() * 1500) + 100, Math.floor(Math.random() * 3000) + 500, (Math.random() * 0.05).toFixed(6), userId]
      );
    }
    console.log(`Seeded ${sessions.length} playground sessions`);

    // ========== DEPLOYMENTS (15+) ==========
    const deployments = [
      ['Blog API v1', 'production', 'active', 1000, 450],
      ['Code Gen Staging', 'staging', 'active', 500, 890],
      ['Data Analysis API', 'production', 'active', 200, 1200],
      ['Support Bot v2', 'production', 'active', 2000, 320],
      ['Ad Copy Service', 'staging', 'testing', 100, 670],
      ['Education API', 'production', 'active', 300, 540],
      ['Translation Service', 'production', 'active', 1500, 780],
      ['Summary Engine', 'staging', 'active', 400, 290],
      ['Story Generator', 'production', 'paused', 100, 1100],
      ['SEO Optimizer', 'production', 'active', 800, 430],
      ['Email Writer API', 'staging', 'testing', 200, 560],
      ['Legal Draft API', 'production', 'active', 50, 1400],
      ['Health Content API', 'production', 'active', 300, 620],
      ['Finance Report API', 'staging', 'testing', 100, 980],
      ['Social Post API', 'production', 'active', 1000, 380],
      ['Product Copy API', 'production', 'active', 600, 510]
    ];

    for (let i = 0; i < deployments.length; i++) {
      const [name, env, status, rateLimit, latency] = deployments[i];
      await pool.query(
        `INSERT INTO deployments (name, prompt_id, environment, status, rate_limit, total_requests, avg_latency_ms, error_rate, api_key, user_id, deployed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() - interval '${i} days')`,
        [name, promptIds[i % promptIds.length], env, status, rateLimit,
         Math.floor(Math.random() * 10000), latency, (Math.random() * 5).toFixed(2),
         'psk_' + Math.random().toString(36).substr(2, 32), userId]
      );
    }
    console.log(`Seeded ${deployments.length} deployments`);

    // ========== EXPORT/IMPORT JOBS (15+) ==========
    const exportJobs = [
      ['export', 'json', 'prompts_export_2024.json', 20, 'completed'],
      ['import', 'json', 'team_prompts_import.json', 15, 'completed'],
      ['export', 'csv', 'analytics_report.csv', 100, 'completed'],
      ['export', 'json', 'categories_backup.json', 16, 'completed'],
      ['import', 'json', 'shared_library_import.json', 30, 'completed'],
      ['export', 'csv', 'cost_report_q4.csv', 50, 'completed'],
      ['export', 'json', 'chains_export.json', 15, 'completed'],
      ['import', 'csv', 'bulk_prompts_import.csv', 45, 'completed'],
      ['export', 'json', 'evaluations_export.json', 16, 'completed'],
      ['export', 'csv', 'deployments_report.csv', 16, 'completed'],
      ['import', 'json', 'competitor_prompts.json', 25, 'completed'],
      ['export', 'json', 'full_backup_mar2024.json', 200, 'completed'],
      ['export', 'csv', 'team_performance.csv', 80, 'completed'],
      ['import', 'json', 'optimization_templates.json', 10, 'failed'],
      ['export', 'json', 'variables_export.json', 16, 'completed'],
      ['import', 'csv', 'new_categories.csv', 8, 'completed']
    ];

    for (const [type, format, fileName, count, status] of exportJobs) {
      await pool.query(
        `INSERT INTO export_import_jobs (job_type, format, file_name, items_count, items_processed, status, user_id, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, ${status === 'completed' ? 'NOW()' : 'NULL'})`,
        [type, format, fileName, count, status === 'completed' ? count : Math.floor(count * 0.6), status, userId]
      );
    }
    console.log(`Seeded ${exportJobs.length} export/import jobs`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log(`   Login with: ${process.env.DEFAULT_ADMIN_EMAIL} / ${process.env.DEFAULT_ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
