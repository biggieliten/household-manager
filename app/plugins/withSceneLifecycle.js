// Apps built with the iOS 27 SDK (Xcode 27) refuse to launch unless they adopt the
// UIScene life cycle. Expo 57 ships the scene delegate (ExpoAppSceneDelegate) but its
// prebuild template doesn't use it yet, so this plugin wires it up on every prebuild.
// Remove it once the Expo template adopts scenes itself.
const { withAppDelegate, withInfoPlist } = require("expo/config-plugins");

const SCENE_DELEGATE = `
// Added by plugins/withSceneLifecycle.js: creates the window and starts React Native
class SceneDelegate: ExpoAppSceneDelegate {}
`;

function withSceneManifest(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: "Default Configuration",
            UISceneDelegateClassName: "$(PRODUCT_MODULE_NAME).SceneDelegate",
          },
        ],
      },
    };
    return config;
  });
}

function withSceneAppDelegate(config) {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language !== "swift") {
      throw new Error("withSceneLifecycle only supports a Swift AppDelegate");
    }
    let contents = config.modResults.contents;
    if (contents.includes("class SceneDelegate")) {
      return config;
    }

    // The scene delegate finds the React Native factory through this protocol
    const classLine = "class AppDelegate: ExpoAppDelegate {";
    // Under the scene life cycle the scene delegate creates the window instead
    const startInAppDelegate =
      /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/;

    if (!contents.includes(classLine) || !startInAppDelegate.test(contents)) {
      throw new Error(
        "withSceneLifecycle: AppDelegate.swift doesn't match the expected Expo template. " +
          "Update the plugin to match the new template.",
      );
    }

    contents = contents
      .replace(
        classLine,
        "class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {",
      )
      .replace(startInAppDelegate, "");
    config.modResults.contents = contents + SCENE_DELEGATE;
    return config;
  });
}

module.exports = function withSceneLifecycle(config) {
  return withSceneAppDelegate(withSceneManifest(config));
};
