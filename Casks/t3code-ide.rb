cask "t3code-ide" do
  arch arm: "arm64", intel: "x64"

  version "0.1.0"
  sha256 arm:   "6ba807c7e5b868041decd528438be54848d7950c059881db09fb0360a4f5b2bc",
         intel: "ec2dd088efc35f76fc3bc17e88c0dd100b2dc5f0883d6a2f9a94ee73be74c3d8"

  url "https://github.com/ParasKoundal/t3code-ide/releases/download/v#{version}/T3-Code-IDE-#{version}-#{arch}.dmg"
  name "T3 Code IDE"
  desc "Autonomous AI-native coding IDE with multi-agent orchestration"
  homepage "https://github.com/ParasKoundal/t3code-ide"

  livecheck do
    url :url
    strategy :github_latest
  end

  auto_updates true
  depends_on macos: ">= :catalina"

  app "T3 Code IDE.app"

  postflight do
    # Remove macOS Gatekeeper quarantine attributes automatically upon installation
    system_command "/usr/bin/xattr",
                   args: ["-cr", "#{appdir}/T3 Code IDE.app"],
                   sudo: false
  end

  zap trash: [
    "~/.t3code-ide",
    "~/Library/Application Support/t3code-ide",
    "~/Library/Preferences/com.paraskoundal.t3codeide.plist",
    "~/Library/Saved Application State/com.paraskoundal.t3codeide.savedState",
  ]
end
