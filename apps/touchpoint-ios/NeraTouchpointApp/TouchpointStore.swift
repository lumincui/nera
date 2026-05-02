import Foundation
import NeraCore
import UserNotifications

@MainActor
final class TouchpointStore: ObservableObject {
    @Published var currentEvent: AgentEvent = .devQuestion
    @Published var selectedChoices = Set<String>()
    @Published var replyText = ""
    @Published var messages: [TouchpointMessage] = []
    @Published var lastStatus = "Hardcoded pair is ready."
    @Published var notificationPermission = "Not requested"
    @Published var serverURLText = "http://127.0.0.1:8787"
    @Published var lastServerSequence = 0

    let pairing = HardcodedPairing.dev

    private let notificationCenter = UNUserNotificationCenter.current()
    private var actionObserver: NSObjectProtocol?

    init() {
        registerNotificationCategories()
        actionObserver = NotificationCenter.default.addObserver(
            forName: .neraNotificationActionReceived,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let payload = notification.object as? NotificationActionPayload else {
                return
            }

            Task { @MainActor in
                self?.handleNotificationAction(payload)
            }
        }
    }

    deinit {
        if let actionObserver {
            NotificationCenter.default.removeObserver(actionObserver)
        }
    }

    var latestPayload: String {
        guard let message = messages.first else {
            return "{}"
        }

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601

        guard let data = try? encoder.encode(message),
              let json = String(data: data, encoding: .utf8) else {
            return "{}"
        }

        return json
    }

    func pullLatestEvent() async {
        do {
            let url = try makeURL(
                path: "/touchpoint/events",
                queryItems: [
                    URLQueryItem(name: "touchpoint_id", value: pairing.touchpointID),
                    URLQueryItem(name: "after", value: String(lastServerSequence))
                ]
            )
            let response: TouchpointEventsResponse = try await getJSON(url)

            guard let event = response.events.last else {
                lastStatus = "No new server events."
                return
            }

            lastServerSequence = max(lastServerSequence, event.sequence)
            currentEvent = event.agentEvent
            selectedChoices.removeAll()
            replyText = ""
            lastStatus = "Pulled \(event.type) from nera-server."

            if event.type == "idle" {
                await sendIdleNotification()
            }
        } catch {
            lastStatus = "Failed to pull server event: \(error.localizedDescription)"
        }
    }

    func loadQuestionEvent() {
        currentEvent = .devQuestion
        selectedChoices.removeAll()
        replyText = ""
        lastStatus = "Question event received from hardcoded pair."
    }

    func loadIdleEvent() {
        currentEvent = .devIdle
        selectedChoices.removeAll()
        replyText = ""
        Task {
            await sendIdleNotification()
        }
    }

    func toggleChoice(_ choice: String) {
        if selectedChoices.contains(choice) {
            selectedChoices.remove(choice)
        } else {
            selectedChoices.insert(choice)
        }
    }

    func sendQuestionAnswer() {
        let choices = currentEvent.choices.filter { selectedChoices.contains($0) }
        let message = TouchpointMessage(
            requestID: currentEvent.id,
            type: .answerQuestion,
            pairing: pairing,
            agent: currentEvent.agent,
            task: currentEvent.task,
            selectedChoices: choices,
            text: replyText,
            action: "submit_question_answer"
        )

        messages.insert(message, at: 0)
        lastStatus = "answer_question message created for sidecar."
        selectedChoices.removeAll()
        replyText = ""

        Task {
            await postMessageToServer(message)
        }
    }

