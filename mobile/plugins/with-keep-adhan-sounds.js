// Resource shrinking deletes res/raw files that no code references by R.raw
// id. The adhan .ogg files are resolved by name at runtime (notification
// channels), so they need an explicit keep rule or the release build ships
// without them. expo-notifications copies them into res/raw; this adds the
// keep rule next to them. Not "keep.xml": React Native writes that name
// itself during the release build and would replace this one.
const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

const KEEP_XML = `<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools"
    tools:keep="@raw/adhan_*" />
`;

module.exports = function withKeepAdhanSounds(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const dir = path.join(cfg.modRequest.platformProjectRoot, "app/src/main/res/raw");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "adhan_keep.xml"), KEEP_XML);
      return cfg;
    },
  ]);
};
