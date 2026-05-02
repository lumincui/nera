// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "NeraCore",
    platforms: [
        .iOS(.v18),
        .macOS(.v15)
    ],
    products: [
        .library(
            name: "NeraCore",
            targets: ["NeraCore"]
        )
    ],
    targets: [
        .target(name: "NeraCore")
    ]
)
