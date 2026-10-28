/**
 * Test Suite: KOTL Child Development Intelligence & Skills Analytics
 *
 * Verifies:
 * 1. 8-Domain Developmental Taxonomy completeness (24 observable skills).
 * 2. Multi-source evidence aggregation (dialogue, tasks, milestones, habits, profile).
 * 3. Evidence status truthfulness: "demonstrated", "emerging", and "insufficient_evidence" ("Not enough observations yet").
 * 4. Zero fabricated scores for unobserved skills (score === null).
 * 5. Observation coverage percentage and radar chart data model.
 * 6. Suggested next activities tied directly to unobserved/emerging skills.
 * 7. Non-clinical transparency disclosure.
 * 8. REST API endpoints (/api/skills/analytics, /api/skills/taxonomy, /api/test/chat timing).
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const http = require("http");

const {
  SKILL_TAXONOMY,
  computeSkillsAnalytics,
  extractAllUserTurns
} = require("../services/skills-analytics");
const { app } = require("../server");

let passed = 0;
let failed = 0;

function runSync(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         -> ${err.message}`);
    failed++;
  }
}

async function runAsync(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         -> ${err.message}`);
    failed++;
  }
}

async function main() {
  console.log("====================================================");
  console.log("   KOTL SKILLS ANALYTICS & INTELLIGENCE TEST SUITE   ");
  console.log("====================================================\n");

  console.log(">>> [1/5] Taxonomy Completeness & Categorization");
  runSync("Taxonomy contains exactly 8 core developmental categories", () => {
    const keys = Object.keys(SKILL_TAXONOMY);
    assert.strictEqual(keys.length, 8);
    assert(keys.includes("language_communication"));
    assert(keys.includes("logical_math"));
    assert(keys.includes("scientific_curiosity"));
    assert(keys.includes("creativity_imagination"));
    assert(keys.includes("emotional_regulation"));
    assert(keys.includes("social_perspective"));
    assert(keys.includes("executive_skills"));
    assert(keys.includes("world_knowledge"));
  });

  runSync("Each category defines 3 observable, age-appropriate skills (24 total)", () => {
    let totalSkills = 0;
    for (const catKey of Object.keys(SKILL_TAXONOMY)) {
      const cat = SKILL_TAXONOMY[catKey];
      assert(Array.isArray(cat.skills), `Category ${catKey} has skills array`);
      assert.strictEqual(cat.skills.length, 3, `Category ${catKey} defines 3 skills`);
      cat.skills.forEach(skill => {
        totalSkills++;
        assert(typeof skill.id === "string" && skill.id.length > 0);
        assert(typeof skill.name === "string" && skill.name.length > 0);
        assert(typeof skill.definition === "string" && skill.definition.length > 0);
        assert(typeof skill.sampleActivityPrompt === "string" && skill.sampleActivityPrompt.length > 0);
      });
    }
    assert.strictEqual(totalSkills, 24);
  });

  console.log("\n>>> [2/5] Evidence Aggregation & Status Truthfulness");
  const analytics = computeSkillsAnalytics({ refresh: true });

  runSync("Analytics extracts authentic turns and child name", () => {
    assert(analytics.success === true);
    assert(typeof analytics.child_name === "string" && analytics.child_name.length > 0);
    assert(typeof analytics.total_dialogue_turns_evaluated === "number");
    assert(typeof analytics.total_tasks_evaluated === "number");
    assert(typeof analytics.total_habits_evaluated === "number");
  });

  runSync("Observation coverage accurately reports observed vs total skills", () => {
    const cov = analytics.observation_coverage;
    assert(typeof cov.observed_skills === "number");
    assert.strictEqual(cov.total_skills, 24);
    assert(cov.coverage_pct >= 0 && cov.coverage_pct <= 100);
    assert(typeof cov.label === "string" && cov.label.includes("Coverage"));
  });

  runSync("Unobserved skills are honestly labeled 'Not enough observations yet' with null score", () => {
    assert(Array.isArray(analytics.unobserved_skills));
    analytics.unobserved_skills.forEach(skill => {
      assert.strictEqual(skill.status, "insufficient_evidence");
      assert.strictEqual(skill.status_label, "Not enough observations yet");
      assert.strictEqual(skill.score, null, "Unobserved skill must NEVER have a fabricated score");
      assert.strictEqual(skill.confidence, "Awaiting Data");
      assert(typeof skill.suggested_activity === "string");
    });
  });

  runSync("Demonstrated skills contain concrete dialogue or task evidence with timestamps", () => {
    assert(Array.isArray(analytics.strongest_skills));
    if (analytics.strongest_skills.length > 0) {
      const topSkill = analytics.strongest_skills[0];
      const validDemonstratedStatuses = [
        "demonstrated_in_activity",
        "active_inquiry",
        "emotional_expression",
        "observed_routine",
        "active_observation"
      ];
      assert(validDemonstratedStatuses.includes(topSkill.status), `topSkill.status ${topSkill.status} must be a demonstrated observation status`);
      assert.strictEqual(topSkill.score, null, "Observational skills must never fabricate arbitrary 75-95% scores");
      assert(topSkill.observation_count >= 2, "Strongest skills must have at least 2 verified observations");
      assert(typeof topSkill.evidence_level === "string" && topSkill.evidence_level.length > 0);
      assert(Array.isArray(topSkill.recent_evidence) && topSkill.recent_evidence.length > 0);
      const ev = topSkill.recent_evidence[0];
      assert(typeof ev.source === "string");
      assert(typeof ev.excerpt === "string");
      assert(typeof ev.note === "string");
      assert(typeof ev.evidence_type === "string", "Evidence must specify type (e.g., child_inquiry vs applied_milestone)");
    }
  });

  console.log("\n>>> [3/5] Radar Model & Socratic Activity Recommendations");
  runSync("Radar model provides 8 distinct axes with colors, icons, and labels", () => {
    assert(Array.isArray(analytics.radar_axes));
    assert.strictEqual(analytics.radar_axes.length, 8);
    analytics.radar_axes.forEach(axis => {
      assert(typeof axis.key === "string");
      assert(typeof axis.label === "string");
      assert(typeof axis.icon === "string");
      assert(typeof axis.color === "string" && axis.color.startsWith("#"));
      assert(typeof axis.value === "number");
      assert(typeof axis.has_data === "boolean");
      assert(typeof axis.coverage_pct === "number");
    });
  });

  runSync("Suggested activities return actionable ideas tied to specific skills", () => {
    assert(Array.isArray(analytics.suggested_activities));
    assert(analytics.suggested_activities.length > 0);
    analytics.suggested_activities.forEach(act => {
      assert(typeof act.id === "string");
      assert(typeof act.skill_id === "string");
      assert(typeof act.skill_name === "string");
      assert(typeof act.category_name === "string");
      assert(typeof act.suggestion === "string" && act.suggestion.length > 10);
    });
  });

  runSync("Includes non-clinical transparency disclosure", () => {
    assert(typeof analytics.transparency_notice === "string");
    assert(analytics.transparency_notice.includes("NOT"));
    assert(analytics.transparency_notice.includes("clinical"));
  });

  console.log("\n>>> [4/5] REST API Endpoints Integration");
  await runAsync("GET /api/skills/analytics returns HTTP 200 with complete analytics payload", async () => {
    await new Promise((resolve, reject) => {
      const server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        const req = http.get(`http://127.0.0.1:${port}/api/skills/analytics`, res => {
          let body = "";
          res.on("data", chunk => body += chunk);
          res.on("end", () => {
            server.close();
            assert.strictEqual(res.statusCode, 200);
            const data = JSON.parse(body);
            assert(data.success === true);
            assert.strictEqual(data.radar_axes.length, 8);
            assert(typeof data.observation_coverage.coverage_pct === "number");
            resolve();
          });
        });
        req.on("error", err => { server.close(); reject(err); });
      });
    });
  });

  await runAsync("GET /api/skills/taxonomy returns HTTP 200 with taxonomy definition", async () => {
    await new Promise((resolve, reject) => {
      const server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        const req = http.get(`http://127.0.0.1:${port}/api/skills/taxonomy`, res => {
          let body = "";
          res.on("data", chunk => body += chunk);
          res.on("end", () => {
            server.close();
            assert.strictEqual(res.statusCode, 200);
            const data = JSON.parse(body);
            assert(data.success === true);
            assert.strictEqual(Object.keys(data.taxonomy).length, 8);
            resolve();
          });
        });
        req.on("error", err => { server.close(); reject(err); });
      });
    });
  });

  console.log("\n>>> [5/5] Chat Latency & Timing Metadata");
  await runAsync("POST /api/test/chat returns reply, provider, model, timing metadata, and days", async () => {
    await new Promise((resolve, reject) => {
      const server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        const postData = JSON.stringify({ message: "What is 2 + 2?", sessionId: "test-skills-chat-" + Date.now() });
        const req = http.request({
          hostname: "127.0.0.1",
          port: port,
          path: "/api/test/chat",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData)
          }
        }, res => {
          let body = "";
          res.on("data", chunk => body += chunk);
          res.on("end", () => {
            server.close();
            assert.strictEqual(res.statusCode, 200);
            const data = JSON.parse(body);
            assert(data.success === true);
            assert(typeof data.reply === "string" && data.reply.length > 0);
            assert(typeof data.provider === "string");
            assert(data.timing && typeof data.timing.llm_ms === "number");
            assert(data.timing && typeof data.timing.total_ms === "number");
            assert(Array.isArray(data.days));
            resolve();
          });
        });
        req.on("error", err => { server.close(); reject(err); });
        req.write(postData);
        req.end();
      });
    });
  });

  console.log("====================================================");
  console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  if (failed === 0) {
    console.log("STATUS: [GREEN / PASSED] - All skills analytics tests passed!");
    process.exit(0);
  } else {
    console.error(`STATUS: [RED / FAILED] - ${failed} test(s) failed`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
