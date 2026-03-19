import { it } from 'vitest';
it('check environment', () => {
  console.log('window defined:', typeof window !== 'undefined');
  console.log('document defined:', typeof document !== 'undefined');
  console.log('localStorage constructor:', localStorage?.constructor?.name);
  console.log(
    'localStorage from node?:',
    localStorage?.constructor?.toString().includes('node:internal')
  );
});
