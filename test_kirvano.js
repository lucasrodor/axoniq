const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const userId = "49dc8a4c-96de-43d3-89de-905ee3df12a7";
  const { data, error } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    status: 'active',
    payment_gateway: 'kirvano',
    kirvano_customer_id: 'test',
    kirvano_subscription_id: 'test',
    plan_interval: 'semiannual',
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' });
  console.log("Error:", error);
  console.log("Data:", data);
}
run();
