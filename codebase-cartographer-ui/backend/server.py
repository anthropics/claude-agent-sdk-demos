#!/usr/bin/env python3
"""
API Server for Codebase Cartographer & Code Review Tools UI
Provides REST API endpoints to run analysis scripts and serve the web interface
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import subprocess
import json
import tempfile
import zipfile
from pathlib import Path
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = tempfile.mkdtemp()
RESULTS_FOLDER = tempfile.mkdtemp()
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['RESULTS_FOLDER'] = RESULTS_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max

# Path to the project root (two levels up from backend/)
PROJECT_ROOT = Path(__file__).parent.parent.parent
FRONTEND_DIR = Path(__file__).parent.parent / 'frontend'


def extract_skill_if_needed(skill_name):
    """Extract .skill file if not already extracted"""
    skill_file = PROJECT_ROOT / f'{skill_name}.skill'
    extract_dir = Path(__file__).parent / 'extracted_skills' / skill_name

    if not extract_dir.exists() and skill_file.exists():
        extract_dir.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(skill_file, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)

    return extract_dir


@app.route('/')
def index():
    """Serve the main UI"""
    return send_file(FRONTEND_DIR / 'index.html')


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })


@app.route('/api/cartographer/analyze', methods=['POST'])
def run_cartographer_analysis():
    """
    Run a specific cartographer analysis script

    Expected JSON body:
    {
        "tool": "hotspots|archaeology|dependencies|dataflow|jtbd",
        "repo_path": "/path/to/repo",
        "config": {
            "months": 6,
            "extensions": [".py", ".js"],
            ...
        }
    }
    """
    try:
        data = request.get_json()
        tool = data.get('tool')
        repo_path = data.get('repo_path')
        config = data.get('config', {})

        if not tool or not repo_path:
            return jsonify({'error': 'Missing required fields: tool, repo_path'}), 400

        if not os.path.exists(repo_path):
            return jsonify({'error': f'Repository path does not exist: {repo_path}'}), 400

        # Extract skill files if needed
        skill_dir = extract_skill_if_needed('codebase-cartographer')
        scripts_dir = skill_dir / 'scripts'

        # Map tool names to script files
        script_map = {
            'hotspots': 'analyze_hotspots.py',
            'archaeology': 'git_archaeology.py',
            'dependencies': 'build_dependency_graph.py',
            'dataflow': 'analyze_data_flow.py',
            'jtbd': 'map_jtbd_stories.py'
        }

        if tool not in script_map:
            return jsonify({'error': f'Unknown tool: {tool}'}), 400

        script_path = scripts_dir / script_map[tool]

        if not script_path.exists():
            return jsonify({
                'error': f'Script not found: {script_path}',
                'help': 'Make sure the codebase-cartographer.skill file is in the same directory'
            }), 404

        # Build command with configuration
        cmd = ['python3', str(script_path), repo_path]

        # Add configuration options based on tool
        if tool == 'hotspots' and config.get('months'):
            cmd.extend(['--months', str(config['months'])])

        # Run the analysis
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )

        # Parse output
        output = {
            'tool': tool,
            'repo_path': repo_path,
            'timestamp': datetime.now().isoformat(),
            'success': result.returncode == 0,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'exit_code': result.returncode
        }

        # Try to parse JSON output if available
        try:
            # Look for JSON in the output
            output_lines = result.stdout.split('\n')
            for line in output_lines:
                if line.strip().startswith('{') or line.strip().startswith('['):
                    output['data'] = json.loads(line)
                    break
        except json.JSONDecodeError:
            pass

        return jsonify(output)

    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Analysis timed out after 5 minutes'}), 408
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/cartographer/full-analysis', methods=['POST'])
def run_full_analysis():
    """
    Run all cartographer analyses and generate Mandala Chart data

    Expected JSON body:
    {
        "repo_path": "/path/to/repo",
        "config": {...}
    }
    """
    try:
        data = request.get_json()
        repo_path = data.get('repo_path')

        if not repo_path or not os.path.exists(repo_path):
            return jsonify({'error': 'Invalid repository path'}), 400

        # Run all analyses
        tools = ['hotspots', 'archaeology', 'dependencies', 'dataflow', 'jtbd']
        results = {}

        for tool in tools:
            analysis_result = run_single_analysis(tool, repo_path, data.get('config', {}))
            results[tool] = analysis_result

        # Generate Mandala Chart data structure
        mandala_data = generate_mandala_chart(results)

        return jsonify({
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'individual_results': results,
            'mandala_chart': mandala_data
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def run_single_analysis(tool, repo_path, config):
    """Helper function to run a single analysis"""
    skill_dir = extract_skill_if_needed('codebase-cartographer')
    scripts_dir = skill_dir / 'scripts'

    script_map = {
        'hotspots': 'analyze_hotspots.py',
        'archaeology': 'git_archaeology.py',
        'dependencies': 'build_dependency_graph.py',
        'dataflow': 'analyze_data_flow.py',
        'jtbd': 'map_jtbd_stories.py'
    }

    script_path = scripts_dir / script_map[tool]
    cmd = ['python3', str(script_path), repo_path]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        return {
            'success': result.returncode == 0,
            'output': result.stdout,
            'error': result.stderr
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def generate_mandala_chart(analysis_results):
    """
    Transform analysis results into Mandala Chart data structure

    Returns:
    {
        "center": {
            "core_purpose": "...",
            "health_score": 0-100,
            "primary_language": "..."
        },
        "rings": [
            {
                "name": "Data Plane",
                "segments": [...]
            },
            ...
        ],
        "temporal_coupling": [...],
        "knowledge_silos": [...]
    }
    """
    # This is a simplified version - the full implementation would parse
    # the actual output from each script

    mandala = {
        'center': {
            'core_purpose': 'Unknown Project',
            'health_score': 75,
            'primary_language': 'Python'
        },
        'rings': [
            {
                'name': 'Data Plane',
                'segments': []
            },
            {
                'name': 'Control Plane',
                'segments': []
            },
            {
                'name': 'Management Plane',
                'segments': []
            }
        ],
        'temporal_coupling': [],
        'knowledge_silos': []
    }

    # Parse hotspots data if available
    if analysis_results.get('hotspots', {}).get('success'):
        # Add hotspot segments to appropriate rings
        pass

    # Parse archaeology data for knowledge silos
    if analysis_results.get('archaeology', {}).get('success'):
        # Extract knowledge silo information
        pass

    return mandala


@app.route('/api/code-review/analyze', methods=['POST'])
def run_code_review():
    """
    Analyze a pull request or code changes

    Expected JSON body:
    {
        "pr_url": "https://github.com/user/repo/pull/123",
        OR
        "diff": "git diff output",
        "files": [...],
        "stage": "pre-review|understanding|code-review|feedback"
    }
    """
    try:
        data = request.get_json()
        pr_url = data.get('pr_url')
        diff = data.get('diff')
        stage = data.get('stage', 'pre-review')

        # Extract code review skill if needed
        skill_dir = extract_skill_if_needed('code-review-skill')

        # Initialize review checklist based on stage
        checklist = generate_review_checklist(stage, data)

        return jsonify({
            'success': True,
            'stage': stage,
            'checklist': checklist,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def generate_review_checklist(stage, data):
    """Generate checklist items based on review stage"""
    checklists = {
        'pre-review': [
            {
                'id': 'pr_description',
                'text': 'PR has clear description explaining problem, why, and alternatives',
                'priority': 'blocking',
                'passed': None
            },
            {
                'id': 'screenshots',
                'text': 'Before/after screenshots included (responsive versions for UI changes)',
                'priority': 'blocking',
                'passed': None
            },
            {
                'id': 'ai_disclosure',
                'text': 'AI usage disclosed if applicable',
                'priority': 'blocking',
                'passed': None
            },
            {
                'id': 'tests_passing',
                'text': 'Test suite passes',
                'priority': 'blocking',
                'passed': None
            }
        ],
        'understanding': [
            {
                'id': 'root_cause',
                'text': 'Root cause identified and addressed',
                'priority': 'important',
                'passed': None
            },
            {
                'id': 'context',
                'text': 'Historical context understood',
                'priority': 'important',
                'passed': None
            }
        ],
        'code-review': [
            {
                'id': 'architecture',
                'text': 'Code is in the right architectural layer',
                'priority': 'blocking',
                'passed': None
            },
            {
                'id': 'patterns',
                'text': 'Follows existing patterns and conventions',
                'priority': 'important',
                'passed': None
            },
            {
                'id': 'naming',
                'text': 'Clear, self-explanatory naming',
                'priority': 'important',
                'passed': None
            },
            {
                'id': 'dry',
                'text': 'Follows DRY principle',
                'priority': 'important',
                'passed': None
            }
        ],
        'feedback': [
            {
                'id': 'feedback_clear',
                'text': 'Feedback is clear and actionable',
                'priority': 'important',
                'passed': None
            }
        ]
    }

    return checklists.get(stage, [])


@app.route('/api/list-tools', methods=['GET'])
def list_tools():
    """List all available tools and their status"""
    tools = {
        'cartographer': {
            'hotspots': {
                'name': 'Hotspot Analysis',
                'description': 'Identify high-complexity, high-churn files',
                'script': 'analyze_hotspots.py'
            },
            'archaeology': {
                'name': 'Git Archaeology',
                'description': 'Extract institutional knowledge from version control',
                'script': 'git_archaeology.py'
            },
            'dependencies': {
                'name': 'Dependency Graph',
                'description': 'Visualize module relationships',
                'script': 'build_dependency_graph.py'
            },
            'dataflow': {
                'name': 'Data Flow Mapping',
                'description': 'Map architectural planes',
                'script': 'analyze_data_flow.py'
            },
            'jtbd': {
                'name': 'JTBD Story Extraction',
                'description': 'Extract user journeys from code',
                'script': 'map_jtbd_stories.py'
            }
        },
        'code_review': {
            'status': 'available',
            'stages': ['pre-review', 'understanding', 'code-review', 'feedback']
        }
    }

    return jsonify(tools)


if __name__ == '__main__':
    print("=" * 60)
    print("Codebase Cartographer & Code Review Tools API Server")
    print("=" * 60)
    print(f"\nServer starting...")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print(f"Results folder: {RESULTS_FOLDER}")
    print(f"\nAccess the UI at: http://localhost:5000")
    print(f"API documentation at: http://localhost:5000/api/health")
    print("\nPress Ctrl+C to stop the server\n")

    app.run(debug=True, host='0.0.0.0', port=5000)
