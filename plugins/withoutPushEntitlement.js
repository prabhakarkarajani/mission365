const { withEntitlementsPlist } = require('@expo/config-plugins');

/**
 * expo-notifications unconditionally adds the aps-environment (remote push)
 * entitlement, even though this app only schedules local notifications.
 * That entitlement blocks signing with a free Apple ID Personal Team
 * ("Personal development teams do not support the Push Notifications
 * capability"). Strip it here so local device builds work without a paid
 * Apple Developer account. Remove this plugin if remote push is added later.
 */
module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults['aps-environment'];
    return config;
  });
};
