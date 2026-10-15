import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * Extracts raw username from string or full URL (e.g. "https://github.com/octocat" -> "octocat")
 */
function cleanGithubUsername(input) {
  if (!input) return '';
  let cleaned = input.trim();
  cleaned = cleaned.replace(/^https?:\/\/(www\.)?github\.com\//i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  cleaned = cleaned.replace(/^@/, '');
  return cleaned;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { studentId, githubUsername, action = 'sync', projectToToggle } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    // 1. Action: Disconnect GitHub
    if (action === 'disconnect') {
      const studentRes = await query('SELECT projects FROM students WHERE id = $1', [studentId]);
      if (studentRes.rows.length === 0) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }
      
      const currentProjects = studentRes.rows[0].projects || [];
      // Keep only non-github manual projects if requested, or keep all with isGithub: false
      const remainingProjects = currentProjects.filter(p => !p.isGithub && !p.id?.startsWith('gh_'));

      await query(
        `UPDATE students SET github = NULL, projects = $1::jsonb, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(remainingProjects), studentId]
      );

      return NextResponse.json({
        success: true,
        message: 'GitHub account disconnected successfully',
        github: null,
        projects: remainingProjects,
      });
    }

    // 2. Action: Toggle Pin / Featured state for a specific project
    if (action === 'togglePin') {
      if (!projectToToggle) {
        return NextResponse.json({ error: 'projectToToggle id is required' }, { status: 400 });
      }
      const studentRes = await query('SELECT projects FROM students WHERE id = $1', [studentId]);
      if (studentRes.rows.length === 0) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      const currentProjects = studentRes.rows[0].projects || [];
      const updatedProjects = currentProjects.map(p => {
        if (p.id === projectToToggle) {
          return { ...p, featured: !p.featured };
        }
        return p;
      });

      await query(
        `UPDATE students SET projects = $1::jsonb, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(updatedProjects), studentId]
      );

      return NextResponse.json({
        success: true,
        projects: updatedProjects,
      });
    }

    // 3. Action: Sync or Preview GitHub repos
    const username = cleanGithubUsername(githubUsername);
    if (!username) {
      return NextResponse.json({ error: 'A valid GitHub username or URL is required' }, { status: 400 });
    }

    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Career-OS-Student-Portal/1.0',
    };

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    // Fetch user profile from GitHub
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers });
    
    if (userRes.status === 404) {
      return NextResponse.json({ error: `GitHub user "${username}" was not found. Please check spelling.` }, { status: 404 });
    }

    if (!userRes.ok) {
      const errText = await userRes.text();
      return NextResponse.json({ 
        error: `GitHub API error (${userRes.status}): ${userRes.status === 403 ? 'Rate limit exceeded, please try again shortly.' : errText}` 
      }, { status: userRes.status });
    }

    const userData = await userRes.json();

    // Fetch user public repos (sorted by recently updated)
    const reposRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=60&type=owner`,
      { headers }
    );

    if (!reposRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch repositories from GitHub' }, { status: reposRes.status });
    }

    const rawRepos = await reposRes.json();

    // Transform repositories into standardized project schema
    const githubProjects = rawRepos.map(repo => {
      const technologies = [];
      if (repo.language) technologies.push(repo.language);
      if (Array.isArray(repo.topics)) {
        repo.topics.forEach(t => {
          if (!technologies.includes(t)) technologies.push(t);
        });
      }

      return {
        id: `gh_${repo.id}`,
        githubId: repo.id,
        title: repo.name,
        description: repo.description || `Public repository on GitHub (${repo.language || 'Codebase'})`,
        technologies: technologies.length > 0 ? technologies : ['Code'],
        link: repo.html_url,
        demoLink: repo.homepage || '',
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        language: repo.language || 'General',
        topics: repo.topics || [],
        year: repo.updated_at ? new Date(repo.updated_at).getFullYear() : new Date().getFullYear(),
        updatedAt: repo.updated_at,
        isGithub: true,
        featured: repo.stargazers_count > 0 || !repo.fork,
        isFork: Boolean(repo.fork),
        openIssues: repo.open_issues_count || 0,
        license: repo.license?.spdx_id || null,
        defaultBranch: repo.default_branch || 'main',
      };
    });

    // If preview mode, just return the data without writing to database
    if (action === 'preview') {
      return NextResponse.json({
        success: true,
        profile: {
          username: userData.login,
          name: userData.name || userData.login,
          avatarUrl: userData.avatar_url,
          bio: userData.bio,
          publicRepos: userData.public_repos,
          followers: userData.followers,
          htmlUrl: userData.html_url,
        },
        projects: githubProjects,
      });
    }

    // Persist into database for the student
    const studentRes = await query('SELECT projects FROM students WHERE id = $1', [studentId]);
    if (studentRes.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found in database' }, { status: 404 });
    }

    const existingProjects = studentRes.rows[0].projects || [];
    // Preserve manual projects
    const manualProjects = existingProjects.filter(p => !p.isGithub && !p.id?.startsWith('gh_'));

    // Preserve custom pinned/featured flags if user previously set them for any existing gh_ project
    const previousFeaturedMap = new Map();
    existingProjects.forEach(p => {
      if (p.isGithub && typeof p.featured === 'boolean') {
        previousFeaturedMap.set(p.id, p.featured);
      }
    });

    const mergedGithubProjects = githubProjects.map(gp => {
      if (previousFeaturedMap.has(gp.id)) {
        return { ...gp, featured: previousFeaturedMap.get(gp.id) };
      }
      return gp;
    });

    const allProjects = [...manualProjects, ...mergedGithubProjects];
    const githubUrl = userData.html_url || `https://github.com/${username}`;

    await query(
      `UPDATE students 
       SET github = $1, 
           projects = $2::jsonb, 
           updated_at = NOW() 
       WHERE id = $3`,
      [githubUrl, JSON.stringify(allProjects), studentId]
    );

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${githubProjects.length} repositories from GitHub @${username}`,
      github: githubUrl,
      profile: {
        username: userData.login,
        name: userData.name || userData.login,
        avatarUrl: userData.avatar_url,
        bio: userData.bio,
        publicRepos: userData.public_repos,
        followers: userData.followers,
        htmlUrl: userData.html_url,
      },
      projects: allProjects,
      syncedCount: githubProjects.length,
    });
  } catch (error) {
    console.error('GitHub Sync API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
