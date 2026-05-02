import Foundation
import UserNotifications

extension Notification.Name {
    static let neraNotificationActionReceived = Notification.Name("neraNotificationActionReceived")
}

struct NotificationActionPayload: Sendable {
    let requestID: String
    let actionIdentifier: String
    let text: String
}

final class NotificationActionBridge: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationActionBridge()

    private override init() {}

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .sound, .list]
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let textResponse = response as? UNTextInputNotificationResponse
        let payload = NotificationActionPayload(
            requestID: response.notification.request.identifier,
            actionIdentifier: response.actionIdentifier,
            text: textResponse?.userText ?? ""
        )

        await MainActor.run {
            NotificationCenter.default.post(
                name: .neraNotificationActionReceived,
                object: payload
            )
        }
    }
}
