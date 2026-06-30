import pg from 'pg';

const URLs = [
  'postgresql://neondb_owner:npg_kh5jo0dSVfPC@ep-rapid-mud-ahpmdrsk.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
  'postgresql://neondb_owner:npg_kh5jo0dSVfPC@ep-rapid-mud-ahpmdrsk-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
];

async function testConnections() {
  for (const url of URLs) {
    console.log('\nTesting:', url.split('@')[1]);
    const client = new pg.Client({ connectionString: url });
    try {
      await client.connect();
      const res = await client.query('SELECT NOW()');
      console.log('✅ Success!', res.rows[0]);
    } catch (err) {
      console.log('❌ Failed!', err.message);
    } finally {
      await client.end();
    }
  }
}

testConnections();
