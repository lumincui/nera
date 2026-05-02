import Foundation

public struct HardcodedPairing: Codable, Equatable, Sendable {
    public let pairID: String
    public let sidecarID: String
    public let touchpointID: String
    public let relayChannel: String
    public let apnsEnvironment: APNSEnvironment

    public init(
        pairID: String,
        sidecarID: String,
        touchpointID: String,
        relayChannel: String,
        apnsEnvironment: APNSEnvironment
    ) {
        self.pairID = pairID
        self.sidecarID = sidecarID
        self.touchpointID = touchpointID
        self.relayChannel = relayChannel
        self.apnsEnvironment = apnsEnvironment
    }

    public static let dev = HardcodedPairing(
        pairID: "dev-pair-local-001",
        sidecarID: "sidecar-mac-dev",
        touchpointID: "touchpoint-ios-dev",
        relayChannel: "relay-dev-hardcoded",
        apnsEnvironment: .sandbox
    )
}

public enum APNSEnvironment: String, Codable, Equatable, Sendable {
    case sandbox
    case production
}

public enum AgentEventKind: String, Codable, Sendable {
    case question
    case idle
}

public struct AgentEvent: Identifiable, Codable, Equatable, Sendable {
    public let id: String
    public let kind: AgentEventKind
    public let agent: String
    public let task: String
    public let title: String
    public let body: String
    public let choices: [String]
    public let createdAt: Date

    public init(
        id: String,
        kind: AgentEventKind,
        agent: String,
        task: String,
        title: String,
        body: String,
        choices: [String] = [],
        createdAt: Date = Date()
    ) {
        self.id = id
        self.kind = kind
        self.agent = agent
        self.task = task
        self.title = title
        self.body = body
        self.choices = choices
        self.createdAt = createdAt
    }

    public static let devQuestion = AgentEvent(
        id: "question-20260502-001",
        kind: .question,
        agent: "Codex",
        task: "touchpoint iOS",
        title: "Codex needs clarification",
        body: "Which interaction should Nera validate first?",
        choices: ["Question action", "Idle notification", "Permission later"]
    )

    public static let devIdle = AgentEvent(
        id: "idle-20260502-001",
        kind: .idle,
        agent: "Codex",
        task: "touchpoint iOS",
        title: "Codex finished the task",
        body: "The current turn is complete and ready for review."
    )
}

public enum TouchpointMessageType: String, Codable, Sendable {
    case answerQuestion = "answer_question"
    case completionNotification = "completion_notification"
    case openReview = "open_review"
}

public struct TouchpointMessage: Identifiable, Codable, Equatable, Sendable {
    public let id: String
    public let requestID: String
    public let type: TouchpointMessageType
    public let pairing: HardcodedPairing
    public let agent: String
    public let task: String
    public let selectedChoices: [String]
    public let text: String
    public let action: String
    public let createdAt: Date

    public init(
        id: String = "msg-\(UUID().uuidString)",
        requestID: String,
        type: TouchpointMessageType,
        pairing: HardcodedPairing = .dev,
        agent: String,
        task: String,
        selectedChoices: [String] = [],
        text: String = "",
        action: String = "",
        createdAt: Date = Date()
    ) {
        self.id = id
        self.requestID = requestID
        self.type = type
        self.pairing = pairing
        self.agent = agent
        self.task = task
        self.selectedChoices = selectedChoices
        self.text = text
        self.action = action
        self.createdAt = createdAt
    }
}
