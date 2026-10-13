package infosys.onlinecodeplate.model;

import java.util.*;

public class LanguageRegistry {

    public static class LanguageInfo {
        private final String id;
        private final String name;
        private final String monacoLanguage;
        private final String extension;
        private final String dockerImage;
        private final String compileCommand;
        private final String runCommand;
        private final boolean compiled;
        private final String defaultStarterCode;

        public LanguageInfo(String id, String name, String monacoLanguage, String extension,
                            String dockerImage, String compileCommand, String runCommand,
                            boolean compiled, String defaultStarterCode) {
            this.id = id;
            this.name = name;
            this.monacoLanguage = monacoLanguage;
            this.extension = extension;
            this.dockerImage = dockerImage;
            this.compileCommand = compileCommand;
            this.runCommand = runCommand;
            this.compiled = compiled;
            this.defaultStarterCode = defaultStarterCode;
        }

        public String getId() { return id; }
        public String getName() { return name; }
        public String getMonacoLanguage() { return monacoLanguage; }
        public String getExtension() { return extension; }
        public String getDockerImage() { return dockerImage; }
        public String getCompileCommand() { return compileCommand; }
        public String getRunCommand() { return runCommand; }
        public boolean isCompiled() { return compiled; }
        public String getDefaultStarterCode() { return defaultStarterCode; }
    }

    private static final Map<String, LanguageInfo> REGISTRY = new LinkedHashMap<>();

    static {
        // 1. JAVA
        register(new LanguageInfo(
            "JAVA",
            "Java 17 (OpenJDK)",
            "java",
            ".java",
            "eclipse-temurin:17-jdk",
            "javac Solution.java",
            "java Solution",
            true,
            "import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // Write your solution here\n    }\n}\n"
        ));

        // 2. PYTHON
        register(new LanguageInfo(
            "PYTHON",
            "Python 3 (CPython)",
            "python",
            ".py",
            "python:3.11-slim",
            null,
            "python solution.py",
            false,
            "import sys\n\ndef main():\n    # Read input from standard input\n    input_data = sys.stdin.read().split()\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    main()\n"
        ));

        // 3. CPP
        register(new LanguageInfo(
            "CPP",
            "C++ 20 (GCC)",
            "cpp",
            ".cpp",
            "gcc:latest",
            "g++ -O3 solution.cpp -o program",
            "./program",
            true,
            "#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // Write your C++ solution here\n    return 0;\n}\n"
        ));

        // 4. C
        register(new LanguageInfo(
            "C",
            "C (GCC 11)",
            "c",
            ".c",
            "gcc:latest",
            "gcc -O3 solution.c -o program",
            "./program",
            true,
            "#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main() {\n    // Write your C solution here\n    return 0;\n}\n"
        ));

        // 5. JAVASCRIPT
        register(new LanguageInfo(
            "JAVASCRIPT",
            "JavaScript (Node.js 20)",
            "javascript",
            ".js",
            "node:20-slim",
            null,
            "node solution.js",
            false,
            "const fs = require('fs');\n\nfunction main() {\n    const input = fs.readFileSync(0, 'utf-8').trim();\n    // Write your solution here\n}\n\nmain();\n"
        ));

        // 6. GO (Additional Language 1)
        register(new LanguageInfo(
            "GO",
            "Go 1.22 (Golang)",
            "go",
            ".go",
            "golang:1.22-alpine",
            "go build -o program solution.go",
            "./program",
            true,
            "package main\n\nimport (\n\t\"bufio\"\n\t\"fmt\"\n\t\"os\"\n)\n\nfunc main() {\n\tscanner := bufio.NewScanner(os.Stdin)\n\t_ = scanner\n\t// Write your Go solution here\n}\n"
        ));

        // 7. RUST (Additional Language 2)
        register(new LanguageInfo(
            "RUST",
            "Rust 1.77",
            "rust",
            ".rs",
            "rust:1.77-slim",
            "rustc -O solution.rs -o program",
            "./program",
            true,
            "use std::io::{self, Read};\n\nfn main() {\n    let mut input = String::new();\n    io::stdin().read_to_string(&mut input).unwrap();\n    // Write your Rust solution here\n}\n"
        ));

        // 8. TYPESCRIPT (Bonus clean Node/TS support)
        register(new LanguageInfo(
            "TYPESCRIPT",
            "TypeScript (Node.js / TS)",
            "typescript",
            ".ts",
            "node:20-slim",
            null,
            "node solution.js",
            false,
            "import * as fs from 'fs';\n\nfunction main(): void {\n    const input: string = fs.readFileSync(0, 'utf-8').trim();\n    // Write your TypeScript solution here\n}\n\nmain();\n"
        ));
    }

    private static void register(LanguageInfo info) {
        REGISTRY.put(info.getId().toUpperCase(), info);
    }

    public static Collection<LanguageInfo> getAllLanguages() {
        return Collections.unmodifiableCollection(REGISTRY.values());
    }

    public static Set<String> getAllLanguageIds() {
        return Collections.unmodifiableSet(REGISTRY.keySet());
    }

    public static LanguageInfo getLanguage(String id) {
        if (id == null) return null;
        String normalized = normalize(id);
        return REGISTRY.get(normalized);
    }

    public static boolean isSupported(String id) {
        if (id == null) return false;
        String normalized = normalize(id);
        return "MCQ".equalsIgnoreCase(normalized) || REGISTRY.containsKey(normalized);
    }

    public static String normalize(String id) {
        if (id == null) return "";
        String trimmed = id.trim().toUpperCase();
        switch (trimmed) {
            case "C++":
            case "CPLUSPLUS":
                return "CPP";
            case "JS":
            case "NODE":
            case "NODEJS":
                return "JAVASCRIPT";
            case "TS":
                return "TYPESCRIPT";
            case "GOLANG":
                return "GO";
            case "RS":
                return "RUST";
            case "PY":
            case "PYTHON3":
                return "PYTHON";
            default:
                return trimmed;
        }
    }

    public static String getMonacoLanguage(String id) {
        LanguageInfo info = getLanguage(id);
        return info != null ? info.getMonacoLanguage() : "plaintext";
    }

    public static String getDefaultStarterCode(String id) {
        LanguageInfo info = getLanguage(id);
        return info != null ? info.getDefaultStarterCode() : "";
    }
}
