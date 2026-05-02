import NeraCore
import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var store: TouchpointStore

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if FeatureFlags.devTools {
                        PairingView(pairing: store.pairing)
                        ServerView()
                        EventSwitcher()
                    }
                    if store.hasActiveEvent {
                        EventCard()
                    } else {
                        WaitingView()
                    }
                    if FeatureFlags.devTools {
                        MessageInspector()
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Nera")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

private struct WaitingView: View {
    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "dot.radiowaves.left.and.right")
                .font(.largeTitle)
                .foregroundStyle(.blue)

            Text("Nera is ready")
                .font(.title3.weight(.semibold))

            Text("Agent requests and completion updates will appear here when they need your attention.")
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(24)
        .background(.background, in: RoundedRectangle(cornerRadius: 8))
    }
}

private struct PairingView: View {
    let pairing: HardcodedPairing

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Hardcoded Pair", systemImage: "link")
                .font(.headline)

            VStack(alignment: .leading, spacing: 6) {
                Text(pairing.sidecarID)
                Image(systemName: "arrow.down")
                    .foregroundStyle(.secondary)
                Text(pairing.touchpointID)
                Divider()
                Text("APNs: \(pairing.apnsEnvironment.rawValue)")
                    .foregroundStyle(pairing.apnsEnvironment == .sandbox ? .orange : .green)
            }
            .font(.subheadline.monospaced())
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .background(.background, in: RoundedRectangle(cornerRadius: 8))
    }
}

private struct ServerView: View {
    @EnvironmentObject private var store: TouchpointStore

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Nera Server", systemImage: "server.rack")
                .font(.headline)

            TextField("Server URL", text: $store.serverURLText)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .textFieldStyle(.roundedBorder)

            Button {
                Task {
                    await store.pullLatestEvent()
                }
            } label: {
                Label("Pull From Server", systemImage: "arrow.down.circle.fill")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .background(.background, in: RoundedRectangle(cornerRadius: 8))
    }
}

private struct EventSwitcher: View {
    @EnvironmentObject private var store: TouchpointStore

    var body: some View {
        Picker("Event", selection: Binding(
            get: { store.currentEvent.kind },
            set: { kind in
                switch kind {
                case .question:
                    store.loadQuestionEvent()
                case .idle:
                    store.loadIdleEvent()
                }
            }
        )) {
            Label("Question", systemImage: "questionmark.bubble").tag(AgentEventKind.question)
            Label("Idle", systemImage: "bell").tag(AgentEventKind.idle)
        }
        .pickerStyle(.segmented)
    }
}

private struct EventCard: View {
    @EnvironmentObject private var store: TouchpointStore

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(store.currentEvent.agent)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(store.currentEvent.title)
                        .font(.title3.weight(.semibold))
                }
                Spacer()
                Text(store.currentEvent.kind.rawValue)
                    .font(.caption.weight(.semibold))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(.blue.opacity(0.12), in: Capsule())
                    .foregroundStyle(.blue)
            }

            Text(store.currentEvent.body)
                .font(.body)
                .foregroundStyle(.primary)

            switch store.currentEvent.kind {
            case .question:
                QuestionActions()
            case .idle:
                IdleActions()
            }
        }
        .padding()
        .background(.background, in: RoundedRectangle(cornerRadius: 8))
    }
}

private struct QuestionActions: View {
    @EnvironmentObject private var store: TouchpointStore

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            FlowLabel(text: "Interactive action")

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 140), spacing: 8)], alignment: .leading, spacing: 8) {
                ForEach(store.currentEvent.choices, id: \.self) { choice in
                    Button {
                        store.toggleChoice(choice)
                    } label: {
                        Label(
                            choice,
                            systemImage: store.selectedChoices.contains(choice) ? "checkmark.circle.fill" : "circle"
                        )
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .buttonStyle(.bordered)
                    .tint(store.selectedChoices.contains(choice) ? .blue : .secondary)
                }
            }

            TextField("Add context", text: $store.replyText, axis: .vertical)
                .textFieldStyle(.roundedBorder)
                .lineLimit(2...4)

            Button {
                store.sendQuestionAnswer()
            } label: {
                Label(store.handledRequestIDs.contains(store.currentEvent.id) ? "Answer Sent" : "Send Answer", systemImage: "paperplane.fill")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .disabled(!store.canSendQuestionAnswer)

            if FeatureFlags.devTools {
                Button {
                    Task {
                        await store.sendQuestionNotification()
                    }
                } label: {
                    Label("Send Test Notification", systemImage: "app.badge")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }
        }
    }
}

private struct IdleActions: View {
    @EnvironmentObject private var store: TouchpointStore

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            FlowLabel(text: "Completion notification")
            if FeatureFlags.devTools {
                Text("Notification permission: \(store.notificationPermission)")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            HStack {
                if FeatureFlags.devTools {
                    Button {
                        Task {
                            await store.sendIdleNotification()
                        }
                    } label: {
                        Label("Notify Again", systemImage: "bell.badge")
                    }
                    .buttonStyle(.bordered)
                }

                Button {
                    store.openReview()
                } label: {
                    Label("Review", systemImage: "arrow.up.right.square")
                }
                .buttonStyle(.borderedProminent)
            }
        }
    }
}

private struct FlowLabel: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.caption.weight(.semibold))
            .foregroundStyle(.secondary)
            .textCase(.uppercase)
    }
}

private struct MessageInspector: View {
    @EnvironmentObject private var store: TouchpointStore

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Flow", systemImage: "point.3.connected.trianglepath.dotted")
                .font(.headline)

            Text(store.lastStatus)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            if !store.messages.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(store.messages.prefix(3)) { message in
                        HStack {
                            Text(message.type.rawValue)
                                .font(.subheadline.weight(.medium))
                            Spacer()
                            Text(message.id.prefix(12))
                                .font(.caption.monospaced())
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }

            Text(store.latestPayload)
                .font(.system(.caption, design: .monospaced))
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(10)
                .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 8))
                .textSelection(.enabled)
        }
        .padding()
        .background(.background, in: RoundedRectangle(cornerRadius: 8))
    }
}

#Preview {
    ContentView()
        .environmentObject(TouchpointStore())
}
