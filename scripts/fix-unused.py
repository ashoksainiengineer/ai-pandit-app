#!/usr/bin/env python3
"""
Auto-fix TypeScript unused variable/parameter/import errors.
Usage: python fix-unused.py /path/to/error-output.txt /path/to/project-root
"""

import re
import sys
import os
import shutil

def parse_error_line(line):
    """Parse a TypeScript error line to extract file, line, col, and var name."""
    # Pattern: file(line,col): error TS6133: 'VarName' is declared but its value is never read.
    # Pattern: file(line,col): error TS6196: 'TypeName' is declared but never used.
    match = re.match(r"(.+)\((\d+),(\d+)\):\s*error\s+TS\d+:\s*'([^']+)'\s+is\s+declared\s+but(?:\s+its\s+value\s+is\s+never\s+read|never\s+used)", line)
    if match:
        return {
            'file': match.group(1),
            'line': int(match.group(2)),
            'col': int(match.group(3)),
            'name': match.group(4)
        }
    return None

def remove_from_import(content, var_name):
    """Remove a variable from an import statement."""
    # Pattern: import { A, B, VarName, C } from '...'
    # or: import { VarName } from '...'
    # or: import VarName from '...'
    # or: import * as VarName from '...'
    
    lines = content.split('\n')
    new_lines = []
    modified = False
    
    for line in lines:
        if f"'{var_name}'" in line and 'import' in line:
            # Handle: import { A, VarName, B } from '...'
            # Handle: import { VarName } from '...'
            # Handle: import VarName from '...'
            
            # Check if it's a named import
            if '{' in line and '}' in line:
                # Extract content between braces
                match = re.search(r'\{([^}]+)\}', line)
                if match and var_name in match.group(1):
                    imports = [i.strip() for i in match.group(1).split(',')]
                    imports = [i for i in imports if i and i != var_name]
                    
                    if not imports:
                        # Remove entire import line
                        modified = True
                        continue
                    else:
                        # Rebuild import with remaining items
                        new_imports = ', '.join(imports)
                        line = re.sub(r'\{[^}]+\}', f'{{ {new_imports} }}', line, count=1)
                        modified = True
            
            # Check if it's a default import
            elif re.search(rf'\bimport\s+{re.escape(var_name)}\s+from', line):
                modified = True
                continue
                
            # Check if it's a namespace import
            elif re.search(rf'\bimport\s+\*\s+as\s+{re.escape(var_name)}\s+from', line):
                modified = True
                continue
        
        new_lines.append(line)
    
    return '\n'.join(new_lines), modified

def remove_variable_declaration(content, line_num, var_name):
    """Remove a variable declaration line."""
    lines = content.split('\n')
    if 0 <= line_num - 1 < len(lines):
        line = lines[line_num - 1]
        
        # Check if this line declares the variable
        if var_name in line:
            # Pattern: const varName = ...
            # Pattern: let varName = ...
            # Pattern: var varName = ...
            # Pattern: const [varName, setVarName] = ...
            # Pattern: const { varName } = ...
            
            # Simple case: single declaration on its own line
            if re.search(rf'\b(?:const|let|var)\s+(?:\w+\s*,\s*)*{re.escape(var_name)}(?:\s*,\s*\w+)*\s*[;=]', line):
                # Check if it's part of a destructuring
                if '{' in line or '[' in line:
                    # Complex case - just comment it out for now
                    lines[line_num - 1] = f"// REMOVED_UNUSED: {line.strip()}"
                    return '\n'.join(lines), True
                else:
                    # Simple case - remove the line
                    del lines[line_num - 1]
                    return '\n'.join(lines), True
            
            # Type declaration: type VarName = ...
            if re.search(rf'\btype\s+{re.escape(var_name)}\b', line):
                del lines[line_num - 1]
                return '\n'.join(lines), True
                
            # Interface declaration: interface VarName ...
            if re.search(rf'\binterface\s+{re.escape(var_name)}\b', line):
                del lines[line_num - 1]
                return '\n'.join(lines), True
    
    return content, False

def fix_file(file_path, error_info):
    """Fix unused code in a file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"  ⚠️ Could not read {file_path}: {e}")
        return False
    
    modified = False
    var_name = error_info['name']
    line_num = error_info['line']
    
    # Try to remove from import first
    new_content, import_modified = remove_from_import(content, var_name)
    if import_modified:
        content = new_content
        modified = True
        print(f"  ✅ Removed '{var_name}' from import")
    else:
        # Try to remove variable declaration
        new_content, var_modified = remove_variable_declaration(content, line_num, var_name)
        if var_modified:
            content = new_content
            modified = True
            print(f"  ✅ Removed unused variable '{var_name}' at line {line_num}")
        else:
            # Try to prefix parameter with underscore
            lines = content.split('\n')
            if 0 <= line_num - 1 < len(lines):
                line = lines[line_num - 1]
                # Check if it's a function parameter
                if re.search(rf'\b{re.escape(var_name)}\b', line):
                    # Replace parameter name with _version
                    new_line = re.sub(rf'\b{re.escape(var_name)}\b', f'_{var_name}', line, count=1)
                    if new_line != line:
                        lines[line_num - 1] = new_line
                        content = '\n'.join(lines)
                        modified = True
                        print(f"  ✅ Prefixed parameter '{var_name}' with underscore at line {line_num}")
    
    if modified:
        # Backup original
        backup_path = file_path + '.backup'
        shutil.copy2(file_path, backup_path)
        
        # Write modified content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
    
    print(f"  ⚠️ Could not auto-fix '{var_name}' in {file_path}")
    return False

def main():
    if len(sys.argv) != 3:
        print("Usage: python fix-unused.py <error-file> <project-root>")
        sys.exit(1)
    
    error_file = sys.argv[1]
    project_root = sys.argv[2]
    
    with open(error_file, 'r') as f:
        lines = f.readlines()
    
    print(f"Processing {len(lines)} errors...")
    print("=" * 60)
    
    fixed = 0
    failed = 0
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        error_info = parse_error_line(line)
        if not error_info:
            print(f"Could not parse: {line}")
            failed += 1
            continue
        
        file_path = os.path.join(project_root, error_info['file'])
        print(f"\n🔧 {error_info['file']}:{error_info['line']} - '{error_info['name']}'")
        
        if os.path.exists(file_path):
            if fix_file(file_path, error_info):
                fixed += 1
            else:
                failed += 1
        else:
            print(f"  ⚠️ File not found: {file_path}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"Fixed: {fixed}, Failed: {failed}, Total: {len(lines)}")
    print("\nBackup files created with .backup extension")
    print("Review changes with: git diff")
    print("Restore if needed with: mv file.backup file")

if __name__ == '__main__':
    main()
