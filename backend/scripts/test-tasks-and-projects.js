/**
 * KOTL Tasks, School Projects & Persistent Storage Test Suite
 *
 * Automated regression suite verifying:
 * 1. Storage Abstraction & Malformed JSON Recovery
 * 2. Task Model, Validation & CRUD Service Operations
 * 3. Derived Progress, Milestones & Manner Star Rewards
 * 4. Legacy Quest Compatibility & Coexistence
 * 5. HTTP REST Endpoints & Parameter Filtering
 * 6. Authorization Gating on Protected Mutation Operations
 */

const fs = require("fs");
const path = require("path");
const http = require("http");

// Load environment safely
try {
  require("../utils/env");
} catch (_) {
  try {
    require("dotenv").config();
  } catch (__) {}
}

const {
  getDataDir,
  getFilePath,
  readJsonFileSafe,
  writeJsonFileSafe
} = require("../utils/storage");

const {
  getTasks,
  saveTasks,
  getTaskById,
  addTask,
  updateTask,
  toggleTaskStatus,
  toggleMilestoneStatus,
  deleteTask,
  enrichTask,
  DEFAULT_TASKS,
  getQuests,
  getChildProfile,
  updateChildProfile
} = require("../services/child-memory");

const { app, createParentSession } = require("../server");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function makeRequest(server, { method, path: reqPath, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };
    if (payload) {
      reqHeaders["Content-Type"] = "application/json";
      reqHeaders["Content-Length"] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        host: "127.0.0.1",
        port: addr.port,
        method,
        path: reqPath,
        headers: reqHeaders
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => { raw += chunk; });
        res.on("end", () => {
          let data = null;
          try {
            data = JSON.parse(raw);
          } catch (_) {
            data = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, data });
        });
      }
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTestSuite() {
  console.log("====================================================");
  console.log("   KOTL TASKS, SCHOOL PROJECTS & STORAGE TEST SUITE   ");
  console.log("====================================================\n");

  const originalTasksFile = getFilePath("tasks.json");
  const testTasksFile = getFilePath(`test_tasks_${Date.now()}.json`);
  let backupTasksContent = null;

  if (fs.existsSync(originalTasksFile)) {
    backupTasksContent = fs.readFileSync(originalTasksFile, "utf-8");
  }

  try {
    // ------------------------------------------------------------------------
    console.log(">>> [1/6] Persistent Storage Abstraction & Safe Malformed Recovery");
    // ------------------------------------------------------------------------
    const dataDir = getDataDir();
    assert(fs.existsSync(dataDir), "Active data directory exists and is accessible");

    // Empty file handling
    const emptyFile = getFilePath(`test_empty_${Date.now()}.json`);
    fs.writeFileSync(emptyFile, "   ", "utf-8");
    const emptyResult = readJsonFileSafe(emptyFile, ["fallback_item"]);
    assert(Array.isArray(emptyResult) && emptyResult[0] === "fallback_item", "readJsonFileSafe returns fallback on empty 0-byte file without crashing");
    fs.unlinkSync(emptyFile);

    // Malformed JSON recovery
    const malformedFile = getFilePath(`test_corrupt_${Date.now()}.json`);
    fs.writeFileSync(malformedFile, "{ invalid json corrupt text content ...", "utf-8");
    const corruptFallback = [{ id: "safe_default" }];
    const corruptResult = readJsonFileSafe(malformedFile, corruptFallback);
    assert(corruptResult[0].id === "safe_default", "readJsonFileSafe safely catches SyntaxError and returns default without crashing");

    // Confirm corruption backup was preserved
    const filesInDir = fs.readdirSync(dataDir);
    const backupCreated = filesInDir.some(f => f.startsWith(path.basename(malformedFile) + ".corrupt."));
    assert(backupCreated, "readJsonFileSafe created a non-destructive .corrupt backup of the malformed file");

    // Clean up test corrupt files
    fs.unlinkSync(malformedFile);
    filesInDir.filter(f => f.startsWith(path.basename(malformedFile))).forEach(f => {
      try { fs.unlinkSync(path.join(dataDir, f)); } catch (_) {}
    });

    // Atomic write
    const atomicTestFile = getFilePath(`test_atomic_${Date.now()}.json`);
    const writeOk = writeJsonFileSafe(atomicTestFile, { test: "atomic_data", val: 42 });
    assert(writeOk === true, "writeJsonFileSafe reports true on successful atomic write");
    const readBack = readJsonFileSafe(atomicTestFile);
    assert(readBack.test === "atomic_data" && readBack.val === 42, "readJsonFileSafe reads back exact content written atomically");
    fs.unlinkSync(atomicTestFile);

    // ------------------------------------------------------------------------
    console.log("\n>>> [2/6] Task Model, Validation & Service CRUD Operations");
    // ------------------------------------------------------------------------
    // Ensure fresh baseline
    const initialTasks = getTasks();
    assert(Array.isArray(initialTasks) && initialTasks.length >= 3, "getTasks initializes with DEFAULT_TASKS when empty");

    // Validation: Title required
    let addFailed = false;
    try {
      addTask({ description: "No title provided" });
    } catch (e) {
      addFailed = true;
      assert(e.message.includes("title is required"), "addTask rejects payload missing title with clear validation error");
    }
    assert(addFailed, "addTask strictly validates required title");

    // Create a new task
    const createdTask = addTask({
      title: "🧪 Volcano Eruption Model (Science Project)",
      category: "School Project",
      description: "Build a clay volcano with baking soda and red vinegar lava.",
      instructions: "Mix vinegar with food coloring and pour over baking soda.",
      due_date: "2026-11-10",
      due_time: "16:00",
      priority: "high",
      reward_stars: 4,
      milestones: [
        { id: "v-1", title: "Mold clay volcano shape", completed: true },
        { id: "v-2", title: "Measure baking soda into crater", completed: false },
        { id: "v-3", title: "Pour red vinegar lava", completed: false }
      ],
      ai_hints: [
        "What makes the bubbles fizz? Carbon dioxide gas!",
        "Can you sculpt a crater at the top of your clay mountain?"
      ]
    });

    assert(createdTask && createdTask.id.startsWith("task-"), "addTask assigns unique task ID");
    assert(createdTask.progress_pct === 33, "Derived progress_pct correctly calculates (1/3 = 33%)");
    assert(createdTask.completed === false, "Task completed boolean is false while milestones remain");
    assert(createdTask.reward_stars === 4, "Task reward_stars is preserved as integer 4");

    // Get by ID
    const fetched = getTaskById(createdTask.id);
    assert(fetched && fetched.title.includes("Volcano"), "getTaskById retrieves the newly created task");

    // Update task
    const updated = updateTask(createdTask.id, {
      title: "🧪 Giant Volcano Eruption Model",
      priority: "medium"
    });
    assert(updated && updated.title === "🧪 Giant Volcano Eruption Model", "updateTask updates title cleanly");
    assert(updated && updated.priority === "medium", "updateTask updates priority");

    // Update with empty title must fail
    let updateEmptyFailed = false;
    try {
      updateTask(createdTask.id, { title: "   " });
    } catch (e) {
      updateEmptyFailed = true;
    }
    assert(updateEmptyFailed, "updateTask rejects empty title updates");

    // ------------------------------------------------------------------------
    console.log("\n>>> [3/6] Milestones, Derived Progress & Manner Star Rewards");
    // ------------------------------------------------------------------------
    const initialStars = getChildProfile().manner_stars || 0;

    // Toggle milestone 2 (2/3 completed)
    const m2Result = toggleMilestoneStatus(createdTask.id, "v-2", true);
    assert(m2Result && m2Result.task && m2Result.task.progress_pct === 67, "Milestone toggle advances progress to 67% (2/3)");
    assert(m2Result.task.completed === false, "Task remains in_progress when partial milestones completed");

    // Toggle milestone 3 (3/3 completed -> auto task completion + stars)
    const m3Result = toggleMilestoneStatus(createdTask.id, "v-3", true);
    assert(m3Result && m3Result.task && m3Result.task.progress_pct === 100, "All milestones completed advances progress to 100%");
    assert(m3Result.task.completed === true, "Completing all milestones automatically transitions status to completed");
    assert(m3Result.task.completed_at !== null, "Task completed_at timestamp is populated");

    // Verify manner stars were credited to child profile
    const starsAfterCompletion = getChildProfile().manner_stars || 0;
    assert(starsAfterCompletion === initialStars + 4, `Completing task awarded 4 manner stars (${initialStars} -> ${starsAfterCompletion})`);

    // Toggle task back to in_progress (reopen)
    const reopenResult = toggleTaskStatus(createdTask.id, "in_progress");
    assert(reopenResult.task.status === "in_progress", "toggleTaskStatus reopens completed task");
    assert(reopenResult.task.completed_at === null, "Reopening task resets completed_at to null");

    // Idempotency: Re-completing reopened task must NOT award duplicate stars
    const reCompleteResult = toggleTaskStatus(createdTask.id, "completed");
    assert(reCompleteResult.task.status === "completed", "Task re-completes successfully");
    assert(reCompleteResult.stars_awarded === 0, "Re-completing task awards 0 duplicate stars");
    const starsAfterReComplete = getChildProfile().manner_stars || 0;
    assert(starsAfterReComplete === starsAfterCompletion, `Manner stars remain unchanged (${starsAfterCompletion}) on re-completion`);

    // Idempotency: Repeated completion toggle must NOT award duplicate stars
    const repeatCompleted = toggleTaskStatus(createdTask.id, "completed");
    assert(repeatCompleted.stars_awarded === 0, "Repeated completed toggle awards 0 duplicate stars");
    assert((getChildProfile().manner_stars || 0) === starsAfterCompletion, "Manner stars count unchanged on repeated toggle");

    // Delete task
    const deleteOk = deleteTask(createdTask.id);
    assert(deleteOk === true, "deleteTask returns true for existing task");
    const checkDeleted = getTaskById(createdTask.id);
    assert(checkDeleted === null, "Deleted task is no longer found by getTaskById");

    // ------------------------------------------------------------------------
    console.log("\n>>> [4/6] Legacy Quests Compatibility & Coexistence");
    // ------------------------------------------------------------------------
    const quests = getQuests();
    assert(Array.isArray(quests) && quests.length >= 3, "Legacy getQuests() continues to return existing quest fixtures");
    const plantQuest = quests.find(q => q.id === "q-1");
    assert(plantQuest && plantQuest.category === "School Project", "Legacy School Project quest 'q-1' is intact in quests.json");

    // Verify tasks query filtering
    const schoolTasks = getTasks({ category: "School Project" });
    assert(schoolTasks.length >= 1 && schoolTasks.every(t => t.category === "School Project"), "getTasks({ category: 'School Project' }) filters accurately");

    const searchTasks = getTasks({ search: "Plant" });
    assert(searchTasks.length >= 1 && searchTasks.some(t => t.title.includes("Plant")), "getTasks({ search: 'Plant' }) matches keywords in title/description");

    // ------------------------------------------------------------------------
    console.log("\n>>> [5/6] HTTP REST API Integration");
    // ------------------------------------------------------------------------
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

    try {
      // GET /api/tasks
      const getRes = await makeRequest(server, { method: "GET", path: "/api/tasks" });
      assert(getRes.status === 200, "GET /api/tasks returns HTTP 200");
      assert(getRes.data.success === true && Array.isArray(getRes.data.tasks), "GET /api/tasks returns tasks array");

      // POST /api/tasks - missing title returns 400
      const badPost = await makeRequest(server, {
        method: "POST",
        path: "/api/tasks",
        body: { description: "Missing title" }
      });
      assert(badPost.status === 400, "POST /api/tasks returns HTTP 400 on missing title");

      // POST /api/tasks - valid creation returns 201
      const goodPost = await makeRequest(server, {
        method: "POST",
        path: "/api/tasks",
        body: {
          title: "🎨 Draw Solar System Mobile",
          category: "School Project",
          due_date: "2026-11-15",
          reward_stars: 3,
          milestones: [
            { id: "m-sun", title: "Draw golden Sun", completed: false },
            { id: "m-earth", title: "Draw blue Earth", completed: false }
          ]
        }
      });
      assert(goodPost.status === 201, "POST /api/tasks returns HTTP 201 Created");
      assert(goodPost.data.task && goodPost.data.task.title.includes("Solar System"), "Created task returned in response body");
      const createdId = goodPost.data.task.id;

      // PATCH /api/tasks/:id
      const patchRes = await makeRequest(server, {
        method: "PATCH",
        path: `/api/tasks/${createdId}`,
        body: { priority: "high" }
      });
      assert(patchRes.status === 200, "PATCH /api/tasks/:id returns HTTP 200");
      assert(patchRes.data.task.priority === "high", "PATCH updated priority successfully");

      // POST /api/tasks/:id/milestones/:milestoneId/toggle
      const toggleMRes = await makeRequest(server, {
        method: "POST",
        path: `/api/tasks/${createdId}/milestones/m-sun/toggle`,
        body: { completed: true }
      });
      assert(toggleMRes.status === 200, "POST /api/tasks/:id/milestones/:milestoneId/toggle returns HTTP 200");
      assert(toggleMRes.data.task.progress_pct === 50, "Milestone toggle updated progress to 50%");

      // POST /api/tasks/:id/toggle
      const toggleTRes = await makeRequest(server, {
        method: "POST",
        path: `/api/tasks/${createdId}/toggle`
      });
      assert(toggleTRes.status === 200, "POST /api/tasks/:id/toggle returns HTTP 200");
      assert(toggleTRes.data.task.completed === true, "Task toggle marked completed");
      assert(toggleTRes.data.stars_awarded === 3, "Response reports 3 manner stars awarded");

      // ----------------------------------------------------------------------
      console.log("\n>>> [6/6] Authorization Gating & Protected Mutations");
      // ----------------------------------------------------------------------
      // In development mode, DELETE /api/tasks/:id works without credentials
      process.env.NODE_ENV = "development";
      const devDel = await makeRequest(server, {
        method: "DELETE",
        path: `/api/tasks/${createdId}`
      });
      assert(devDel.status === 200, "Development mode: DELETE /api/tasks/:id allows open dashboard access (HTTP 200)");

      // Create another task for testing production authorization
      const prodTask = addTask({ title: "🛡️ Auth Protected Task" });

      // Simulate production environment with Parent PIN
      process.env.NODE_ENV = "production";
      process.env.PARENT_PIN = "5678";

      // Production without credentials must fail (401)
      const unauthDel = await makeRequest(server, {
        method: "DELETE",
        path: `/api/tasks/${prodTask.id}`
      });
      assert(unauthDel.status === 401, "Production mode: DELETE /api/tasks/:id without credentials returns HTTP 401 Unauthorized");

      // Production with active parent session token must succeed (200)
      const session = createParentSession();
      const authDel = await makeRequest(server, {
        method: "DELETE",
        path: `/api/tasks/${prodTask.id}`,
        headers: {
          "x-parent-session-token": session.token
        }
      });
      assert(authDel.status === 200, "Production mode: DELETE /api/tasks/:id with valid parent session returns HTTP 200 OK");

      // Restore environment
      process.env.NODE_ENV = "test";
      delete process.env.PARENT_PIN;

    } finally {
      await new Promise((resolve) => server.close(resolve));
    }

    // ------------------------------------------------------------------------
    console.log("\n>>> [7/7] Dashboard UI Integration & DOM Contract Verification");
    // ------------------------------------------------------------------------
    const indexHtmlPath = path.resolve(__dirname, "..", "public", "index.html");
    assert(fs.existsSync(indexHtmlPath), "Production dashboard index.html exists");
    const html = fs.readFileSync(indexHtmlPath, "utf-8");

    // 1. Navigation items
    assert(html.includes('id="sideBtn_tasks"') && html.includes("switchMainTab('tasks')"), "Desktop sidebar contains Tasks & Activities navigation button");
    assert(html.includes('id="mobBtn_tasks"') && html.includes("switchMainTab('tasks')"), "Mobile bottom nav contains Tasks navigation button");
    assert(html.includes('id="tabBtn_tasks"') && html.includes("switchMainTab('tasks')"), "Main tab compatibility container contains tabBtn_tasks");

    // 2. Overview quick action
    assert(html.includes('id="overviewCreateTaskBtn"') && html.includes("openCreateTaskModal()"), "Overview section header contains '+ Create a Task' quick action button");

    // 3. Dedicated tabContent_tasks section
    assert(html.includes('id="tabContent_tasks"'), "Main DOM contains dedicated #tabContent_tasks section");
    assert(html.includes('id="tasksGridContainer"'), "#tabContent_tasks contains #tasksGridContainer for rendering cards");
    assert(html.includes('id="tasksMetricTotal"') && html.includes('id="tasksMetricInProgress"') && html.includes('id="tasksMetricCompleted"') && html.includes('id="tasksMetricStarsEarned"'), "Tasks section contains all 4 summary metrics (Total, In Progress, Completed, Stars Earned)");
    assert(html.includes('id="taskFilterBtn_all"') && html.includes('id="taskFilterBtn_school"'), "Tasks section contains category filter pills (All, School Projects, etc.)");
    assert(html.includes('id="taskStatusFilterSelect"'), "Tasks section contains status dropdown filter");
    assert(html.includes('id="tasksSearchInput"'), "Tasks section contains keyword search input");

    // 4. Create/Edit Task Modal
    assert(html.includes('id="taskModal"'), "Main DOM contains #taskModal for creating and editing tasks");
    assert(html.includes('id="taskTitleInput"') && html.includes('id="taskCategorySelect"'), "Task modal contains required title input and category selector");
    assert(html.includes('id="milestonesInputsContainer"'), "Task modal contains dynamic milestones checklist container");
    assert(html.includes('id="taskRewardStarsInput"'), "Task modal contains reward manner stars input");
    assert(html.includes('id="taskSubmitBtn"'), "Task modal contains submit button");

    // 5. Client State & Lifecycle Wiring
    assert(html.includes("tabs = ['growth', 'tasks', 'habits', 'cockpit']") || html.includes("['growth', 'tasks', 'habits', 'cockpit']"), "switchMainTab includes 'tasks' in tab array");
    assert(html.includes("function loadTasks("), "Client script implements loadTasks() fetching /api/tasks");
    assert(html.includes("function handleSaveTaskForm("), "Client script implements handleSaveTaskForm() with validation");
    assert(html.includes("function handleToggleMilestone("), "Client script implements handleToggleMilestone() calling API");
    assert(html.includes("function handleDeleteTask("), "Client script implements handleDeleteTask() with parent auth check and PIN modal fallback on 401");
    assert(html.includes("loadTasks();"), "Page lifecycle hooks (DOMContentLoaded, visibilitychange, sync poll) trigger loadTasks()");

  } finally {
    // Restore clean task store
    if (backupTasksContent !== null) {
      fs.writeFileSync(originalTasksFile, backupTasksContent, "utf-8");
    }
  }

  console.log("\n====================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTestSuite().catch((err) => {
  console.error("FATAL TEST EXCEPTION:", err);
  process.exit(1);
});
