const { withEntitlementsPlist, withPodfile, withPodfileProperties } = require('@expo/config-plugins');

/**
 * expo-notifications unconditionally adds the aps-environment (remote push)
 * entitlement, even though this app only schedules local notifications.
 * That entitlement blocks signing with a free Apple ID Personal Team
 * ("Personal development teams do not support the Push Notifications
 * capability"). Strip it here so local device builds work without a paid
 * Apple Developer account. Remove this plugin if remote push is added later.
 */
function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults['aps-environment'];
    return config;
  });
}

/**
 * Recent Xcode versions sandbox Run Script build phases by default, which
 * breaks CocoaPods' resource-copying script ("Sandbox: deny file-write-create
 * .../Pods/resources-to-copy-*.txt"). Disable it for all Pod targets.
 */
function withDisabledScriptSandboxing(config) {
  return withPodfile(config, (config) => {
    const marker = "ccache_enabled?(podfile_properties),\n    )\n  end";
    const replacement =
      "ccache_enabled?(podfile_properties),\n    )\n\n" +
      "    installer.pods_project.targets.each do |target|\n" +
      "      target.build_configurations.each do |config|\n" +
      "        config.build_settings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'NO'\n" +
      "      end\n" +
      "    end\n" +
      "  end";

    if (config.modResults.contents.includes(marker)) {
      config.modResults.contents = config.modResults.contents.replace(marker, replacement);
    }

    return config;
  });
}

/**
 * Expo ships some native modules (e.g. EXApplication) as precompiled
 * xcframeworks built against a newer iOS SDK than our deployment target
 * (16.4), causing "module has a minimum deployment target of iOS 26.0"
 * build errors. Compile from source instead so everything targets 16.4.
 */
function withoutPrecompiledModules(config) {
  return withPodfileProperties(config, (config) => {
    config.modResults['EXPO_USE_PRECOMPILED_MODULES'] = 'false';
    return config;
  });
}

module.exports = function withCustomFixes(config) {
  config = withoutPushEntitlement(config);
  config = withDisabledScriptSandboxing(config);
  config = withoutPrecompiledModules(config);
  return config;
};
