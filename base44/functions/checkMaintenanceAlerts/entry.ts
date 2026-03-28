import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (user?.role !== 'admin' && user?.role !== 'project_manager' && user?.role !== 'supervisor') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const today = new Date();
  const warningDays = 14; // Alert 14 days before maintenance is due

  const equipment = await base44.asServiceRole.entities.Equipment.list();

  const upcoming = [];
  const overdue = [];

  for (const item of equipment) {
    if (!item.next_maintenance_date) continue;
    const nextDate = new Date(item.next_maintenance_date);
    const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      overdue.push({ ...item, days_overdue: Math.abs(diffDays) });
    } else if (diffDays <= warningDays) {
      upcoming.push({ ...item, days_until: diffDays });
    }
  }

  // Create notifications for overdue items
  for (const item of overdue) {
    const users = await base44.asServiceRole.entities.User.list();
    const managers = users.filter(u => ['admin', 'project_manager', 'supervisor'].includes(u.role));
    for (const manager of managers) {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: manager.email,
        title: `⚠️ Overdue Maintenance: ${item.name}`,
        message: `${item.name} maintenance is ${item.days_overdue} day(s) overdue. Last service: ${item.last_maintenance_date || 'unknown'}. Please schedule immediately.`,
        type: 'reminder',
        project_id: item.assigned_to_project || null,
      });
    }
  }

  // Create notifications for upcoming
  for (const item of upcoming) {
    const users = await base44.asServiceRole.entities.User.list();
    const managers = users.filter(u => ['admin', 'project_manager', 'supervisor'].includes(u.role));
    for (const manager of managers) {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: manager.email,
        title: `🔧 Upcoming Maintenance: ${item.name}`,
        message: `${item.name} is due for maintenance in ${item.days_until} day(s) (${item.next_maintenance_date}). Please schedule service soon.`,
        type: 'reminder',
        project_id: item.assigned_to_project || null,
      });
    }
  }

  return Response.json({
    checked: equipment.length,
    overdue: overdue.length,
    upcoming: upcoming.length,
    overdue_items: overdue.map(i => i.name),
    upcoming_items: upcoming.map(i => i.name),
  });
});