    func sendQuestionNotification() async {
        do {
            let granted = try await notificationCenter.requestAuthorization(options: [.alert, .sound, .badge])
            notificationPermission = granted ? "Granted" : "Denied"

            guard granted else {
                lastStatus = "Question notification permission is denied."
                return
            }

            let content = UNMutableNotificationContent()
            content.title = currentEvent.title
            content.body = currentEvent.body
            content.sound = .default
            content.categoryIdentifier = "NERA_QUESTION"

            let request = UNNotificationRequest(
                identifier: currentEvent.id,
                content: content,
                trigger: UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)
            )

            try await notificationCenter.add(request)
            lastStatus = "Question notification scheduled. Put the app in background, then expand the notification to see actions."
        } catch {
            notificationPermission = "Error"
            lastStatus = "Failed to schedule question notification: \(error.localizedDescription)"
        }
    }

    func openReview() {
        let message = TouchpointMessage(
            requestID: currentEvent.id,
            type: .openReview,
            pairing: pairing,
            agent: currentEvent.agent,
            task: currentEvent.task,
            action: "open_review"
        )

        messages.insert(message, at: 0)
        lastStatus = "open_review message created."

        Task {
            await postMessageToServer(message)
        }
    }

    func sendIdleNotification() async {
        do {
            let granted = try await notificationCenter.requestAuthorization(options: [.alert, .sound, .badge])
            notificationPermission = granted ? "Granted" : "Denied"

            let message = TouchpointMessage(
                requestID: currentEvent.id,
                type: .completionNotification,
                pairing: pairing,
                agent: currentEvent.agent,
                task: currentEvent.task,
                action: "deliver_idle_notification"
            )
            messages.insert(message, at: 0)
            await postMessageToServer(message)

            guard granted else {
                lastStatus = "completion_notification recorded, but notification permission is denied."
                return
            }

            let content = UNMutableNotificationContent()
            content.title = currentEvent.title
            content.body = currentEvent.body
            content.sound = .default
            content.categoryIdentifier = "NERA_IDLE"

            let request = UNNotificationRequest(
                identifier: currentEvent.id,
                content: content,
                trigger: UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)
            )

            try await notificationCenter.add(request)
            lastStatus = "completion_notification scheduled. Put the app in background to receive it."
        } catch {
            notificationPermission = "Error"
            lastStatus = "Failed to send idle notification: \(error.localizedDescription)"
        }
    }

    private func registerNotificationCategories() {
        let questionAction = UNNotificationAction(
            identifier: "question.choice.primary",
            title: "Question action",
            options: [.foreground]
        )
        let idleAction = UNNotificationAction(
            identifier: "question.choice.idle",
            title: "Idle notification",
            options: [.foreground]
        )
        let textAction = UNTextInputNotificationAction(
            identifier: "question.text",
            title: "Reply",
            options: [.foreground],
            textInputButtonTitle: "Send",
            textInputPlaceholder: "Add context"
        )
        let questionCategory = UNNotificationCategory(
            identifier: "NERA_QUESTION",
            actions: [questionAction, idleAction, textAction],
            intentIdentifiers: [],
            options: []
        )

        let reviewAction = UNNotificationAction(
            identifier: "idle.review",
            title: "Review",
            options: [.foreground]
        )
        let idleCategory = UNNotificationCategory(
            identifier: "NERA_IDLE",
            actions: [reviewAction],
            intentIdentifiers: [],
            options: []
        )

        notificationCenter.setNotificationCategories([questionCategory, idleCategory])
    }

    private func handleNotificationAction(_ payload: NotificationActionPayload) {
        if payload.actionIdentifier == "idle.review" {
            currentEvent = .devIdle
            openReview()
            return
        }

        currentEvent = .devQuestion
        let selected = selection(for: payload.actionIdentifier)
        let message = TouchpointMessage(
            requestID: payload.requestID,
            type: .answerQuestion,
            pairing: pairing,
            agent: currentEvent.agent,
            task: currentEvent.task,
            selectedChoices: selected,
            text: payload.text,
            action: payload.actionIdentifier
        )

        messages.insert(message, at: 0)
        lastStatus = "answer_question message created from notification action."

        Task {
            await postMessageToServer(message)
        }
    }

    private func selection(for actionIdentifier: String) -> [String] {
        switch actionIdentifier {
        case "question.choice.primary":
            return ["Question action"]
        case "question.choice.idle":
            return ["Idle notification"]
        default:
            return []
        }
    }

    private func postMessageToServer(_ message: TouchpointMessage) async {
        do {
            let url = try makeURL(path: "/touchpoint/responses")
            let request = TouchpointResponseRequest(message: message, touchpointID: pairing.touchpointID)
            let _: ServerAcceptedResponse = try await postJSON(url, body: request)
            lastStatus = "\(message.type.rawValue) posted to nera-server."
        } catch {
            lastStatus = "Local message created, but server post failed: \(error.localizedDescription)"
        }
    }

    private func makeURL(path: String, queryItems: [URLQueryItem] = []) throws -> URL {
        guard var components = URLComponents(string: serverURLText) else {
            throw URLError(.badURL)
        }
        components.path = path
        components.queryItems = queryItems.isEmpty ? nil : queryItems

        guard let url = components.url else {
            throw URLError(.badURL)
        }
        return url
    }

    private func getJSON<T: Decodable>(_ url: URL) async throws -> T {
        let (data, response) = try await URLSession.shared.data(from: url)
        try validateHTTPResponse(response, data: data)
        return try JSONDecoder.nera.decode(T.self, from: data)
    }

    private func postJSON<T: Decodable, Body: Encodable>(_ url: URL, body: Body) async throws -> T {
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "content-type")
        request.httpBody = try JSONEncoder.nera.encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)
        try validateHTTPResponse(response, data: data)
        return try JSONDecoder.nera.decode(T.self, from: data)
    }

    private func validateHTTPResponse(_ response: URLResponse, data: Data) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            return
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "HTTP \(httpResponse.statusCode)"
            throw NSError(domain: "NeraServer", code: httpResponse.statusCode, userInfo: [
                NSLocalizedDescriptionKey: message
            ])
        }
    }
}

private struct TouchpointEventsResponse: Decodable {
    let events: [ServerEvent]
}

private struct ServerEvent: Decodable {
    let sequence: Int
    let eventID: String
    let type: String
    let agent: String
    let task: String?
    let title: String
    let body: String
    let choices: [String]

    var agentEvent: AgentEvent {
        AgentEvent(
            id: eventID,
            kind: type == "idle" ? .idle : .question,
            agent: agent,
            task: task ?? "server event",
            title: title,
            body: body,
            choices: choices
        )
    }

    enum CodingKeys: String, CodingKey {
        case sequence
        case eventID = "event_id"
        case type
        case agent
        case task
        case title
        case body
        case choices
    }
}

private struct TouchpointResponseRequest: Encodable {
    let messageID: String
    let requestID: String
    let type: String
    let touchpointID: String
    let selectedChoices: [String]
    let text: String
    let action: String

    init(message: TouchpointMessage, touchpointID: String) {
        self.messageID = message.id
        self.requestID = message.requestID
        self.type = message.type.rawValue
        self.touchpointID = touchpointID
        self.selectedChoices = message.selectedChoices
        self.text = message.text
        self.action = message.action
    }

    enum CodingKeys: String, CodingKey {
        case messageID = "message_id"
        case requestID = "request_id"
        case type
        case touchpointID = "touchpoint_id"
        case selectedChoices = "selected_choices"
        case text
        case action
    }
}

private struct ServerAcceptedResponse: Decodable {
    let accepted: Bool
}

private extension JSONDecoder {
    static var nera: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}

private extension JSONEncoder {
    static var nera: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }
}
