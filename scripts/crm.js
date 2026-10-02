const SUPABASE_URL = 'https://fzwfkdamebyzywlqhtes.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BE8kihWp5Uhg8re4CB3xlA_Ahb-3zWY';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  if (command === 'get') {
    const query = args[1] || '';
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?contact_name=ilike.*${encodeURIComponent(query)}*&select=*`, { headers });
    const leads = await res.json();
    console.log(JSON.stringify(leads, null, 2));
    return;
  }

  if (command === 'update') {
    const query = args[1] || '';
    const getRes = await fetch(`${SUPABASE_URL}/rest/v1/leads?contact_name=ilike.*${encodeURIComponent(query)}*&select=*`, { headers });
    const [lead] = await getRes.json();
    if (!lead) {
      console.error('Lead not found for query:', query);
      process.exit(1);
    }

    let notes = typeof lead.notes === 'string' && lead.notes.startsWith('{') ? JSON.parse(lead.notes) : { timeline: [] };
    if (!Array.isArray(notes.timeline)) notes.timeline = [];

    function getArg(flag) {
      const idx = args.indexOf(flag);
      if (idx === -1) return null;
      const val = args[idx + 1];
      if (val === undefined || val.startsWith('--')) return '';
      return val;
    }

    const noteText = getArg('--note');
    const actionText = getArg('--action');
    const dateText = getArg('--date');
    const statusVal = getArg('--status');
    const lostReasonVal = getArg('--lost-reason');
    const lostLabelVal = getArg('--lost-label');

    if (noteText) {
      notes.timeline.unshift({
        date: new Date().toISOString(),
        text: noteText
      });
    }
    if (actionText !== null) notes.next_action = actionText;
    if (dateText !== null) notes.next_action_date = dateText;
    if (lostReasonVal) notes.lost_reason = lostReasonVal;
    if (lostLabelVal) notes.lost_reason_label = lostLabelVal;

    const patchBody = { notes: JSON.stringify(notes) };
    if (statusVal) patchBody.status = statusVal;

    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${lead.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(patchBody)
    });
    const updated = await patchRes.json();
    console.log(JSON.stringify({
      success: true,
      lead: updated[0].contact_name,
      status: updated[0].status,
      next_action: notes.next_action,
      next_action_date: notes.next_action_date,
      lost_reason: notes.lost_reason
    }, null, 2));
    return;
  }

  if (command === 'create') {
    const jsonStr = args[1];
    const payload = JSON.parse(jsonStr);
    const postRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(payload)
    });
    const result = await postRes.json();
    console.log(JSON.stringify({ success: true, inserted: result }, null, 2));
    return;
  }

  console.log('Usage: node scripts/crm.js [get <name> | update <name> ... | create <json>]');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
