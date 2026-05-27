const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function test() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('Connecting to:', url);
  console.log('Key length:', key ? key.length : 0);

  const supabase = createClient(url, key);

  console.log('\n--- 1. Testing query on pixel_events_metrics table ---');
  const { data: selectData, error: selectError } = await supabase
    .from('pixel_events_metrics')
    .select('*');
  
  if (selectError) {
    console.error('Select error:', selectError);
  } else {
    console.log('Select success, rows:', selectData);
  }

  console.log('\n--- 2. Testing RPC call increment_pixel_event ---');
  const { data: rpcData, error: rpcError } = await supabase.rpc('increment_pixel_event', {
    event_name_param: 'TestEventFromScript'
  });

  if (rpcError) {
    console.error('RPC error:', rpcError);
  } else {
    console.log('RPC success, data:', rpcData);
  }

  console.log('\n--- 3. Querying table again after RPC ---');
  const { data: selectData2, error: selectError2 } = await supabase
    .from('pixel_events_metrics')
    .select('*');
  
  if (selectError2) {
    console.error('Select 2 error:', selectError2);
  } else {
    console.log('Select 2 success, rows:', selectData2);
  }
}

test();
