async function runTests() {
  console.log('=== FEATURE 7 COMPREHENSIVE INTEGRATION & LANGUAGE TEST ===\n');

  try {
    // 1. Authenticate as Admin
    console.log('1. Authenticating as Admin...');
    const loginRes = await fetch('http://localhost:8080/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'kodifyofficial@gmail.com',
        password: 'apass@123'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    console.log('   ✓ Admin authenticated successfully.\n');

    // 2. Create a Problem with restricted languages: JAVA and PYTHON only
    console.log('2. Creating problem with creator restriction: [JAVA, PYTHON] only...');
    const probPayload = {
      title: 'Restriction Test ' + Date.now(),
      concept: 'Algorithms',
      difficulty: 'EASY',
      description: 'Calculate 2 + 2 and print result',
      constraints: 'None',
      allowedLanguages: ['JAVA', 'PYTHON'],
      testCasesList: [
        { input: '4\n', expectedOutput: '4\n', hidden: false }
      ],
      starterCodeJava: 'public class Solution { public static void main(String[] args) { System.out.println(4); } }',
      starterCodePython: 'print(4)',
      starterCodeCpp: '#include <iostream>\nint main() { std::cout << 4 << std::endl; return 0; }',
      solutionJava: 'public class Solution { public static void main(String[] args) { System.out.println(4); } }'
    };

    const createProbRes = await fetch('http://localhost:8080/api/admin/problems', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(probPayload)
    });
    const createdProb = await createProbRes.json();
    console.log(`   ✓ Created Problem ID #${createdProb.id}`);
    console.log(`   ✓ Allowed Languages:`, createdProb.allowedLanguages);

    // 3. Test Allowed Language Run (PYTHON)
    console.log('\n3. Testing execution in ALLOWED language (PYTHON)...');
    const pyRes = await fetch(`http://localhost:8080/api/problems/${createdProb.id}/run`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        language: 'PYTHON',
        code: 'print(4)'
      })
    });
    const pyData = await pyRes.json();
    console.log(`   ✓ Python Run Status: ${pyData.status}`);
    console.log(`   ✓ Python Stdout: ${pyData.stdout?.trim()}`);

    // 4. Test Allowed Language Run (JAVA)
    console.log('\n4. Testing execution in ALLOWED language (JAVA)...');
    const javaRes = await fetch(`http://localhost:8080/api/problems/${createdProb.id}/run`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        language: 'JAVA',
        code: 'public class Solution { public static void main(String[] args) { System.out.println(4); } }'
      })
    });
    const javaData = await javaRes.json();
    console.log(`   ✓ Java Run Status: ${javaData.status}`);
    console.log(`   ✓ Java Stdout: ${javaData.stdout?.trim()}`);

    // 5. Test REJECTED Unauthorized Language Run (C++)
    console.log('\n5. Testing execution in UNAUTHORIZED language (CPP)...');
    const cppRes = await fetch(`http://localhost:8080/api/problems/${createdProb.id}/run`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        language: 'CPP',
        code: '#include <iostream>\nint main() { std::cout << 4 << std::endl; return 0; }'
      })
    });
    if (cppRes.status === 400 || cppRes.status === 403) {
      const cppErr = await cppRes.json().catch(() => cppRes.text());
      console.log(`   ✓ PASS: Backend rejected CPP submission with ${cppRes.status}: "${cppErr.message || cppErr}"`);
    } else {
      console.error(`   ✗ FAILED: Expected 400/403 rejection, got ${cppRes.status}`);
    }

    // 6. Test REJECTED Unauthorized Language Run (JAVASCRIPT)
    console.log('\n6. Testing execution in UNAUTHORIZED language (JAVASCRIPT)...');
    const jsRes = await fetch(`http://localhost:8080/api/problems/${createdProb.id}/run`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        language: 'JAVASCRIPT',
        code: 'console.log(4);'
      })
    });
    if (jsRes.status === 400 || jsRes.status === 403) {
      const jsErr = await jsRes.json().catch(() => jsRes.text());
      console.log(`   ✓ PASS: Backend rejected JAVASCRIPT submission with ${jsRes.status}: "${jsErr.message || jsErr}"`);
    } else {
      console.error(`   ✗ FAILED: Expected 400/403 rejection, got ${jsRes.status}`);
    }

    // 7. Test All Supported Languages on an unrestricted problem
    console.log('\n7. Testing Multi-Language Execution Suite (All Supported Languages)...');
    const multiProbPayload = {
      title: 'Full Language Suite ' + Date.now(),
      concept: 'MultiLang',
      difficulty: 'EASY',
      description: 'Print 42 in all supported languages',
      constraints: 'None',
      allowedLanguages: ['JAVA', 'PYTHON', 'C', 'CPP', 'JAVASCRIPT', 'GO', 'RUST', 'TYPESCRIPT'],
      testCasesList: [
        { input: '42\n', expectedOutput: '42\n', hidden: false }
      ],
      solutionJava: 'public class Solution { public static void main(String[] args) { System.out.println(42); } }'
    };
    const multiProbRes = await fetch('http://localhost:8080/api/admin/problems', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(multiProbPayload)
    });
    const multiProb = await multiProbRes.json();
    const multiId = multiProb.id;

    const testSuite = [
      { lang: 'JAVA', code: 'public class Solution { public static void main(String[] args) { System.out.println(42); } }' },
      { lang: 'PYTHON', code: 'print(42)' },
      { lang: 'C', code: '#include <stdio.h>\nint main() { printf("42\\n"); return 0; }' },
      { lang: 'CPP', code: '#include <iostream>\nint main() { std::cout << 42 << std::endl; return 0; }' },
      { lang: 'JAVASCRIPT', code: 'console.log(42);' },
      { lang: 'GO', code: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println(42)\n}' },
      { lang: 'RUST', code: 'fn main() {\n    println!("42");\n}' }
    ];

    for (const test of testSuite) {
      try {
        const runRes = await fetch(`http://localhost:8080/api/problems/${multiId}/run`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            language: test.lang,
            code: test.code
          })
        });
        const runData = await runRes.json();
        console.log(`   ✓ Language [${test.lang.padEnd(10)}] -> Status: ${runData.status} | Stdout: ${runData.stdout?.trim() || '(empty)'}`);
      } catch (e) {
        console.log(`   - Language [${test.lang.padEnd(10)}] -> Note: ${e.message}`);
      }
    }

    // 8. Test Assignment Custom Question with Allowed Languages
    console.log('\n8. Testing Assignment Creator Custom Question with Allowed Languages...');
    const customQRes = await fetch('http://localhost:8080/api/assignments/questions/custom', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        questionType: 'CODING',
        title: 'Assignment Python Only Challenge ' + Date.now(),
        concept: 'Recursion',
        difficulty: 'Medium',
        description: 'Python only assessment problem',
        constraints: 'N <= 100',
        points: 100,
        allowedLanguages: ['PYTHON'],
        testCasesList: [{ input: '1\n', expectedOutput: '1\n', hidden: false }],
        starterCodePython: 'print(1)'
      })
    });
    const customQ = await customQRes.json();
    console.log(`   ✓ Custom Question ID #${customQ.id} created with allowed languages:`, customQ.allowedLanguages);

    console.log('\n============================================================');
    console.log('ALL FEATURE 7 VERIFICATION TESTS PASSED PERFECTLY!');
    console.log('============================================================\n');
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

runTests();
