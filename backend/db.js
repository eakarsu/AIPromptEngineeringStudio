const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        avatar_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Categories table
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(50) DEFAULT '#6366f1',
        icon VARCHAR(50) DEFAULT 'folder',
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Prompt Templates table
      CREATE TABLE IF NOT EXISTS prompt_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        is_public BOOLEAN DEFAULT false,
        tags TEXT[] DEFAULT '{}',
        model VARCHAR(100) DEFAULT 'anthropic/claude-3-5-sonnet-20241022',
        temperature DECIMAL(3,2) DEFAULT 0.7,
        max_tokens INTEGER DEFAULT 1024,
        status VARCHAR(50) DEFAULT 'draft',
        usage_count INTEGER DEFAULT 0,
        avg_rating DECIMAL(3,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Prompt Versions table
      CREATE TABLE IF NOT EXISTS prompt_versions (
        id SERIAL PRIMARY KEY,
        prompt_id INTEGER REFERENCES prompt_templates(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        content TEXT NOT NULL,
        change_notes TEXT,
        performance_score DECIMAL(5,2),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- A/B Tests table
      CREATE TABLE IF NOT EXISTS ab_tests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        prompt_a_id INTEGER REFERENCES prompt_templates(id) ON DELETE CASCADE,
        prompt_b_id INTEGER REFERENCES prompt_templates(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'draft',
        winner VARCHAR(10),
        total_runs INTEGER DEFAULT 0,
        prompt_a_wins INTEGER DEFAULT 0,
        prompt_b_wins INTEGER DEFAULT 0,
        prompt_a_avg_score DECIMAL(5,2) DEFAULT 0,
        prompt_b_avg_score DECIMAL(5,2) DEFAULT 0,
        test_input TEXT,
        evaluation_criteria TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Optimization Jobs table
      CREATE TABLE IF NOT EXISTS optimization_jobs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        original_prompt TEXT NOT NULL,
        optimized_prompt TEXT,
        optimization_type VARCHAR(50) DEFAULT 'general',
        strategy VARCHAR(100),
        improvement_score DECIMAL(5,2),
        status VARCHAR(50) DEFAULT 'pending',
        ai_feedback TEXT,
        suggestions JSONB DEFAULT '[]',
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Analytics table
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        prompt_id INTEGER REFERENCES prompt_templates(id) ON DELETE CASCADE,
        metric_type VARCHAR(100) NOT NULL,
        metric_value DECIMAL(10,4),
        tokens_used INTEGER DEFAULT 0,
        latency_ms INTEGER DEFAULT 0,
        cost DECIMAL(10,6) DEFAULT 0,
        model VARCHAR(100),
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        metadata JSONB DEFAULT '{}',
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        recorded_at TIMESTAMP DEFAULT NOW()
      );

      -- Prompt Library table
      CREATE TABLE IF NOT EXISTS prompt_library (
        id SERIAL PRIMARY KEY,
        prompt_id INTEGER REFERENCES prompt_templates(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        difficulty VARCHAR(50) DEFAULT 'intermediate',
        use_case VARCHAR(255),
        example_output TEXT,
        downloads INTEGER DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        rating_count INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Variables table
      CREATE TABLE IF NOT EXISTS variables (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        default_value TEXT,
        variable_type VARCHAR(50) DEFAULT 'text',
        validation_regex VARCHAR(500),
        required BOOLEAN DEFAULT false,
        options JSONB DEFAULT '[]',
        prompt_id INTEGER REFERENCES prompt_templates(id) ON DELETE SET NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Teams table
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        member_count INTEGER DEFAULT 1,
        plan VARCHAR(50) DEFAULT 'free',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Team Members table
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW()
      );

      -- Prompt Chains table
      CREATE TABLE IF NOT EXISTS prompt_chains (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        steps JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'draft',
        total_steps INTEGER DEFAULT 0,
        execution_count INTEGER DEFAULT 0,
        avg_duration_ms INTEGER DEFAULT 0,
        last_output TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Evaluations table
      CREATE TABLE IF NOT EXISTS evaluations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        prompt_id INTEGER REFERENCES prompt_templates(id) ON DELETE CASCADE,
        input_text TEXT,
        output_text TEXT,
        score DECIMAL(5,2),
        criteria JSONB DEFAULT '{}',
        feedback TEXT,
        evaluation_type VARCHAR(50) DEFAULT 'manual',
        status VARCHAR(50) DEFAULT 'pending',
        ai_analysis TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Cost Tracking table
      CREATE TABLE IF NOT EXISTS cost_tracking (
        id SERIAL PRIMARY KEY,
        prompt_id INTEGER REFERENCES prompt_templates(id) ON DELETE SET NULL,
        model VARCHAR(100) NOT NULL,
        input_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        total_cost DECIMAL(10,6) DEFAULT 0,
        request_type VARCHAR(50),
        period VARCHAR(20),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        recorded_at TIMESTAMP DEFAULT NOW()
      );

      -- Playground Sessions table
      CREATE TABLE IF NOT EXISTS playground_sessions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) DEFAULT 'Untitled Session',
        prompt_text TEXT,
        system_prompt TEXT,
        model VARCHAR(100) DEFAULT 'anthropic/claude-3-5-sonnet-20241022',
        temperature DECIMAL(3,2) DEFAULT 0.7,
        max_tokens INTEGER DEFAULT 1024,
        response_text TEXT,
        tokens_used INTEGER DEFAULT 0,
        latency_ms INTEGER DEFAULT 0,
        cost DECIMAL(10,6) DEFAULT 0,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Deployments table
      CREATE TABLE IF NOT EXISTS deployments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        prompt_id INTEGER REFERENCES prompt_templates(id) ON DELETE CASCADE,
        version_id INTEGER REFERENCES prompt_versions(id) ON DELETE SET NULL,
        environment VARCHAR(50) DEFAULT 'staging',
        status VARCHAR(50) DEFAULT 'pending',
        endpoint_url VARCHAR(500),
        api_key VARCHAR(255),
        rate_limit INTEGER DEFAULT 100,
        total_requests INTEGER DEFAULT 0,
        avg_latency_ms INTEGER DEFAULT 0,
        error_rate DECIMAL(5,2) DEFAULT 0,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        deployed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Export/Import Jobs table
      CREATE TABLE IF NOT EXISTS export_import_jobs (
        id SERIAL PRIMARY KEY,
        job_type VARCHAR(20) NOT NULL,
        format VARCHAR(20) DEFAULT 'json',
        status VARCHAR(50) DEFAULT 'pending',
        file_name VARCHAR(255),
        items_count INTEGER DEFAULT 0,
        items_processed INTEGER DEFAULT 0,
        data JSONB,
        error_message TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );

      -- User Settings table
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        theme VARCHAR(20) DEFAULT 'dark',
        language VARCHAR(10) DEFAULT 'en',
        notifications_enabled BOOLEAN DEFAULT true,
        email_notifications BOOLEAN DEFAULT false,
        default_model VARCHAR(100) DEFAULT 'anthropic/claude-3-5-sonnet-20241022',
        default_temperature DECIMAL(3,2) DEFAULT 0.7,
        default_max_tokens INTEGER DEFAULT 1024,
        timezone VARCHAR(100) DEFAULT 'UTC',
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT false,
        link VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Favorites table
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        prompt_id INTEGER REFERENCES prompt_templates(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, prompt_id)
      );

      -- Comments table
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        prompt_id INTEGER REFERENCES prompt_templates(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Activity Log table
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER,
        entity_name VARCHAR(255),
        details JSONB DEFAULT '{}',
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Tags table
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(50) DEFAULT '#6366f1',
        description TEXT,
        usage_count INTEGER DEFAULT 0,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(name, user_id)
      );

      -- Trash table
      CREATE TABLE IF NOT EXISTS trash (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER NOT NULL,
        entity_name VARCHAR(255),
        entity_data JSONB NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        deleted_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
      );

      -- Webhooks table
      CREATE TABLE IF NOT EXISTS webhooks (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        secret VARCHAR(255),
        events TEXT[] DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        last_triggered_at TIMESTAMP,
        last_status_code INTEGER,
        failure_count INTEGER DEFAULT 0,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- API Keys table
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        key_hash VARCHAR(255) NOT NULL,
        key_prefix VARCHAR(20) NOT NULL,
        permissions TEXT[] DEFAULT '{read}',
        is_active BOOLEAN DEFAULT true,
        last_used_at TIMESTAMP,
        usage_count INTEGER DEFAULT 0,
        rate_limit INTEGER DEFAULT 100,
        expires_at TIMESTAMP,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Folders table
      CREATE TABLE IF NOT EXISTS folders (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(50) DEFAULT '#6366f1',
        icon VARCHAR(50) DEFAULT 'folder',
        parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
        prompt_count INTEGER DEFAULT 0,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Folder-Prompt junction table
      CREATE TABLE IF NOT EXISTS folder_prompts (
        id SERIAL PRIMARY KEY,
        folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
        prompt_id INTEGER REFERENCES prompt_templates(id) ON DELETE CASCADE,
        added_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(folder_id, prompt_id)
      );

      -- Snippets table
      CREATE TABLE IF NOT EXISTS snippets (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        description TEXT,
        language VARCHAR(50) DEFAULT 'text',
        tags TEXT[] DEFAULT '{}',
        is_pinned BOOLEAN DEFAULT false,
        usage_count INTEGER DEFAULT 0,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- AI Results table (persists all AI responses)
      CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        endpoint VARCHAR(100) NOT NULL,
        prompt_id INTEGER REFERENCES prompt_templates(id) ON DELETE SET NULL,
        result TEXT,
        result_json JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Add deployment columns if missing
      ALTER TABLE deployments ADD COLUMN IF NOT EXISTS hmac_secret VARCHAR(255);
      ALTER TABLE deployments ADD COLUMN IF NOT EXISTS deployment_key VARCHAR(255);
    `);
    console.log('Database tables initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

const provisionRuntimeAdmin = async () => {
  const email = process.env.PROVISION_ADMIN_EMAIL;
  const password = process.env.PROVISION_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('runtime admin credentials are required');
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (email, password, name, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET password=EXCLUDED.password, name=EXCLUDED.name, role='admin', updated_at=NOW()`,
    [email.toLowerCase(), hash, process.env.PROVISION_ADMIN_NAME || 'Runtime Admin']
  );
};

module.exports = { pool, initDB, provisionRuntimeAdmin };
