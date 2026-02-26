const { withAndroidManifest, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Config plugin que garante cleartext HTTP no Android:
 * 1. Cria network_security_config.xml permitindo tráfego HTTP
 * 2. Referencia o ficheiro no AndroidManifest.xml
 * 3. Força usesCleartextTraffic=true no manifest
 */
function withCleartextTraffic(config) {
  // Passo 1: Criar network_security_config.xml durante prebuild
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const resXmlDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "xml"
      );
      fs.mkdirSync(resXmlDir, { recursive: true });

      const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">13.48.56.98</domain>
    </domain-config>
</network-security-config>`;

      fs.writeFileSync(
        path.join(resXmlDir, "network_security_config.xml"),
        xmlContent,
        "utf-8"
      );
      console.log("✅ network_security_config.xml criado");
      return config;
    },
  ]);

  // Passo 2: Referenciar no AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const mainApp = config.modResults.manifest.application?.[0];
    if (mainApp) {
      mainApp.$["android:usesCleartextTraffic"] = "true";
      mainApp.$["android:networkSecurityConfig"] =
        "@xml/network_security_config";
    }
    console.log("✅ AndroidManifest.xml atualizado com networkSecurityConfig");
    return config;
  });

  return config;
}

module.exports = withCleartextTraffic;
