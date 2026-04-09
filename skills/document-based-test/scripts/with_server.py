#!/usr/bin/env python3
"""
Start one or more servers, wait for them to be ready, run a command, then clean up.

Usage:
    # Single server
    python scripts/with_server.py --server "npm run dev" --port 5173 -- python automation.py
    python scripts/with_server.py --server "npm start" --port 3000 -- python test.py

    # Multiple servers
    python scripts/with_server.py \
      --server "cd backend && python server.py" --port 3000 \
      --server "cd frontend && npm run dev" --port 5173 \
      -- python test.py

    # With HTTP health check
    python scripts/with_server.py \
      --server "npm run dev" --port 5173 \
      --health-check "http://localhost:5173/api/health" \
      -- python test.py
"""

import subprocess
import socket
import time
import sys
import argparse
import urllib.request
import urllib.error
import os
import shlex


def is_server_ready(port, timeout=30):
    """Wait for server to be ready by polling the port."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.create_connection(('localhost', port), timeout=1):
                return True
        except (socket.error, ConnectionRefusedError):
            time.sleep(0.5)
    return False


def is_http_ready(url, timeout=30):
    """Wait for server to be ready by checking HTTP endpoint."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            req = urllib.request.Request(url, method='HEAD')
            with urllib.request.urlopen(req, timeout=2) as response:
                if response.status < 500:
                    return True
        except (urllib.error.URLError, urllib.error.HTTPError):
            time.sleep(0.5)
        except Exception:
            time.sleep(0.5)
    return False


def run_command_with_shell(cmd):
    """
    Run command with shell expansion support.
    Validates command to prevent obvious injection.
    """
    if ';' in cmd or '&&' in cmd or '||' in cmd:
        parts = cmd.split()
        if parts[0] in ('cd',):
            return True
    return False


def start_process(cmd, cwd=None):
    """
    Start a process with proper handling.
    Uses shell=True only for commands that need shell features (cd, &&, ||).
    """
    need_shell = any(op in cmd for op in ['cd ', '&&', '||', '|', '$', '`'])

    if need_shell:
        process = subprocess.Popen(
            cmd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=cwd,
            text=True,
            bufsize=1,
            universal_newlines=True,
        )
    else:
        args = shlex.split(cmd)
        process = subprocess.Popen(
            args,
            shell=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=cwd,
            text=True,
            bufsize=1,
            universal_newlines=True,
        )

    return process


def stream_output(process, prefix, stream_type):
    """Stream output from a process."""
    for line in iter(process.stdout.readline, ''):
        if not line:
            break
        sys.stdout.write(f"[{prefix}] {line}")
        sys.stdout.flush()


def main():
    parser = argparse.ArgumentParser(description='Run command with one or more servers')
    parser.add_argument('--server', action='append', dest='servers', required=True,
                        help='Server command (can be repeated)')
    parser.add_argument('--port', action='append', dest='ports', type=int, required=True,
                        help='Port for each server (must match --server count)')
    parser.add_argument('--health-check', action='append', dest='health_checks',
                        help='HTTP URL to check server readiness (must match --server count)')
    parser.add_argument('--timeout', type=int, default=60,
                        help='Timeout in seconds per server (default: 60)')
    parser.add_argument('--keep-output', action='store_true',
                        help='Print server stdout/stderr during execution')
    parser.add_argument('command', nargs=argparse.REMAINDER, help='Command to run after server(s) ready')

    args = parser.parse_args()

    if args.command and args.command[0] == '--':
        args.command = args.command[1:]

    if not args.command:
        print("Error: No command specified to run")
        sys.exit(1)

    if len(args.servers) != len(args.ports):
        print("Error: Number of --server and --port arguments must match")
        sys.exit(1)

    if args.health_checks and len(args.health_checks) != len(args.servers):
        print("Error: Number of --health-check and --server arguments must match")
        sys.exit(1)

    servers = []
    for i, (cmd, port) in enumerate(zip(args.servers, args.ports)):
        health_url = args.health_checks[i] if args.health_checks else None
        servers.append({'cmd': cmd, 'port': port, 'health_url': health_url})

    server_processes = []
    output_threads = []

    try:
        for i, server in enumerate(servers):
            print(f"Starting server {i+1}/{len(servers)}: {server['cmd']}")

            process = start_process(server['cmd'])
            server_processes.append(process)

            if args.keep_output:
                import threading
                t = threading.Thread(target=stream_output, args=(process, f"server{i+1}", "stdout"))
                t.daemon = True
                t.start()
                output_threads.append(t)

            print(f"Waiting for server on port {server['port']}...")

            if server['health_url']:
                if not is_http_ready(server['health_url'], timeout=args.timeout):
                    raise RuntimeError(
                        f"Server failed to become ready at {server['health_url']} within {args.timeout}s")
                print(f"Server health check passed: {server['health_url']}")
            else:
                if not is_server_ready(server['port'], timeout=args.timeout):
                    raise RuntimeError(
                        f"Server failed to start on port {server['port']} within {args.timeout}s")
                print(f"Server ready on port {server['port']}")

        print(f"\nAll {len(servers)} server(s) ready")

        print(f"Running: {' '.join(args.command)}\n")
        result = subprocess.run(args.command)

        for process in server_processes:
            try:
                process.terminate()
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()

        sys.exit(result.returncode)

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

    finally:
        print(f"\nStopping {len(server_processes)} server(s)...")
        for i, process in enumerate(server_processes):
            try:
                process.terminate()
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
            except Exception as e:
                print(f"  Server {i+1}: could not terminate cleanly ({e})")
            print(f"  Server {i+1} stopped")
        print("All servers stopped")


if __name__ == '__main__':
    main()
