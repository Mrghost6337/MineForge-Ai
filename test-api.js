import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('https://czxcuodsiictwnfsazvv.supabase.co');
    console.log('Supabase:', res.status);
  } catch (e) {
    console.error('Supabase error:', e);
  }
}

test();
