// Simple test for backend API
import { describe, it } from 'node:test';

console.log(`
Backend API Test Instructions:
==============================

1. Start the backend:
   cd backend && npm run dev

2. Test health endpoint:
   curl http://localhost:3001/api/health

3. Register a user:
   curl -X POST http://localhost:3001/api/auth/register \\
     -H "Content-Type: application/json" \\
     -d '{"email":"user@example.com","password":"123456"}'

4. Login:
   curl -X POST http://localhost:3001/api/auth/login \\
     -H "Content-Type: application/json" \\
     -d '{"email":"user@example.com","password":"123456"}'

5. Create todo (use token from login):
   curl -X POST http://localhost:3001/api/todos \\
     -H "Content-Type: application/json" \\
     -H "Authorization: Bearer YOUR_TOKEN" \\
     -d '{"text":"Buy milk"}'

6. Get todos:
   curl http://localhost:3001/api/todos \\
     -H "Authorization: Bearer YOUR_TOKEN"

7. Test 200 limit (run 201 times):
   for i in {1..201}; do
     curl -X POST http://localhost:3001/api/todos \\
       -H "Content-Type: application/json" \\
       -H "Authorization: Bearer YOUR_TOKEN" \\
       -d "{\"text\":\"Todo $i\"}"
   done

The 201st request should return 429 error.
`);

describe('Backend', () => {
  it('should have instructions', () => {
    console.log('See instructions above for manual testing');
  });
});
