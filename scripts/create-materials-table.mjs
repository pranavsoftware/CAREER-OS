import { query, getPool } from '../src/lib/db.js';

async function main() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS materials (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL DEFAULT 'General',
        material_type VARCHAR(50) NOT NULL DEFAULT 'note',
        file_url TEXT,
        notes_content TEXT,
        target_branch VARCHAR(100) DEFAULT 'All',
        uploaded_by VARCHAR(255) DEFAULT 'University Placement Cell',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ materials table checked/created in PostgreSQL');

    // Check count
    const res = await query('SELECT count(*) FROM materials;');
    console.log('Materials count:', res.rows[0].count);

    if (parseInt(res.rows[0].count, 10) === 0) {
      // Seed a couple of initial high quality materials
      await query(`
        INSERT INTO materials (id, title, description, category, material_type, file_url, notes_content, target_branch, uploaded_by)
        VALUES 
        ('mat_1', 'DSA Cheat Sheet & Roadmap for Placements', 'Comprehensive sheet covering LeetCode top 150 patterns, Dynamic Programming, and Graph Traversals.', 'DSA & Algorithms', 'pdf', 'https://example.com/dsa-handbook.pdf', 'Key topics to master: 1. Sliding Window & Two Pointers 2. Binary Tree Inorder/Preorder/Postorder 3. BFS & DFS on Graphs 4. Top 20 Dynamic Programming archetypes.', 'All', 'Prof. Sharma (CSE Dept)'),
        ('mat_2', 'System Design Interview Masterclass', 'High level architecture design guide: Load Balancers, Caching strategies, Database Sharding, and Microservices.', 'System Design', 'video', 'https://www.youtube.com/watch?v=xpDnVSmNFX0', 'Points to remember during technical rounds: Always clarify functional and non-functional requirements first. Estimate scale (QPS, storage, bandwidth).', 'CSE', 'Campus Placement Training Cell'),
        ('mat_3', 'Behavioral Interview STAR Technique Notes', 'How to answer Situation, Task, Action, Result questions with high conviction.', 'Interview Prep', 'note', NULL, 'Use the STAR framework for all behavioral and leadership questions:\n- Situation: Set the scene (context, company, timeline)\n- Task: What was your specific responsibility\n- Action: Steps YOU took (use "I" instead of "we")\n- Result: Quantify impact (e.g. reduced latency by 35%)', 'All', 'Training & Placement Officer')
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log('Seeded initial materials');
    }

    const verify = await query('SELECT id, title, material_type, category FROM materials;');
    console.log('Current materials:', verify.rows);
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await getPool().end();
  }
}

main();
