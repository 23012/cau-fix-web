const webpush = require('web-push');
const pool = require('../config/db');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@caufix.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const webPushService = {
  // 구독 저장
  saveSubscription: async (member_id, subscription) => {
    const { endpoint, keys } = subscription;
    await pool.query(
      `INSERT INTO push_subscription (member_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (member_id, endpoint) DO UPDATE SET p256dh = $3, auth = $4`,
      [member_id, endpoint, keys.p256dh, keys.auth]
    );
  },

  // 구독 삭제
  removeSubscription: async (member_id, endpoint) => {
    await pool.query(
      'DELETE FROM push_subscription WHERE member_id = $1 AND endpoint = $2',
      [member_id, endpoint]
    );
  },

  // 특정 사용자에게 푸시 발송
  sendToMember: async (member_id, payload) => {
    const result = await pool.query(
      'SELECT endpoint, p256dh, auth FROM push_subscription WHERE member_id = $1',
      [member_id]
    );

    const notifications = result.rows.map(async (row) => {
      const subscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      };
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
      } catch (err) {
        // 구독 만료 시 삭제
        if (err.statusCode === 410 || err.statusCode === 404) {
          await pool.query(
            'DELETE FROM push_subscription WHERE member_id = $1 AND endpoint = $2',
            [member_id, row.endpoint]
          );
        }
      }
    });

    await Promise.all(notifications);
  },

  // 여러 사용자에게 푸시 발송
  sendToMembers: async (member_ids, payload) => {
    await Promise.all(member_ids.map((id) => webPushService.sendToMember(id, payload)));
  },
};

module.exports = webPushService;
