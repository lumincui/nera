import Foundation
import NeraCore
import UserNotifications

extension Notification.Name {
    static let neraNotificationActionReceived = Notification.Name("neraNotificationActionReceived")
    static let neraRemoteNotificationTokenReceived = Notification.Name("neraRemoteNotificationTokenReceived")
    static let neraRemoteNotificationRegistrationFailed = Notification.Name("neraRemoteNotificationRegistrationFailed")
}

struct NotificationActionPayload: Sendable {
    let requestID: String
    let actionIdentifier: String
    let text: String
    let eventKind: AgentEventKind?
    let agent: String?
    let task: String?
    let title: String?
    let body: String?
    let choices: [String]
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
        let userInfo = response.notification.request.content.userInfo
        let payload = NotificationActionPayload(
            requestID: userInfo["request_id"] as? String ?? response.notification.request.identifier,
            actionIdentifier: response.actionIdentifier,
            text: textResponse?.userText ?? "",
            eventKind: (userInfo["event_kind"] as? String).flatMap(AgentEventKind.init(rawValue:)),
            agent: userInfo["agent"] as? String,
            task: userInfo["task"] as? String,
            title: userInfo["title"] as? String,
            body: userInfo["body"] as? String,
            choices: userInfo["choices"] as? [String] ?? []
        )

        await MainActor.run {
            NotificationCenter.default.post(
                name: .neraNotificationActionReceived,
                object: payload
            )
        }
    }
}
