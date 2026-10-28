# KOTL — Comprehensive Product Requirements Document (PRD)

**Document Version:** 3.0
**Status:** Approved & Baselined
**Author:** Senior Full-Stack Architect & Product Owner
**Repository:** `D:\KOTL`
**Target Hardware:** ESP32-WROOM-32 (Dual Core, 240MHz, 4MB Flash / Huge APP) + INMP441 I2S Mic + MAX98357A I2S DAC + SSD1306 0.96" I2C OLED + Touch Button
**Target Cloud:** Node.js 20 Backend on Render (`https://kotl.onrender.com`), Groq Whisper STT (`whisper-large-v3-turbo`), Google Gemini (`gemini-2.5-flash-lite`), Groq LLaMA (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`), Microsoft Edge-TTS (`en-IN-PrabhatNeural`).

---

## 1. Executive Summary & Vision

KOTL (pronounced *"Kotil"*) is an affectionate, curious, and intelligent hardware companion robot and companion ecosystem designed for young children (primary persona: **Parth, 6 years old**).

Unlike passive smart speakers or intrusive screen-heavy tablets, KOTL acts as an autonomous, voice-first companion that:
1. **Fosters Curiosity & Socratic Learning:** Encourages deep thinking through guided questions rather than sterile factual answers.
2. **Reinforces Daily Routines & Positive Habits:** Tracks brushing, mealtime, hydration, tidy-up routines, and bedtime with playful voice reinforcement, streak tracking, and manner stars.
3. **Guides Tasks, Activities & School Projects:** Supports child homework, science investigations, arts and crafts, and daily chores through step-by-step vocal hints, reminders, and milestone tracking.
4. **Empowers Parents Transparently:** Provides parents with an uncluttered, responsive dashboard offering real-time conversational telemetry, an 8-dimension developmental observation report, walkie-talkie voice memos, hardware remote control, and cryptographic parent authentication.
5. **Guarantees Child Safety:** Operates with strict G-rated guardrails, zero medical or dangerous tool advice, explicit parental permission requirements, and zero advertising or tracking data sharing.

---

## 2. User Personas & System Boundaries

### Persona A: Parth (Child, 6 Years Old)
- **Modality:** 100% voice and physical companion interaction (RoboEyes animated screen + capacitive touch button).
- **Language:** English by default; natural Hindi/Gujarati code-switching when Parth speaks in those languages.
- **Needs:** Fun, patience, encouragement, clear spoken pronunciation, interactive eye emotions, help with daily routines and school activities.

### Persona B: Parents (Mummy & Papa)
- **Modality:** Mobile web and desktop browser dashboard (`backend/public/index.html`).
- **Needs:** Visibility into conversation topics, emotional trends, developmental milestones, habit completion, task assignments, remote volume/sleep management, and privacy control over AI quotas.
- **Authentication:** Protected by a short-lived Parent PIN session token (`PARENT_PIN`).

### Persona C: KOTL Hardware Companion (ESP32 IoT Node)
- **Modality:** Dedicated dual-core microcontroller firmware (`esp32/main/main.ino`).
- **Protocols:** Full-duplex WebSocket (`/ws` and `/stream`) for audio streaming, bidirectional state management, and real-time heartbeats.

---

## 3. High-Level System Architecture

```mermaid
flowchart TD
    subgraph Child Companion Node [ESP32 Hardware Robot]
        MIC[INMP441 I2S Mic] --> ADC[Audio Pre-roll & VAD Buffer]
        ADC --> WS_TX[WebSocket Client PCM Streamer]
        WS_RX[WebSocket Audio Receiver] --> RING[xStreamBuffer Ring Buffer]
        RING --> DAC[MAX98357A I2S 3W Speaker]
        OLED[SSD1306 0.96 OLED RoboEyes] <-- STATE[Companion Turn State Engine]
        TOUCH[Capacitive Touch Pin 15] --> STATE
    end

    subgraph KOTL Cloud Infrastructure [Node.js Backend on Render]
        WS_SRV[WebSocket Handler services/websocket.js]
        VAD[Server Turn Detector & Ambient Filter]
        STT[Groq Whisper STT Large v3 Turbo]
        BRAIN[Cognitive Core services/assistant.js]
        TTS[Microsoft Edge-TTS en-IN-PrabhatNeural]
        QUOTA[Quota & Token Monitor services/api-usage.js]
        MEM[Memory & Task Engine services/child-memory.js]
        AUTH[Parent Session Vault server.js]
    end

    subgraph Parent Portal [Responsive Web Dashboard]
        OVERVIEW[Overview & Growth Cockpit]
        ROUTINES[Daily Routines & Socratic Missions]
        TASKS_UI[Tasks & Activities Manager]
        DEVICE[Device Controls & Walkie-Talkie]
        REPORT_UI[8-Dimension Developmental Report]
        QUOTA_UI[AI Quota Telemetry & Parent Lock]
    end

    WS_TX -->|Raw 16kHz PCM| WS_SRV
    WS_SRV --> VAD
    VAD -->|WAV Blob| STT
    STT -->|Transcript| BRAIN
    MEM -->|Profile, Habits, Tasks, Missions| BRAIN
    BRAIN -->|Streaming Sentences| TTS
    TTS -->|Pipelined 24kHz PCM Chunks| WS_SRV
    WS_SRV -->|Binary Chunks| WS_RX
    BRAIN -->|Token Counts & Headers| QUOTA

    AUTH <-->|Bearer Session Token| Parent Portal
    MEM <-->|REST API JSON| Parent Portal
    DEVICE -->|Heartbeat & Controls| WS_SRV
```

---

## 4. Requirement Specifications Across 15 Product Areas

### Area 1: Child Profile & Profile Editing
- **ID:** `REQ-PROF-01`
- **Description:** Centralized child identity profile tracking developmental age, bedtime, permissions, medical details, likes, dislikes, and communication preferences.
- **Functional Requirements:**
  1. Retrieve child profile via `GET /api/child/profile`.
  2. Update profile via `POST /api/child/profile` with automatic persistence to `backend/uploads/child_profile.json`.
  3. Support parent editing of bedtime curfew, daily talk limit (minutes), speaker volume default, and emergency contacts.
  4. Real-time reflection: Profile changes must immediately invalidate in-memory caches and re-inject updated directives into the AI system prompt.
- **Acceptance Criteria:**
  - Saving updated likes/dislikes in `#childProfileModal` immediately alters the LLM context prompt on the next voice turn without server reboot.

---

### Area 2: Overview & Growth Cockpit, Metrics & Milestones
- **ID:** `REQ-GROWTH-01`
- **Description:** Real-time developmental overview dashboard summarizing spoken minutes, inquiry volume, kindness stars, and conversational vocabulary.
- **Functional Requirements:**
  1. Telemetry endpoint `GET /api/growth/metrics` computes actual turn statistics from `sessions.json`.
  2. Honest zero-state: When 0 turns exist, report 0 minutes and 0 inquiries without artificial clamps or mock inflation.
  3. Display interactive vocabulary pill list representing descriptive words acquired during conversations.
  4. Display qualitative interest cards (Space Exploration, Creative Art, Nature & Wildlife, Building).
- **Acceptance Criteria:**
  - Dashboard cards display accurate numbers reflecting authentic child conversation history.

---

### Area 3: Daily Routines, Habit CRUD, Completion, Streaks & Stars
- **ID:** `REQ-HABIT-01`
- **Description:** Gamified habit tracking system to cultivate positive morning, mealtime, hygiene, tidy-up, and bedtime habits.
- **Functional Requirements:**
  1. Provide full CRUD for habits via `GET /api/habits`, `POST /api/habits`, and `DELETE /api/habits/:id`.
  2. Support 1-click completion toggle (`POST /api/habits/toggle`) that updates streak count and triggers voice praise.
  3. Manner Star award mechanism (`POST /api/habits/award-star`) to reinforce courtesy, kindness, and habit completion.
  4. Voice Directive integration: Clicking prompt button triggers Edge-TTS audio encouraging the child.
- **Acceptance Criteria:**
  - Habit check-offs persist in `backend/uploads/child_profile.json` (or `habits.json`) and update streak counters reliably.

---

### Area 4: Socratic Missions & Custom Mission Persistence
- **ID:** `REQ-SOCRATIC-01`
- **Description:** Parental directives instructing KOTL to steer conversations toward specific inquiry themes using Socratic questioning rather than lecturing.
- **Functional Requirements:**
  1. Manage missions via `GET /api/parent/missions`, `POST /api/parent/missions`, and `DELETE /api/parent/missions/:id`.
  2. Toggle mission active status via `POST /api/parent/missions/toggle`.
  3. Dynamic LLM injection: Active missions must automatically format into the system prompt:
     `[Mission: <Title>]: <Directive>`.
- **Acceptance Criteria:**
  - When a mission is active (e.g. "Encourage Eating Green Veggies"), KOTL gracefully steers relevant food discussions toward superhero stamina without pushiness.

---

### Area 5: Tasks & Activities Management (NEW CORE FEATURE)
- **ID:** `REQ-TASK-01`
- **Description:** Structured task and activity management system allowing parents to assign, schedule, track, and review educational tasks, home responsibilities, and creative activities.
- **Functional Requirements:**
  1. **Task Data Model:**
     - `id`: Unique identifier (string, e.g. `task-1730000000-abcd`).
     - `title`: Short task name (e.g. "Science Homework: Solar System Diagram").
     - `category`: Task category (`"School Project"`, `"Homework"`, `"Reading"`, `"Creative Arts"`, `"Household Chore"`, `"Physical Activity"`).
     - `instructions`: Clear, child-friendly steps or instructions.
     - `due_date`: Target completion date (ISO string or YYYY-MM-DD).
     - `due_time`: Optional target time of day (e.g. `"17:30"`).
     - `status`: `"pending"` | `"in_progress"` | `"completed"` | `"overdue"`.
     - `priority`: `"low"` | `"medium"` | `"high"`.
     - `reward_stars`: Number of manner/achievement stars awarded on completion (default: 2).
     - `parent_notes`: Optional private parent notes or grading criteria.
     - `milestones`: Array of step objects `[{ id, title, completed }]` for multi-step tasks.
     - `ai_hints`: Array of Socratic prompts/hints for KOTL to use during guidance.
     - `created_at` & `completed_at`: ISO timestamps.
  2. **Backend API Endpoints:**
     - `GET /api/tasks`: List all tasks with optional query filters (`status`, `category`).
     - `POST /api/tasks`: Create new task.
     - `PUT /api/tasks/:id`: Update existing task details, instructions, or due dates.
     - `POST /api/tasks/:id/toggle`: Toggle task completion status; automatically award stars when marked complete.
     - `POST /api/tasks/:id/milestone`: Toggle individual milestone completion.
     - `DELETE /api/tasks/:id`: Remove task.
  3. **Dashboard UI Integration:**
     - **Main Navigation:** Add dedicated `"Tasks & Activities"` navigation item to desktop sidebar and mobile navigation.
     - **Overview Quick Action:** Add `"+ Create a Task"` quick action button in the Overview & Growth tab header.
     - **Task Manager View:** Bento card grid and list view displaying:
       - Active Tasks (with countdown, progress bar, milestone check-list).
       - Filter by category and status tabs (All, Active, School Projects, Completed).
       - Quick completion checkmark that triggers celebratory animation.
       - Socratic Voice Prompt button: Dispatches voice reminder/hint directly to the robot companion.
- **Acceptance Criteria:**
  - Parents can create a task with milestones, see it displayed in the UI, toggle its milestones, and mark it complete with automatic star rewards.

---

### Area 6: School Projects (Instructions, Milestones, Progress Reports)
- **ID:** `REQ-PROJ-01`
- **Description:** Specialized sub-module of Tasks dedicated to academic and long-horizon school projects requiring progressive research, materials gathering, and drafting.
- **Functional Requirements:**
  1. Support step-by-step milestones (e.g. 1. Gather materials, 2. Draw outline, 3. Write summary, 4. Final review).
  2. Calculate and render project completion percentage based on completed milestones.
  3. Project-wise Progress Reports: Synthesize task notes and milestone logs into the parent-facing 8-dimension developmental report under Dimension 6 (Socratic Reasoning & Problem Solving).
  4. Project reminder scheduling: Surface upcoming project deadlines in the daily overview banner.
- **Acceptance Criteria:**
  - School projects track individual milestone progress accurately and reflect completion status directly in the 8-Dimension Report.

---

### Area 7: KOTL AI Companion Task Guidance Engine
- **ID:** `REQ-AI-TASK-01`
- **Description:** Cognitive integration enabling KOTL to proactively guide, mentor, and provide Socratic hints to Parth regarding his active tasks and school projects.
- **Functional Requirements:**
  1. **Context Prompt Injection:** The system prompt generator in `backend/services/assistant.js` must inject active tasks and school projects:
     ```
     Active Tasks & School Projects:
     - [School Project: Plant Growth in Cup]: Milestone 2 of 3. Hint: Ask Parth if his gram seed has sprouted green leaves yet!
     - [Homework: English Spelling]: Due Today 6:00 PM. Words: "Curious", "Galaxy".
     ```
  2. **Conversation Triggering:** When Parth greets KOTL or asks "what should I do?", KOTL warmly mentions active tasks without nagging:
     *"Hey Parth! Today is our science project day! Did you check your little plant cup this morning?"*
  3. **Socratic Hinting System:** When Parth asks for help with his task, KOTL guides him with questions instead of giving the answer directly:
     *"What happens when a seed drinks warm water and sits near the sunshine? What do you think pops out first?"*
  4. **Celebration & Star Dispatch:** Upon verbal task completion confirmation, KOTL celebrates enthusiastically and triggers eye animations (`star_eyes`, `happy`).
- **Acceptance Criteria:**
  - AI responses during live dialogue actively reference open project milestones and provide multi-turn Socratic hints when queried by the child.

---

### Area 8: Dialogue History, Audio Playback, Search & Memory Controls
- **ID:** `REQ-HIST-01`
- **Description:** Complete conversational transcript archive with playback, day-wise grouping, and keyword filtering.
- **Functional Requirements:**
  1. Retrieve day-wise conversation tree via `GET /api/history/daywise`.
  2. Day selector pills allowing parents to navigate through past days.
  3. Interactive speech bubbles with distinct child (blue/amber) and KOTL (indigo) styling.
  4. Audio Playback: Play button per message triggering `/api/speak` with `en-IN-PrabhatNeural`.
  5. Live Dialogue Simulator: Input box allowing parents to test AI responses directly from the dashboard.
  6. Memory extraction: Dialogue turns automatically scan for preferences, dislikes, and curiosity queries to update `child_profile.json`.
- **Acceptance Criteria:**
  - Spoken dialogue displays within 1 second of turn completion; search bar instantly filters turns matching keywords.

---

### Area 9: 8-Dimension Developmental Report & Evidence Sources
- **ID:** `REQ-REP-01`
- **Description:** Pediatrician-aligned, observational developmental report analyzing conversational evidence across 8 developmental dimensions.
- **Functional Requirements:**
  1. Generate report via `GET /api/child/report` or `POST /api/child/report/generate`.
  2. **8 Transparent Dimensions:**
     - 1. Linguistic & Vocabulary Range
     - 2. Cognitive Curiosity & Inquiry Frequency
     - 3. Emotional Expression & Self-Regulation
     - 4. Routine Adherence & Habit Consistency
     - 5. Physical Activity & Outdoor Movement
     - 6. Socratic Reasoning & Problem Solving (incorporating Task & Project progress)
     - 7. Social Manners, Empathy & Kindness
     - 8. Bedtime Routine & Sleep Readiness
  3. **Truthful Data Handling:**
     - When turns = 0: Report `insufficient` status, null score, and explicit prompt to converse with KOTL.
     - When turns < 5: Report `preliminary` baseline.
  4. Export: Dedicated Print / PDF export stylesheet for pediatrician consultations.
- **Acceptance Criteria:**
  - Clicking "View 8-Dimension Report" opens the comprehensive modal, renders all 8 radial progress indicators, lists verifiable dialogue quotes, and exports cleanly to PDF.

---

### Area 10: Device Status, Heartbeat, Remote Volume & Controls
- **ID:** `REQ-DEV-01`
- **Description:** Real-time hardware companion observability and control cockpit.
- **Functional Requirements:**
  1. WebSocket heartbeat tracking: Distinguishes physical robot client (`KOTL-ESP32`) from browser dashboards.
  2. Reports live RSSI (WiFi signal strength), local IP, uptime, and online/offline status with green/amber/slate pills.
  3. Remote volume control: Master slider (0% to 100%) persisting to `device-config.json` and synchronized with ESP32 volume state.
  4. Bedtime Sleep Mode toggle: Mutes mic, dims OLED screen, and enters calming state.
  5. Emergency SOS beacon: 1-click distress mode displaying emergency contacts and dispatching notification.
- **Acceptance Criteria:**
  - When ESP32 disconnects, the dashboard status pill transitions from "Online" to "Offline" within 15 seconds.

---

### Area 11: Walkie-Talkie Audio Recording & Robot Delivery
- **ID:** `REQ-WALKIE-01`
- **Description:** Asynchronous parent-to-child voice memo and quick-directive walkie-talkie link.
- **Functional Requirements:**
  1. Dashboard MediaRecorder capturing voice memos from parents.
  2. Upload and archive memos via `POST /api/voice-memo/send` and `GET /api/voice-memo/history`.
  3. Presets for common reminders ("Drink Fresh Water", "Tidy Up Toys", "Bedtime Hug").
  4. Hardware delivery: WebSocket event `{ type: "voice_memo_notification", memo }` broadcast to ESP32.
  5. Companion audio playback: ESP32 plays parent memo through I2S speaker and displays envelope icon on OLED.
- **Acceptance Criteria:**
  - Recording a 5-second memo in dashboard saves to backend, appears in memo history, and signals the companion device.

---

### Area 12: Safety Guardrails, Parent Mode & Backend Authorization
- **ID:** `REQ-AUTH-01`
- **Description:** Zero-trust parental access control protecting operational telemetry, quota details, and configuration settings.
- **Functional Requirements:**
  1. Production Parent PIN authentication via `POST /api/auth/parent-session`.
  2. Cryptographically secure 256-bit random session tokens expiring after 15 minutes.
  3. Explicit logout via `DELETE /api/auth/parent-session`.
  4. Sensitive endpoints (`/api/usage`, admin status) enforce parent session verification.
  5. Zero storage of raw PIN in `localStorage` or `sessionStorage`.
  6. Development mode bypass: Local offline development mode allows open dashboard inspection without requiring cloud credentials.
- **Acceptance Criteria:**
  - Unauthenticated requests to `/api/usage` in production return HTTP 401; entering the correct PIN unlocks telemetry for 15 minutes.

---

### Area 13: AI Quotas, Usage Telemetry & Quota Transparency
- **ID:** `REQ-QUOTA-01`
- **Description:** Real-time token and request consumption monitor across all four AI service providers.
- **Functional Requirements:**
  1. Monitor 4 distinct providers:
     - **Google Gemini:** Application-measured daily requests (1,500 req/day free tier).
     - **Groq Whisper STT:** Provider-reported seconds and requests (7,200 sec/day free tier).
     - **Groq LLaMA LLM:** Provider-reported token and request limits with reset countdowns.
     - **Microsoft Edge-TTS:** Application-measured synthesis turns (unlimited free tier).
  2. Clear differentiation between Provider-Reported headers and Application-Counted metrics.
  3. User-friendly dashboard cards with percentage progress bars, remaining allowances, and reset periods.
  4. Developer Diagnostics Drawer for inspecting raw response headers (`x-ratelimit-*`).
- **Acceptance Criteria:**
  - Quota cards accurately reflect real-world free-tier boundaries and update after every voice exchange.

---

### Area 14: Child-Facing Companion Physical Experience
- **ID:** `REQ-PHYS-01`
- **Description:** Tactile, acoustic, and visual feedback that makes KOTL feel alive, comforting, and approachable.
- **Functional Requirements:**
  1. **RoboEyes OLED Expressions:** 10+ expressive animations (`neutral`, `blink`, `happy`, `curious`, `thinking`, `speaking`, `sleepy`, `star_eyes`, `surprised`).
  2. **Acoustic Signature:** Friendly, melodic Indian English male voice (`en-IN-PrabhatNeural`) synthesized at 24kHz with relaxed human pacing.
  3. **Capacitive Touch:** Instant tactile activation on touch pin 15 for interruption or wake-up.
  4. **Pre-roll VAD Buffer:** Ring buffer preserving 300ms of audio before speech onset to eliminate beginning-of-sentence clipping.
- **Acceptance Criteria:**
  - Saying "Hey KOTL, what is the sun?" captures the complete phrase without onset truncation and responds in under 1.5 seconds.

---

### Area 15: Responsive Dashboard UI, Accessibility & Error States
- **ID:** `REQ-UI-01`
- **Description:** Accessible, mobile-first responsive dashboard interface ensuring seamless operation across smartphones, tablets, and desktop displays.
- **Functional Requirements:**
  1. Responsive layout: Desktop left sidebar, mobile fixed bottom navigation bar.
  2. Empty states: Meaningful, uplifting illustrations and guidance when lists or histories are empty.
  3. Error resilience: Non-blocking toast notifications and graceful offline state indicators.
  4. Typography & Styling: Friendly Fredoka headers, clean Inter body text, and accessible Tailwind color palettes.
- **Acceptance Criteria:**
  - Dashboard renders seamlessly without layout breakage across 375px (iPhone SE), 768px (iPad), and 1920px (Desktop) viewports.

---

## 5. Non-Functional & Technical Requirements

| Category | Requirement | Specification |
|:---|:---|:---|
| **Audio Latency** | End-to-end voice turnaround time | Audible audio within 1,200 ms of child finishing speech |
| **Microphone Capture** | Sample Rate & Format | 16,000 Hz, 16-bit Mono PCM, 300ms pre-roll circular buffer |
| **Speaker Playback** | Sample Rate & Format | 24,000 Hz, 16-bit Mono PCM, pipelined chunk streaming |
| **Firmware Partition** | ESP32 Flash Partitioning | Huge APP (3MB No OTA / 1MB SPIFFS) |
| **Backend Storage** | Data Resilience | JSON stores in `backend/uploads/` with Render persistent volume mount |
| **Security & Privacy** | Session Management | Cryptographic 256-bit parent tokens, 15-minute expiry, zero raw PIN storage |
| **Content Safety** | Child Guardrails | 100% G-rated, zero dangerous advice, mandatory parent referrals |
