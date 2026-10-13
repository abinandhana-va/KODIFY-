/**
 * Central Language Registry for KODIFY
 * Single source of truth for supported programming languages across
 * Assignment Creation, Contest Creation, Problem Creation, Monaco Editor, and Submissions.
 */

export const SUPPORTED_LANGUAGES = [
  {
    id: 'JAVA',
    name: 'Java',
    version: '17 (OpenJDK)',
    monacoLang: 'java',
    extension: '.java',
    compiled: true,
    defaultStarterCode: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Write your solution here
    }
}
`
  },
  {
    id: 'PYTHON',
    name: 'Python',
    version: '3.11 (CPython)',
    monacoLang: 'python',
    extension: '.py',
    compiled: false,
    defaultStarterCode: `import sys

def main():
    # Read input from standard input
    input_data = sys.stdin.read().split()
    # Write your solution here
    pass

if __name__ == '__main__':
    main()
`
  },
  {
    id: 'CPP',
    name: 'C++',
    version: '20 (GCC)',
    monacoLang: 'cpp',
    extension: '.cpp',
    compiled: true,
    defaultStarterCode: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    // Write your C++ solution here
    return 0;
}
`
  },
  {
    id: 'C',
    name: 'C',
    version: '11 (GCC)',
    monacoLang: 'c',
    extension: '.c',
    compiled: true,
    defaultStarterCode: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // Write your C solution here
    return 0;
}
`
  },
  {
    id: 'JAVASCRIPT',
    name: 'JavaScript',
    version: 'Node.js 20',
    monacoLang: 'javascript',
    extension: '.js',
    compiled: false,
    defaultStarterCode: `const fs = require('fs');

function main() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    // Write your JavaScript solution here
}

main();
`
  },
  {
    id: 'GO',
    name: 'Go',
    version: '1.22 (Golang)',
    monacoLang: 'go',
    extension: '.go',
    compiled: true,
    defaultStarterCode: `package main

import (
\t"bufio"
\t"fmt"
\t"os"
)

func main() {
\tscanner := bufio.NewScanner(os.Stdin)
\t_ = scanner
\t// Write your Go solution here
}
`
  },
  {
    id: 'RUST',
    name: 'Rust',
    version: '1.77',
    monacoLang: 'rust',
    extension: '.rs',
    compiled: true,
    defaultStarterCode: `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    // Write your Rust solution here
}
`
  },
  {
    id: 'TYPESCRIPT',
    name: 'TypeScript',
    version: 'Node.js / TS',
    monacoLang: 'typescript',
    extension: '.ts',
    compiled: false,
    defaultStarterCode: `import * as fs from 'fs';

function main(): void {
    const input: string = fs.readFileSync(0, 'utf-8').trim();
    // Write your TypeScript solution here
}

main();
`
  }
];

export const ALL_LANGUAGE_IDS = SUPPORTED_LANGUAGES.map(l => l.id);

export const DEFAULT_ALLOWED_LANGUAGES = ['JAVA', 'PYTHON', 'CPP', 'C', 'JAVASCRIPT', 'GO', 'RUST', 'TYPESCRIPT'];

export function normalizeLanguageId(lang) {
  if (!lang) return 'PYTHON';
  const str = String(lang).trim().toUpperCase();
  if (str === 'C++' || str === 'CPLUSPLUS') return 'CPP';
  if (str === 'JS' || str === 'NODE' || str === 'NODEJS') return 'JAVASCRIPT';
  if (str === 'TS') return 'TYPESCRIPT';
  if (str === 'GOLANG') return 'GO';
  if (str === 'RS') return 'RUST';
  if (str === 'PY' || str === 'PYTHON3') return 'PYTHON';
  return str;
}

export function getLanguageById(id) {
  const norm = normalizeLanguageId(id);
  return SUPPORTED_LANGUAGES.find(l => l.id === norm) || SUPPORTED_LANGUAGES[0];
}

export function getMonacoLanguage(id) {
  const langObj = getLanguageById(id);
  return langObj ? langObj.monacoLang : 'plaintext';
}

export function getDefaultStarterCode(id) {
  const langObj = getLanguageById(id);
  return langObj ? langObj.defaultStarterCode : '';
}

/**
 * Given a problem object and its allowedLanguages list, returns the filtered
 * list of supported languages available for this specific question.
 */
export function getAvailableLanguagesForProblem(problem) {
  if (!problem) return SUPPORTED_LANGUAGES;
  const allowed = problem.allowedLanguages;
  if (!allowed || !Array.isArray(allowed) || allowed.length === 0) {
    // Legacy problem: all languages allowed
    return SUPPORTED_LANGUAGES;
  }
  const allowedNorm = allowed.map(normalizeLanguageId);
  const filtered = SUPPORTED_LANGUAGES.filter(l => allowedNorm.includes(l.id));
  return filtered.length > 0 ? filtered : SUPPORTED_LANGUAGES;
}
